import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, usePathname } from 'expo-router';
import { useMemo, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettings } from '@/services/settings';
import { usePerfil } from '@/services/perfil';
import { hora } from '@/services/api';

type Icon = keyof typeof MaterialIcons.glyphMap;
export function useUI() {
  const { colors: c, settings: s } = useSettings();
  return useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background },
    content: { padding: 20, gap: 18, width: '100%', maxWidth: 1120, alignSelf: 'center', flexGrow: 1 },
    card: { backgroundColor: c.surface, borderRadius: 16, padding: 20, gap: 12, borderWidth: s.mode === 'contrast' ? 2 : 1, borderColor: c.border, boxShadow: s.mode === 'light' ? '0px 3px 12px rgba(21,38,62,0.04)' : 'none' },
    title: { fontSize: 28 * s.scale, fontWeight: '700', color: c.text },
    subtitle: { fontSize: 20 * s.scale, fontWeight: '700', color: c.text },
    body: { fontSize: 16 * s.scale, color: c.muted, lineHeight: 25 * s.scale },
    label: { fontSize: 13 * s.scale, fontWeight: '600', color: c.muted, lineHeight: 20 * s.scale },
    metric: { fontSize: 36 * s.scale, fontWeight: '700', color: c.text },
    input: { minHeight: s.easyTouch ? 60 : 50, borderWidth: s.mode === 'contrast' ? 2 : 1, borderColor: c.border, borderRadius: 12, padding: 12, fontSize: 16 * s.scale, color: c.text, backgroundColor: c.background },
    button: { minHeight: s.easyTouch ? 56 : 48, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: c.primary, borderWidth: s.mode === 'contrast' ? 2 : 0, borderColor: c.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
    buttonText: { color: c.onPrimary, fontSize: 15 * s.scale, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
    warning: { color: c.warning, fontSize: 16 * s.scale, fontWeight: '600', lineHeight: 24 * s.scale },
    success: { color: c.success, fontSize: 16 * s.scale, fontWeight: '600', lineHeight: 24 * s.scale },
    error: { color: c.danger, fontSize: 15 * s.scale, lineHeight: 23 * s.scale },
  }), [c, s]);
}
export function Botao({ children, onPress, disabled, secondary, danger, label, hint, icon = 'arrow-forward', busy = false }: {
  children: ReactNode; onPress: () => void; disabled?: boolean; secondary?: boolean; danger?: boolean; label?: string; hint?: string; icon?: Icon; busy?: boolean;
}) {
  const ui = useUI(); const { colors: c, vibrate } = useSettings();
  const color = secondary ? c.primary : danger ? c.surface : c.onPrimary;
  return <Pressable onPress={() => { vibrate(); onPress(); }} disabled={disabled || busy} accessibilityRole="button"
    accessibilityLabel={label || (typeof children === 'string' ? children : undefined)}
    accessibilityHint={hint} accessibilityState={{ disabled: !!disabled || busy, busy }}
    style={({ pressed }) => [ui.button, secondary && { backgroundColor: c.tint }, danger && { backgroundColor: c.danger }, (disabled || busy) && { opacity: .55 }, pressed && { opacity: .75 }]}>
    {busy ? <ActivityIndicator color={color} /> : <MaterialIcons name={icon} color={color} size={22} />}
    <Text style={[ui.buttonText, { color }]}>{children}</Text>
  </Pressable>;
}
export function Card({ children }: { children: ReactNode }) { const ui = useUI(); return <View style={ui.card}>{children}</View>; }
export function Campo({ label, ...props }: TextInputProps & { label: string }) {
  const ui = useUI(); const { colors: c } = useSettings();
  return <View style={{ gap: 6 }}><Text style={ui.label}>{label}</Text><TextInput {...props} style={[ui.input, props.style]} accessibilityLabel={label} placeholderTextColor={c.muted} /></View>;
}
export function Page({ children }: { children: ReactNode }) {
  const ui = useUI();
  return <SafeAreaView style={ui.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>{children}</ScrollView></SafeAreaView>;
}
export function Header({ title, subtitle = 'ROTA UNIVERSITÁRIA', back = false }: { title: string; subtitle?: string; back?: boolean }) {
  const ui = useUI(); const path = usePathname();
  return <View style={[ui.row, { justifyContent: 'space-between', paddingVertical: 8 }]}>
    <View style={{ flex: 1, minWidth: 190 }}><Text style={ui.label}>{subtitle}</Text><Text style={ui.title} accessibilityRole="header">{title}</Text></View>
    <View style={ui.row}>{back && <Botao secondary icon="arrow-back" onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>Voltar</Botao>}
      {path !== '/configuracoes' && <Botao secondary icon="settings" label="Configurações e acessibilidade" onPress={() => router.push('/configuracoes')}>Ajustes</Botao>}
      {path !== '/ajuda' && <Botao secondary icon="help-outline" label="Central de ajuda" onPress={() => router.push('/ajuda')}>Ajuda</Botao>}</View>
  </View>;
}
export function AvisoBanner() {
  const { perfil, erro } = usePerfil(); const ui = useUI(); const aviso = perfil?.linha.aviso;
  if (!aviso && !erro) return null;
  return <Card>{erro ? <Text style={ui.error} accessibilityLiveRegion="polite">⚠ {erro}</Text> : null}
    {aviso && <View accessibilityLiveRegion="polite"><Text style={ui.warning}>◉ Aviso da sua linha</Text>
      <Text style={ui.body}>{aviso.mensagem}</Text><Text style={ui.label}>{aviso.motorista} · {hora(aviso.criadoEm)}{erro ? ' · Último aviso recebido' : ''}</Text></View>}
  </Card>;
}
export function Situacao({ status }: { status: string }) {
  const ui = useUI();
  return <Text style={status === 'NA_FACULDADE' ? ui.warning : ui.success}>{
    status === 'NA_FACULDADE' ? '◷ Falta voltar' : status === 'EMBARCADO_VOLTA' ? '✓ Volta confirmada' : '↗ Volta dispensada'}</Text>;
}
