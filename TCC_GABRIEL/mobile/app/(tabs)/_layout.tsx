import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: { backgroundColor: Colors.surface, borderTopColor: Colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}>
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Check-in',
          tabBarAccessibilityLabel: 'Check-in: ler QR Code ou tag NFC para embarcar',
          tabBarIcon: ({ color }) => <MaterialIcons name="qr-code-scanner" size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: 'Rastreio',
          tabBarAccessibilityLabel: 'Rastreio: ver a localização atual da van',
          tabBarIcon: ({ color }) => <MaterialIcons name="directions-bus" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
