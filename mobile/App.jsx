import { ActivityIndicator, StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from './src/hooks/useAuth';
import { colors, styles as s } from './src/theme';
import Dashboard from './src/components/Dashboard';

export default function App() {
  const auth = useAuth();
  return <SafeAreaProvider>
    <StatusBar barStyle="light-content" />
    {auth.loading ? <View style={[s.screen, s.center]}><ActivityIndicator color={colors.accent} /></View>
      : <Dashboard key={auth.user?.id || 'guest'} auth={auth} />}
  </SafeAreaProvider>;
}
