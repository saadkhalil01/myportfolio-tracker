import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, styles as s } from '../theme';
import SketchyIcon from './SketchyIcon';

const tabs = [['Overview', 'overview', 'Overview'], ['Growth', 'growth', 'Growth'],
  ['Investments', 'investments', 'Investments'], ['Liabilities', 'liabilities', 'Liabilities'],
  ['Targets', 'targets', 'Targets'], ['Stocks', 'stocks', 'Stocks']];

function GlassHighlights() {
  return <View pointerEvents="none" style={s.tabHighlights}>
    <Svg width="100%" height="100%">
      <Defs><LinearGradient id="tabSheen" x1="0%" y1="0%" x2="25%" y2="100%">
        <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.22} />
        <Stop offset="45%" stopColor="#d3fff7" stopOpacity={0.04} />
        <Stop offset="100%" stopColor="#ffffff" stopOpacity={0.1} />
      </LinearGradient></Defs>
      <Rect width="100%" height="100%" fill="url(#tabSheen)" />
    </Svg>
  </View>;
}

export default function TabBar({ active, onChange, blurTarget }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return <>
    <View style={[s.tabBar, { bottom: Math.max(insets.bottom, 12) }]}>
    <View style={s.tabGlass}>
    <BlurView pointerEvents="none" tint="dark" intensity={70} style={s.tabBlur}
      {...(Platform.OS === 'android' ? { blurTarget, blurMethod: 'dimezisBlurViewSdk31Plus' } : {})} />
    <View pointerEvents="none" style={s.tabFrost} />
    <GlassHighlights />
    <View style={s.tabBarInner}>
      {tabs.map(([name, icon, label]) => {
        const selected = active === name || (name === 'Stocks' && active === 'Holdings');
        return <Pressable key={name} accessibilityRole="tab" accessibilityState={{ selected }}
          accessibilityLabel={name} onPress={() => onChange(name)}
          style={({ pressed }) => [s.tabItem, selected && s.tabItemActive, pressed && s.pressed]}>
          <SketchyIcon name={icon} size={22} color={selected ? colors.tabActive : colors.tabText} />
          <Text style={[s.tabLabel, selected && s.tabLabelActive, { fontSize: width < 360 ? 9 : 10 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{label}</Text>
        </Pressable>;
      })}
    </View>
    </View>
    </View>
  </>;
}
