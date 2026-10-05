import { ActivityIndicator, Text, View } from 'react-native';
import { colors, styles as s } from '../theme';

export default function LaunchScreen() {
  return <View style={[s.screen, s.center]} accessibilityLabel="Loading MyPortfolio">
    <View style={s.brandRow} accessibilityLabel="MyPortfolio logo">
      <Text style={s.splashWordmark}>
        <Text style={s.wordmarkAccent}>my</Text>portfolio
      </Text>
    </View>
    <ActivityIndicator color={colors.accent} />
    <Text style={s.muted} accessibilityLiveRegion="polite">Loading your portfolio…</Text>
  </View>;
}
