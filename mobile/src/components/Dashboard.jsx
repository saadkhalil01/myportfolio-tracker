import { useRef, useState } from 'react';
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
import DashboardHeader from './DashboardHeader';
import EmptyState from './EmptyState';

export default function Dashboard({ auth }) {
  const store = usePortfolio(auth.user?.id);
  const prices = useQuotes(store.data?.portfolios);
  const editorStore = { ...store, update: (change) => store.update(change, prices.quotes) };
  const [tab, setTab] = useState('Overview');
  const [target, setTarget] = useState(null);
  const scroll = useRef(null);
  const navigate = (next) => { setTab(next); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const refresh = () => Promise.all([store.refresh(), prices.refresh()]);
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.screen}>
    <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={store.busy || prices.loading} onRefresh={refresh} tintColor={colors.accent} />}>
      <DashboardHeader tab={tab} status={store.status} onNavigate={navigate} />
      {store.error ? <View style={s.card}>
        <Text accessibilityRole="alert" style={[s.text, s.negative]}>{store.error}</Text>
        <Button title="Retry sync" secondary disabled={store.busy} onPress={() => store.refresh()} />
        {store.conflict && <Button title="Review conflict" secondary onPress={() => navigate('Account')} />}
      </View> : null}
      {!store.ready && <ActivityIndicator color={colors.accent} />}
      {store.ready && <>
        {tab !== 'Account' && <View style={{ gap: 4 }}>
          <Text style={s.muted}>{prices.loading ? 'Refreshing PSX prices…' : prices.updatedAt
            ? `PSX · updated ${new Date(prices.updatedAt).toLocaleTimeString()}` : 'Pull down to refresh prices'}</Text>
          {prices.error ? <Text style={[s.text, s.negative]}>{prices.error}</Text> : null}
        </View>}
        {tab === 'Overview' && <Overview data={store.data} portfolios={store.data.portfolios} quotes={prices.quotes} onNavigate={navigate} />}
        {tab === 'Holdings' && <>
          <Button title="+ Add portfolio" disabled={store.busy} onPress={() => setTarget({ kind: 'portfolio' })} />
          {store.data.portfolios.map((p) => <PortfolioCard key={p.id} portfolio={p} quotes={prices.quotes}
            edit={setTarget} disabled={store.busy} />)}
          {!store.data.portfolios.length && <EmptyState icon="stocks" title="Your first portfolio starts here" description="Add a portfolio, then record your stocks and brokerage cash." />}
        </>}
        {['Investments', 'Liabilities', 'Targets'].includes(tab) && <Records tab={tab} data={store.data} quotes={prices.quotes} edit={setTarget} disabled={store.busy} />}
        {['Growth', 'Stocks'].includes(tab) && <>
          {tab === 'Stocks' && <Button title="Manage portfolios & holdings" secondary onPress={() => navigate('Holdings')} />}
          <Sections tab={tab} data={store.data} quotes={prices.quotes} store={editorStore} />
        </>}
        {tab === 'Account' && <><Account auth={auth} store={editorStore} /><Backup store={editorStore} /></>}
      </>}
    </ScrollView>
    <TabBar active={tab} onChange={navigate} />
    {target && (['holding', 'portfolio'].includes(target.kind)
      ? <Editor target={target} store={editorStore} close={() => setTarget(null)} />
      : <RecordEditor target={target} store={editorStore} close={() => setTarget(null)} />)}
  </SafeAreaView>;
}
