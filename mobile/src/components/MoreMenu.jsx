import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, styles as s } from '../theme';
import SketchyIcon from './SketchyIcon';
import { Button } from './UI';

const destinations = [
  ['Targets', 'targets', 'Track your goals and funding progress'],
  ['Liabilities', 'liabilities', 'Manage outstanding balances'],
  ['Holdings', 'stocks', 'Edit portfolios, stocks and cash'],
  ['Account', 'account', 'Profile, cloud sync and backups'],
];

export default function MoreMenu({ active, close, onChange }) {
  const insets = useSafeAreaInsets();
  const navigate = (name) => { close(); onChange(name); };
  return <Modal transparent animationType="slide" onRequestClose={close}>
    <View style={s.sheetBackdrop}>
      <Pressable style={s.sheetDismiss} accessibilityRole="button" accessibilityLabel="Close navigation menu" onPress={close} />
      <View accessibilityViewIsModal style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={s.sheetHandle} />
        <Text accessibilityRole="header" style={s.heading}>More from your portfolio</Text>
        {destinations.map(([name, icon, description]) => <Pressable key={name} accessibilityRole="button"
          accessibilityState={{ selected: active === name }} onPress={() => navigate(name)}
          style={({ pressed }) => [s.menuItem, active === name && s.tabItemActive, pressed && s.pressed]}>
          <View style={s.actionIcon}><SketchyIcon name={icon} size={23} color={colors.accent} /></View>
          <View style={s.grow}><Text style={s.number}>{name}</Text><Text style={s.muted}>{description}</Text></View>
          <Text style={s.muted}>›</Text>
        </Pressable>)}
        <Button title="Close" secondary onPress={close} />
      </View>
    </View>
  </Modal>;
}
