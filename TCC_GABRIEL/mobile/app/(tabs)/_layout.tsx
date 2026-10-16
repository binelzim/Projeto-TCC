import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/services/auth';
import { useSettings } from '@/services/settings';
export default function TabLayout() {
  const { sessao } = useAuth(); const { colors: c, settings, vibrate } = useSettings();
  if (!sessao) return <Redirect href="/" />;
  if (sessao.role !== 'ESTUDANTE') return <Redirect href="/motorista" />;
  return <Tabs screenListeners={{ tabPress: vibrate }} screenOptions={{ headerShown: false,
    tabBarActiveTintColor: c.primary, tabBarInactiveTintColor: c.muted,
    tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.border, height: settings.scale > 1 ? 86 : 70, paddingBottom: 10 },
    tabBarLabelStyle: { fontSize: 12 * settings.scale, fontWeight: '600' } }}>
    <Tabs.Screen name="scanner" options={{ title: 'Embarque', tabBarAccessibilityLabel: 'Embarque: ida e volta',
      tabBarIcon: ({ color }) => <MaterialIcons name="qr-code-scanner" color={color} size={25} /> }} />
    <Tabs.Screen name="mapa" options={{ title: 'Minha linha', tabBarAccessibilityLabel: 'Minha linha: paradas e rastreio',
      tabBarIcon: ({ color }) => <MaterialIcons name="route" color={color} size={25} /> }} />
    <Tabs.Screen name="perfil" options={{ title: 'Carteirinha', tabBarAccessibilityLabel: 'Carteirinha e histórico',
      tabBarIcon: ({ color }) => <MaterialIcons name="badge" color={color} size={25} /> }} />
  </Tabs>;
}
