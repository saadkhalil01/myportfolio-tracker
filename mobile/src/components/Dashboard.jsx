import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePortfolio } from '../hooks/usePortfolio';
import { useQuotes } from '../hooks/useQuotes';
import { colors, styles as s } from '../theme';
import { Button } from './UI';
import Overview from './Overview';
import PortfolioCard from './PortfolioCard';
import Account from './Account';
import Editor from './Editor';
import Sections from './Sections';
import Records from './Records';
import RecordEditor from './RecordEditor';
import Backup from './Backup';
import TabBar from './TabBar';

export default function Dashboard({ auth }) {
  const store = usePortfolio(auth.user?.id);
  const prices = useQuotes(store.data?.portfolios);
  const editorStore = { ...store, update: (change) => store.update(change, prices.quotes) };
  const [tab, setTab] = useState('Overview');
  const [target, setTarget] = useState(null);
  const refresh = () => Promise.all([store.refresh(), prices.refresh()]);
  return <SafeAreaView style={s.screen}>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={store.busy || prices.loading} onRefresh={refresh} tintColor={colors.accent} />}>
      <View style={s.between}>
        <View style={[s.grow, { gap: 5 }]}>
          <Text style={s.label}>MYPORTFOLIO</Text>
          <Text style={s.title}>{tab === 'Overview' ? 'Your wealth, in view.' : tab}</Text>
          <Text style={s.muted}>{store.status}</Text>
        </View>
        <Button title={tab === 'Account' ? 'Done' : 'Account'} secondary
          onPress={() => setTab(tab === 'Account' ? 'Overview' : 'Account')} />
      </View>
      {store.error ? <View style={s.card}>
        <Text accessibilityRole="alert" style={s.negative}>{store.error}</Text>
        <Button title="Retry sync" secondary disabled={store.busy} onPress={() => store.refresh()} />
        {store.conflict && <Button title="Review conflict" secondary onPress={() => setTab('Account')} />}
      </View> : null}
      {!store.ready && <ActivityIndicator color={colors.accent} />}
      {store.ready && <>
        {tab !== 'Account' && <View style={{ gap: 4 }}>
          <Text style={s.muted}>{prices.loading ? 'Refreshing PSX prices…' : prices.updatedAt
            ? `PSX · updated ${new Date(prices.updatedAt).toLocaleTimeString()}` : 'Pull down to refresh prices'}</Text>
          {prices.error ? <Text style={s.negative}>{prices.error}</Text> : null}
        </View>}
        {tab === 'Overview' && <Overview data={store.data} portfolios={store.data.portfolios} quotes={prices.quotes} />}
        {tab === 'Holdings' && <>
          <Button title="+ Add portfolio" disabled={store.busy} onPress={() => setTarget({ kind: 'portfolio' })} />
          {store.data.portfolios.map((p) => <PortfolioCard key={p.id} portfolio={p} quotes={prices.quotes}
            edit={setTarget} disabled={store.busy} />)}
          {!store.data.portfolios.length && <Text style={s.muted}>Create a portfolio to start tracking your PSX holdings.</Text>}
        </>}
        {['Investments', 'Liabilities', 'Targets'].includes(tab) && <Records tab={tab} data={store.data} quotes={prices.quotes} edit={setTarget} disabled={store.busy} />}
        {['Growth', 'Stocks'].includes(tab) && <>
          {tab === 'Stocks' && <Button title="Manage portfolios & holdings" secondary onPress={() => setTab('Holdings')} />}
          <Sections tab={tab} data={store.data} quotes={prices.quotes} store={editorStore} />
        </>}
        {tab === 'Account' && <><Account auth={auth} store={editorStore} /><Backup store={editorStore} /></>}
      </>}
    </ScrollView>
    <TabBar active={tab} onChange={setTab} />
    {target && (['holding', 'portfolio'].includes(target.kind)
      ? <Editor target={target} store={editorStore} close={() => setTarget(null)} />
      : <RecordEditor target={target} store={editorStore} close={() => setTarget(null)} />)}
  </SafeAreaView>;
}
