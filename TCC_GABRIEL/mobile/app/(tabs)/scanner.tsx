import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useIsFocused, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Colors, MIN_TOUCH, Radius, Spacing, Typography } from '@/constants/theme';
import { mensagemDeErro, PLACA_VEICULO, realizarCheckIn, type MetodoValidacao } from '@/services/api';

// IMPORTAÇÃO DO NFC REMOVIDA TEMPORARIAMENTE PARA TESTAR NO EXPO GO
// import NfcManager, { NfcEvents } from 'react-native-nfc-manager';

/** Tempo até a câmera voltar a aceitar leituras depois de um check-in. */
const INTERVALO_ENTRE_LEITURAS_MS = 2500;
const TAMANHO_MOLDURA = 240;

export default function Scanner() {
  const [permissao, solicitarPermissao] = useCameraPermissions();
  const [processando, setProcessando] = useState(false);
  const travaLeitura = useRef(false);
  const timerDesbloqueio = useRef<ReturnType<typeof setTimeout> | null>(null);
  const telaEmFoco = useIsFocused();
  const mostrarToast = useToast();
  const { nome } = useLocalSearchParams<{ nome?: string }>();

  useEffect(() => () => {
    if (timerDesbloqueio.current) clearTimeout(timerDesbloqueio.current);
  }, []);

  const processarCheckIn = async (token: string, metodo: MetodoValidacao) => {
    // A câmera dispara vários eventos por segundo; a ref bloqueia leituras repetidas na hora.
    if (travaLeitura.current) return;
    travaLeitura.current = true;
    setProcessando(true);

    try {
      await realizarCheckIn({ tokenIdentificador: token, placaVeiculo: PLACA_VEICULO, metodo });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      mostrarToast('sucesso', 'Check-in aprovado', 'Boa viagem! Seu embarque foi registrado.');
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      mostrarToast('erro', 'Acesso negado', mensagemDeErro(error, 'Falha de comunicação com o servidor.'));
    } finally {
      setProcessando(false);
      timerDesbloqueio.current = setTimeout(() => {
        travaLeitura.current = false;
      }, INTERVALO_ENTRE_LEITURAS_MS);
    }
  };

  const handleBarCodeScanned = ({ data }: BarcodeScanningResult) => {
    processarCheckIn(data, 'QR_CODE');
  };

  const iniciarLeituraNFC = () => {
    mostrarToast(
      'info',
      'NFC indisponível no Expo Go',
      'Na versão final compilada (APK), a leitura por aproximação estará ativa.'
    );
  };

  if (!permissao) {
    return (
      <EstadoVazio icone="photo-camera" titulo="Preparando a câmera...">
        <ActivityIndicator size="large" color={Colors.primary} />
      </EstadoVazio>
    );
  }

  if (!permissao.granted) {
    return (
      <EstadoVazio
        icone="no-photography"
        titulo="Precisamos da sua câmera"
        descricao="A câmera é usada apenas para ler o QR Code da van no momento do embarque.">
        <Pressable
          style={({ pressed }) => [styles.botaoPrimario, pressed && styles.botaoPressionado]}
          onPress={permissao.canAskAgain ? solicitarPermissao : () => Linking.openSettings()}
          accessibilityRole="button"
          accessibilityLabel={
            permissao.canAskAgain ? 'Permitir acesso à câmera' : 'Abrir configurações do aparelho para liberar a câmera'
          }>
          <Text style={Typography.button}>
            {permissao.canAskAgain ? 'Permitir câmera' : 'Abrir configurações'}
          </Text>
        </Pressable>
      </EstadoVazio>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraArea}>
        {telaEmFoco && (
          <CameraView
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={processando ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            accessible
            accessibilityLabel="Visualização da câmera para leitura do QR Code"
          />
        )}

        {/* Máscara: escurece tudo ao redor da área de leitura */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none" importantForAccessibility="no-hide-descendants">
          <View style={styles.mascara} />
          <View style={styles.linhaCentral}>
            <View style={styles.mascara} />
            <View style={styles.moldura}>
              <View style={[styles.canto, styles.cantoSupEsq]} />
              <View style={[styles.canto, styles.cantoSupDir]} />
              <View style={[styles.canto, styles.cantoInfEsq]} />
              <View style={[styles.canto, styles.cantoInfDir]} />
              {processando && <ActivityIndicator size="large" color={Colors.onPrimary} />}
            </View>
            <View style={styles.mascara} />
          </View>
          <View style={[styles.mascara, styles.mascaraInferior]}>
            <Text style={styles.dica}>
              {processando ? 'Validando embarque...' : 'Alinhe o QR Code dentro da moldura'}
            </Text>
          </View>
        </View>

        <SafeAreaView edges={['top']} style={styles.topo} pointerEvents="none">
          <Text style={styles.saudacao} accessibilityRole="header">
            {nome ? `Olá, ${nome}` : 'Check-in'}
          </Text>
          <View style={styles.chipPlaca}>
            <MaterialIcons name="directions-bus" size={16} color={Colors.onPrimary} />
            <Text style={styles.textoPlaca}>Van {PLACA_VEICULO}</Text>
          </View>
        </SafeAreaView>
      </View>

      <View style={styles.rodape}>
        <Text style={styles.textoRodape}>Não tem QR Code? Use sua carteirinha.</Text>
        <Pressable
          style={({ pressed }) => [styles.botaoPrimario, styles.botaoNfc, pressed && styles.botaoPressionado]}
          onPress={iniciarLeituraNFC}
          accessibilityRole="button"
          accessibilityLabel="Aproximar tag NFC da carteirinha para fazer check-in">
          <MaterialIcons name="nfc" size={22} color={Colors.onPrimary} />
          <Text style={Typography.button}>Aproximar Tag NFC</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EstadoVazio({
  icone,
  titulo,
  descricao,
  children,
}: {
  icone: keyof typeof MaterialIcons.glyphMap;
  titulo: string;
  descricao?: string;
  children?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.estadoVazio}>
      <View style={styles.estadoVazioIcone}>
        <MaterialIcons name={icone} size={44} color={Colors.primary} />
      </View>
      <Text style={[Typography.subtitle, styles.centro]} accessibilityRole="header">{titulo}</Text>
      {descricao ? <Text style={[styles.estadoVazioDescricao, styles.centro]}>{descricao}</Text> : null}
      <View style={styles.estadoVazioAcao}>{children}</View>
    </SafeAreaView>
  );
}

const CANTO = 32;
const ESPESSURA = 5;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.scannerBackground },
  cameraArea: { flex: 1, overflow: 'hidden' },
  mascara: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  mascaraInferior: { alignItems: 'center', paddingTop: Spacing.lg, paddingHorizontal: Spacing.lg },
  linhaCentral: { flexDirection: 'row', height: TAMANHO_MOLDURA },
  moldura: {
    width: TAMANHO_MOLDURA,
    height: TAMANHO_MOLDURA,
    borderRadius: Radius.lg + 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canto: {
    position: 'absolute',
    width: CANTO,
    height: CANTO,
    borderColor: Colors.onPrimary,
  },
  cantoSupEsq: { top: 0, left: 0, borderTopWidth: ESPESSURA, borderLeftWidth: ESPESSURA, borderTopLeftRadius: Radius.lg + 8 },
  cantoSupDir: { top: 0, right: 0, borderTopWidth: ESPESSURA, borderRightWidth: ESPESSURA, borderTopRightRadius: Radius.lg + 8 },
  cantoInfEsq: { bottom: 0, left: 0, borderBottomWidth: ESPESSURA, borderLeftWidth: ESPESSURA, borderBottomLeftRadius: Radius.lg + 8 },
  cantoInfDir: { bottom: 0, right: 0, borderBottomWidth: ESPESSURA, borderRightWidth: ESPESSURA, borderBottomRightRadius: Radius.lg + 8 },
  dica: { color: Colors.onPrimary, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  topo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  saudacao: { color: Colors.onPrimary, fontSize: 22, fontWeight: '700' },
  chipPlaca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: Spacing.md - 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.pill,
  },
  textoPlaca: { color: Colors.onPrimary, fontSize: 14, fontWeight: '600' },
  rodape: {
    backgroundColor: Colors.scannerBackground,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg - 4,
    paddingBottom: Spacing.lg,
    gap: Spacing.md - 4,
  },
  textoRodape: { color: '#D1D1D6', fontSize: 15, textAlign: 'center' },
  botaoPrimario: {
    minHeight: 52,
    minWidth: MIN_TOUCH,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoNfc: { flexDirection: 'row', gap: Spacing.sm, alignSelf: 'stretch' },
  botaoPressionado: { backgroundColor: Colors.primaryPressed },
  estadoVazio: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  estadoVazioIcone: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg - 4,
  },
  estadoVazioDescricao: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.sm },
  estadoVazioAcao: { marginTop: Spacing.lg },
  centro: { textAlign: 'center' },
});
