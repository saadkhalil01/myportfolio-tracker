import { Text, View } from 'react-native';
import { styles as s } from '../theme';
import { Button } from './UI';

const descriptions = {
  Overview: 'A clear view of everything you own.',
  Holdings: 'Your portfolios, cash and stock positions.',
  Growth: 'See how your wealth changes over time.',
  Investments: 'Every investment, in one place.',
  Liabilities: 'Keep track of what you owe.',
  Targets: 'Turn your plans into measurable progress.',
  Stocks: 'Your PSX holdings at a glance.',
  Account: 'Your profile, sync and backups.',
};

export default function DashboardHeader({ tab, status, onNavigate }) {
  return <View style={s.header}>
    <View style={s.between}>
      <Text accessibilityLabel="MyPortfolio" style={[s.wordmark, s.grow]} numberOfLines={1} adjustsFontSizeToFit>
        my<Text style={s.wordmarkAccent}>portfolio</Text>
      </Text>
      <Button title={tab === 'Account' ? 'Done' : 'Account'} secondary
        onPress={() => onNavigate(tab === 'Account' ? 'Overview' : 'Account')} />
    </View>
    <View style={s.field}>
      <Text accessibilityRole="header" style={s.title}>{tab === 'Overview' ? 'Your overview' : tab}</Text>
      <Text style={s.muted}>{descriptions[tab]}</Text>
    </View>
    <View style={s.statusRow}><View style={s.statusDot} /><Text style={[s.muted, s.grow]}>{status}</Text></View>
  </View>;
}
