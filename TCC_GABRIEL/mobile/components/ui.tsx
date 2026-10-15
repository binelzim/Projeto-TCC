import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/theme';

export function Botao({ children, onPress, disabled, secondary = false, danger = false, label }: {
  children: ReactNode; onPress: () => void; disabled?: boolean; secondary?: boolean; danger?: boolean; label?: string;
}) {
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
    accessibilityLabel={label || (typeof children === 'string' ? children : undefined)}
    accessibilityState={{ disabled: !!disabled }}
    style={({ pressed }) => [ui.button, secondary && ui.secondary, danger && ui.danger,
      disabled && { opacity: 0.5 }, pressed && { opacity: 0.75 }]}>
    <Text style={[ui.buttonText, secondary && { color: Colors.primary }]}>{children}</Text>
  </Pressable>;
}
export function Card({ children }: { children: ReactNode }) { return <View style={ui.card}>{children}</View>; }
export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f6fb' },
  content: { padding: 20, gap: 18, width: '100%', maxWidth: 740, alignSelf: 'center', flexGrow: 1 },
  card: { backgroundColor: 'white', borderRadius: 18, padding: 20, gap: 12, borderWidth: 1, borderColor: '#e0e7f0' },
  title: { fontSize: 28, fontWeight: '700', color: '#15263e' },
  subtitle: { fontSize: 20, fontWeight: '700', color: '#15263e' },
  body: { fontSize: 16, color: '#475569', lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569' },
  input: { minHeight: 52, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, fontSize: 16, color: '#15263e' },
  button: { minHeight: 48, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#0062cc', alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: '#e8f1ff' }, danger: { backgroundColor: '#b42318' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  warning: { color: '#92400e', fontSize: 16, fontWeight: '600' },
  success: { color: '#166534', fontSize: 16, fontWeight: '600' },
  error: { color: '#b42318', fontSize: 15, lineHeight: 22 },
});

