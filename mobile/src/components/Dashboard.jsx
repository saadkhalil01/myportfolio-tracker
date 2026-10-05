import { useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurTargetView } from 'expo-blur';
import { usePortfolio } from '../hooks/usePortfolio';
import { useQuotes } from '../hooks/useQuotes';
import { colors, styles as s } from '../theme';
import { Button } from './UI';
import Dividends from './Dividends';
import Overview from './Overview';
import Holdings from './Holdings';
import Account from './Account';
import Editor from './Editor';
import Sections from './Sections';
import Records from './Records';
import RecordEditor from './RecordEditor';
import Backup from './Backup';
import TabBar from './TabBar';
import DashboardHeader from './DashboardHeader';

export default function Dashboard({ auth }) {
  const insets = useSafeAreaInsets();
  const store = usePortfolio(auth.user?.id);
  const prices = useQuotes(store.data?.portfolios);
  const editorStore = { ...store, update: (change) => store.update(change, prices.quotes) };
  const [tab, setTab] = useState('Overview');
  const [target, setTarget] = useState(null);
  const scroll = useRef(null);
  const blurTarget = useRef(null);
  const navigate = (next) => { setTab(next); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const refresh = () => Promise.all([store.refresh(), prices.refresh()]);
  return <SafeAreaView edges={['top', 'left', 'right']} style={[s.screen, tab === 'Overview' && s.homeScreen]}>
    <BlurTargetView ref={blurTarget} style={s.grow} collapsable={false}>
    <ScrollView ref={scroll} showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, tab === 'Overview' && s.homeContent, { paddingBottom: 108 + insets.bottom }]} keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets
      refreshControl={<RefreshControl refreshing={store.busy || prices.loading} onRefresh={refresh} tintColor={colors.accent} />}>
      <DashboardHeader tab={tab} status={store.status} onNavigate={navigate} data={store.data} quotes={prices.quotes} user={auth.user} />
      {store.error ? <View style={s.errorCard}>
        <Text accessibilityRole="alert" style={[s.text, s.negative]}>{store.error}</Text>
        <Button title="Retry sync" secondary disabled={store.busy} onPress={() => store.refresh()} />
        {store.conflict && <Button title="Review conflict" secondary onPress={() => navigate('Account')} />}
      </View> : null}
      {!store.ready && <ActivityIndicator color={colors.accent} />}
      {store.ready && <>
        {['Stocks', 'Holdings'].includes(tab) && <View style={{ gap: 4 }}>
          <Text style={s.muted}>{prices.loading ? 'Refreshing PSX prices…' : prices.updatedAt
            ? `PSX · updated ${new Date(prices.updatedAt).toLocaleTimeString()}` : 'Pull down to refresh prices'}</Text>
          {prices.error ? <Text style={[s.text, s.negative]}>{prices.error}</Text> : null}
        </View>}
        {tab === 'Overview' && <Overview data={store.data} quotes={prices.quotes} store={editorStore} onNavigate={navigate} />}
        {tab === 'Holdings' && <Holdings portfolios={store.data.portfolios} quotes={prices.quotes} edit={setTarget} disabled={store.busy} />}
        {['Investments', 'Liabilities', 'Targets'].includes(tab) && <Records tab={tab} data={store.data} quotes={prices.quotes} edit={setTarget} disabled={store.busy} />}
        {['Growth', 'Stocks'].includes(tab) && <>
          {tab === 'Stocks' && <Button title="Manage portfolios & holdings" secondary onPress={() => navigate('Holdings')} />}
          <Sections tab={tab} data={store.data} quotes={prices.quotes} store={editorStore} />
        </>}
        {tab === 'Stocks' && <Dividends data={store.data} edit={setTarget} store={editorStore} disabled={store.busy} />}
        {tab === 'Account' && <><Account auth={auth} store={editorStore} /><Backup store={editorStore} /></>}
      </>}
    </ScrollView>
    </BlurTargetView>
    <TabBar active={tab} onChange={navigate} blurTarget={blurTarget} />
    {target && (['holding', 'portfolio'].includes(target.kind)
      ? <Editor target={target} store={editorStore} close={() => setTarget(null)} />
      : <RecordEditor target={target} store={editorStore} close={() => setTarget(null)} />)}
  </SafeAreaView>;
}
