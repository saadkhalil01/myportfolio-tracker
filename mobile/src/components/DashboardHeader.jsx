import { Image, Pressable, Text, View } from 'react-native';
import { colors, styles as s } from '../theme';
import { wealth } from '../lib/model.mjs';
import SketchyIcon from './SketchyIcon';

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

export default function DashboardHeader({ tab, status, onNavigate, data, quotes, user }) {
  const value = data ? wealth(data, quotes).valuation : 0;
  const avatar = user?.user_metadata?.avatar_url;
  return <View style={tab === 'Overview' ? s.homeHeader : s.header}>
    <View style={s.between}>
      <View style={[s.field, s.grow]} accessibilityLabel="MyPortfolio">
        <Text style={s.wordmark} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          <Text style={s.wordmarkAccent}>my</Text>portfolio
        </Text>
        <Text style={s.muted}>Portfolio ID: <Text style={s.homePortfolioId}>MP-{String(Math.round(value || 782400)).slice(0, 6)}KL</Text></Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Manage portfolios" onPress={() => onNavigate('Holdings')}
        style={({ pressed }) => [s.accountButton, pressed && s.pressed]}>
        <SketchyIcon name="menu" size={22} color={colors.muted} />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={tab === 'Account' ? 'Back to overview' : 'Open account'}
        onPress={() => onNavigate(tab === 'Account' ? 'Overview' : 'Account')}
        style={({ pressed }) => [s.homeAvatarButton, pressed && s.pressed]}>
        {avatar ? <Image source={{ uri: avatar }} style={s.homeAvatar} /> : <SketchyIcon name={tab === 'Account' ? 'overview' : 'account'} size={23} color={colors.accent} />}
      </Pressable>
    </View>
    {tab !== 'Overview' && <View style={s.field}>
      <Text accessibilityRole="header" style={s.title}>{tab === 'Overview' ? 'Your overview' : tab}</Text>
      <Text style={s.muted}>{descriptions[tab]}</Text>
    </View>}
    {tab !== 'Overview' && <View style={s.statusRow}><View style={s.statusDot} /><Text style={[s.muted, s.grow]}>{status}</Text></View>}
  </View>;
}
