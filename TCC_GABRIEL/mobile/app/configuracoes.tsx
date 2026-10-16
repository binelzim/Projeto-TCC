import { router } from 'expo-router';
import { Switch, Text, View } from 'react-native';
import { Botao, Card, Header, Page, useUI } from '@/components/ui';
import { useSettings } from '@/services/settings';
import type { ThemeMode } from '@/constants/theme';

export default function Configuracoes() {
  const ui = useUI(); const { colors: c, settings, update, announce } = useSettings();
  const toggles = [
    ['easyTouch', 'Toque facilitado', 'Botões com altura mínima de 56 dp.'],
    ['voice', 'Anunciar ações em voz alta', 'Lê confirmações de embarque, avisos e passageiros aguardados.'],
    ['haptics', 'Vibração nos toques', 'Retorno tátil nos aparelhos compatíveis.'],
  ] as const;
  return <Page><Header title="Configurações e acessibilidade" back />
    <Card><Text style={ui.subtitle}>Aparência</Text><Text style={ui.body}>Escolha o tema mais confortável para sua viagem.</Text><View style={ui.row}>
      {([['light', 'Claro', 'light-mode'], ['dark', 'Escuro', 'dark-mode'], ['contrast', 'Alto contraste', 'contrast']] as const).map(([mode, label, icon]) =>
        <Botao key={mode} secondary={settings.mode !== mode} icon={icon} label={'Tema ' + label + (settings.mode === mode ? ', selecionado' : '')} onPress={() => update({ mode: mode as ThemeMode })}>{label}</Botao>)}
    </View></Card>
    <Card><Text style={ui.subtitle}>Tamanho da fonte</Text><View style={ui.row}>{[[1, 'Normal · 100%'], [1.2, 'Grande · 120%'], [1.4, 'Extra grande · 140%']].map(([scale, label]) =>
      <Botao key={scale} secondary={settings.scale !== scale} icon="text-fields" onPress={() => update({ scale: Number(scale) })}>{String(label)}</Botao>)}</View>
      <Text style={ui.body}>Prévia: seu ônibus está no ponto de embarque.</Text><Text style={ui.success}>✓ Volta confirmada</Text><Text style={ui.warning}>◷ Ainda faltam 2 alunos</Text></Card>
    <Card>{toggles.map(([key, label, description]) => <View key={key} style={[ui.row, { justifyContent: 'space-between', paddingVertical: 10 }]}>
      <View style={{ flex: 1, minWidth: 160 }}><Text style={ui.subtitle}>{label}</Text><Text style={ui.body}>{description}</Text></View>
      <Switch accessibilityLabel={label} accessibilityHint={description}
        value={settings[key]} onValueChange={value => update({ [key]: value })} trackColor={{ false: c.border, true: c.primary }} thumbColor={c.surface} />
    </View>)}<Botao secondary icon="volume-up" disabled={!settings.voice} onPress={() => announce('Olá! Os avisos por voz estão ativados. Boa viagem!')}>Ouvir exemplo de voz</Botao>
      <Text style={ui.label}>A voz depende do suporte e volume do aparelho. No navegador, pode exigir uma interação inicial.</Text></Card>
    <Text style={ui.body}>Suas preferências são salvas neste aparelho. Os estados também usam símbolos e palavras para não depender apenas das cores.</Text>
    <Botao secondary icon="help-outline" onPress={() => router.push('/ajuda')}>Abrir Central de Ajuda</Botao>
  </Page>;
}
