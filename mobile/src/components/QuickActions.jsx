import { Pressable, Text, View } from 'react-native';
import { colors, styles as s } from '../theme';
import SketchyIcon from './SketchyIcon';

const actions = [['Holdings', 'stocks', 'Holdings'], ['Investments', 'investments', 'Investments'], ['Targets', 'targets', 'My targets']];

export default function QuickActions({ onNavigate }) {
  return <View style={s.row}>
    {actions.map(([tab, icon, label]) => <Pressable key={tab} accessibilityRole="button"
      accessibilityLabel={`Open ${label}`} onPress={() => onNavigate(tab)}
      style={({ pressed }) => [s.quickAction, pressed && s.pressed]}>
      <View style={s.actionIcon}><SketchyIcon name={icon} color={colors.accent} size={22} /></View>
      <Text style={s.quickActionLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{label}</Text>
    </Pressable>)}
  </View>;
}
