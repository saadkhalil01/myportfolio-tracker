import { Pressable, Text, View } from 'react-native';
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
  return <BlurView intensity={72} tint="dark" style={s.tabBar}>
    <View style={s.tabBarInner}>
      {tabs.map(([name, icon]) => {
        const selected = active === name;
        return <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected }}
          accessibilityLabel={name} onPress={() => onChange(name)}
          style={({ pressed }) => [s.tabItem, selected && s.tabItemActive, pressed && s.disabled]}>
          <SketchyIcon name={icon} size={28} color={selected ? colors.tabActive : colors.tabText} />
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}
            style={[s.tabLabel, selected && s.tabLabelActive]}>{name}</Text>
        </Pressable>;
      })}
    </View>
  </BlurView>;
}
