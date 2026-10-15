import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ToastProvider } from '@/components/toast';
import { AuthProvider } from '@/services/auth';

export default function Layout() {
  return <SafeAreaProvider><AuthProvider><ToastProvider>
    <StatusBar style="dark" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#f3f6fb' } }}>
      <Stack.Screen name="index" /><Stack.Screen name="(tabs)" /><Stack.Screen name="motorista" />
    </Stack>
  </ToastProvider></AuthProvider></SafeAreaProvider>;
}

