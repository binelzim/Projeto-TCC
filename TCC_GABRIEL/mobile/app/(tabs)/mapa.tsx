import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Colors, MIN_TOUCH, Radius, Spacing, Typography } from '@/constants/theme';
import { buscarLocalizacao, PLACA_VEICULO, type Localizacao } from '@/services/api';

const INTERVALO_POLLING_MS = 5000;

export default function MapaScreen() {
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const mostrarToast = useToast();

  // Short polling: consulta a posição da van a cada 5 segundos
  useEffect(() => {
    const buscarGPS = () => {
      buscarLocalizacao(PLACA_VEICULO)
        .then((loc) => {
          setLocalizacao(loc);
          setErro(null);
        })
        .catch(() => setErro('Aguardando transmissão do motorista...'));
    };

    buscarGPS();
    const intervalo = setInterval(buscarGPS, INTERVALO_POLLING_MS);
    return () => clearInterval(intervalo);
  }, []);

  // Abre as coordenadas diretamente no aplicativo de mapas do celular
  const abrirNoGoogleMaps = () => {
    if (!localizacao) return;
    const url = `https://www.google.com/maps/search/?api=1&query=${localizacao.latitude},${localizacao.longitude}`;
    Linking.openURL(url).catch(() => {
      mostrarToast('erro', 'Não foi possível abrir o mapa', 'Verifique se há um aplicativo de mapas instalado.');
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={Typography.title} accessibilityRole="header">Rastreio da Van</Text>
          <View style={styles.chipPlaca}>
            <MaterialIcons name="directions-bus" size={16} color={Colors.primary} />
            <Text style={styles.textoPlaca}>Placa {PLACA_VEICULO}</Text>
          </View>
        </View>

        <View style={styles.card} accessibilityLiveRegion="polite">
          {erro ? (
            <EstadoVazio
              icone="satellite-alt"
              cor={Colors.dangerText}
              titulo="Van offline"
              descricao={erro}
            />
          ) : localizacao ? (
            <View style={styles.infoContainer}>
              <View style={styles.statusLinha}>
                <IconePulsante />
                <View style={styles.statusTextos}>
                  <Text style={styles.statusTitulo}>Van em movimento</Text>
                  <Text style={Typography.caption}>Atualizado em tempo real (a cada 5s)</Text>
                </View>
              </View>

              <View style={styles.coordenadas}>
                <Coordenada rotulo="Latitude" valor={localizacao.latitude} />
                <View style={styles.divisor} />
                <Coordenada rotulo="Longitude" valor={localizacao.longitude} />
              </View>

              <Pressable
                style={({ pressed }) => [styles.botaoMapa, pressed && styles.botaoPressionado]}
                onPress={abrirNoGoogleMaps}
                accessibilityRole="button"
                accessibilityLabel="Abrir rota atual no aplicativo do Google Maps">
                <MaterialIcons name="map" size={22} color={Colors.onPrimary} />
                <Text style={Typography.button}>Abrir no Google Maps</Text>
              </Pressable>
            </View>
          ) : (
            <EstadoVazio
              icone="gps-not-fixed"
              cor={Colors.primary}
              titulo="Conectando ao satélite..."
              descricao="Buscando a posição atual da van."
              carregando
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Coordenada({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <View style={styles.coordenada} accessible accessibilityLabel={`${rotulo}: ${valor.toFixed(5)}`}>
      <Text style={Typography.caption}>{rotulo}</Text>
      <Text style={styles.coordenadaValor}>{valor.toFixed(5)}</Text>
    </View>
  );
}

/** Ícone verde com um anel que pulsa continuamente, indicando transmissão ativa. */
function IconePulsante() {
  const progresso = useSharedValue(0);
  const reduzirMovimento = useReducedMotion();

  useEffect(() => {
    if (reduzirMovimento) return;
    progresso.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.ease) }), -1, false);
  }, [progresso, reduzirMovimento]);

  const anelStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - progresso.value),
    transform: [{ scale: 1 + progresso.value * 0.8 }],
  }));

  return (
    <View style={styles.pulsoContainer} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.pulsoAnel, anelStyle]} />
      <View style={styles.pulsoIcone}>
        <MaterialIcons name="directions-bus" size={26} color={Colors.onPrimary} />
      </View>
    </View>
  );
}

function EstadoVazio({
  icone,
  cor,
  titulo,
  descricao,
  carregando = false,
}: {
  icone: keyof typeof MaterialIcons.glyphMap;
  cor: string;
  titulo: string;
  descricao: string;
  carregando?: boolean;
}) {
  return (
    <View style={styles.estadoVazio}>
      <View style={[styles.estadoVazioIcone, { backgroundColor: `${cor}1A` }]}>
        <MaterialIcons name={icone} size={40} color={cor} />
      </View>
      <Text style={[Typography.subtitle, styles.centro]}>{titulo}</Text>
      <Text style={[styles.estadoVazioDescricao, styles.centro]}>{descricao}</Text>
      {carregando && <ActivityIndicator style={styles.loader} color={cor} />}
    </View>
  );
}

const TAMANHO_PULSO = 56;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    padding: Spacing.lg - 4,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  chipPlaca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    backgroundColor: '#E5F0FF',
    paddingHorizontal: Spacing.md - 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.pill,
  },
  textoPlaca: { color: Colors.primaryPressed, fontSize: 14, fontWeight: '600' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg + 4,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    minHeight: 280,
    justifyContent: 'center',
  },
  infoContainer: { gap: Spacing.lg - 4 },
  statusLinha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  statusTextos: { flex: 1 },
  statusTitulo: { fontSize: 18, fontWeight: '700', color: Colors.successText },
  pulsoContainer: {
    width: TAMANHO_PULSO,
    height: TAMANHO_PULSO,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulsoAnel: {
    position: 'absolute',
    width: TAMANHO_PULSO,
    height: TAMANHO_PULSO,
    borderRadius: TAMANHO_PULSO / 2,
    backgroundColor: Colors.success,
  },
  pulsoIcone: {
    width: TAMANHO_PULSO,
    height: TAMANHO_PULSO,
    borderRadius: TAMANHO_PULSO / 2,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordenadas: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md - 2,
  },
  coordenada: { flex: 1, alignItems: 'center', gap: 2 },
  coordenadaValor: { fontSize: 18, fontWeight: '600', fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), color: Colors.text },
  divisor: { width: 1, backgroundColor: Colors.border },
  botaoMapa: {
    flexDirection: 'row',
    gap: Spacing.sm,
    minHeight: 54,
    minWidth: MIN_TOUCH,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  botaoPressionado: { backgroundColor: Colors.primaryPressed },
  estadoVazio: { alignItems: 'center' },
  estadoVazioIcone: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  estadoVazioDescricao: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  loader: { marginTop: Spacing.md },
  centro: { textAlign: 'center' },
});
