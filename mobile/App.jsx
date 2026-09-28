import { StatusBar, View } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from './src/hooks/useAuth';
import { styles as s } from './src/theme';
import Dashboard from './src/components/Dashboard';
import LaunchScreen from './src/components/LaunchScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 300, fade: true });

export default function App() {
  const auth = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    'GoogleSans-Regular': require('./assets/fonts/GoogleSans-Regular.ttf'),
    'GoogleSans-SemiBold': require('./assets/fonts/GoogleSans-SemiBold.ttf'),
    'GoogleSans-Bold': require('./assets/fonts/GoogleSans-Bold.ttf'),
  });
  return <SafeAreaProvider>
    <StatusBar barStyle="light-content" />
    {auth.loading || (!fontsLoaded && !fontError) ? <LaunchScreen /> : <View style={s.screen}
      onLayout={() => { SplashScreen.hideAsync().catch(() => {}); }}>
      <Dashboard key={auth.user?.id || 'guest'} auth={auth} />
    </View>}
  </SafeAreaProvider>;
}
