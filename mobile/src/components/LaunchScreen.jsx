import { ActivityIndicator, Image, Text, View } from 'react-native';
import { colors, styles as s } from '../theme';

export default function LaunchScreen() {
  return <View style={[s.screen, s.center]} accessibilityLabel="Loading MyPortfolio">
    <Image source={require('../../assets/icon.png')} style={s.splashLogo}
      resizeMode="contain" accessibilityLabel="MyPortfolio logo" />
    <ActivityIndicator color={colors.accent} />
    <Text style={s.muted} accessibilityLiveRegion="polite">Loading your portfolio…</Text>
  </View>;
}
