import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { colors, styles as s } from '../theme';
import SketchyIcon from './SketchyIcon';

const tabs = [
  ['Overview', 'overview'],
  ['Growth', 'growth'],
  ['Investments', 'investments'],
  ['Liabilities', 'liabilities'],
  ['Targets', 'targets'],
  ['Stocks', 'stocks'],
];

export default function TabBar({ active, onChange }) {
  const insets = useSafeAreaInsets();
  return <BlurView intensity={72} tint="dark" style={[s.tabBar, { bottom: Math.max(insets.bottom, 12) }]}>
    <View style={s.tabBarInner}>
      {tabs.map(([name, icon]) => {
        const selected = active === name || (active === 'Holdings' && name === 'Stocks');
        return <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected }}
          accessibilityLabel={name} onPress={() => onChange(name)}
          style={({ pressed }) => [s.tabItem, selected && s.tabItemActive, pressed && s.pressed]}>
          <SketchyIcon name={icon} size={24} color={selected ? colors.tabActive : colors.tabText} />
          {selected && <View style={s.tabIndicator} />}
        </Pressable>;
      })}
    </View>
  </BlurView>;
}
