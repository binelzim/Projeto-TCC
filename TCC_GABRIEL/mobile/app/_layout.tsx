import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/services/auth';
import { PerfilProvider } from '@/services/perfil';
import { SettingsProvider, useSettings } from '@/services/settings';
function Screens() {
  const { colors, settings } = useSettings();
  return <><StatusBar style={settings.mode === 'light' ? 'dark' : 'light'} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} /></>;
}
export default function Layout() {
  return <SafeAreaProvider><SettingsProvider><AuthProvider><PerfilProvider><Screens /></PerfilProvider></AuthProvider></SettingsProvider></SafeAreaProvider>;
}
