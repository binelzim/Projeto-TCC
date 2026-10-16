import * as Location from 'expo-location';
import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Linking, Text, View } from 'react-native';
import { AvisoBanner, Botao, Card, Header, Page, useUI } from '@/components/ui';
import { buscarLocalizacao, hora, mensagemDeErro, type Localizacao } from '@/services/api';
import { usePerfil } from '@/services/perfil';
import { useSettings } from '@/services/settings';
import { estimarMinutos, haversine } from '@/services/geo';

function Pulso() {
  const { colors: c } = useSettings(); const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let anim: Animated.CompositeAnimation | undefined; let vivo = true;
    const configurar = (reduzir: boolean) => {
      anim?.stop(); opacity.setValue(1);
      if (!reduzir && vivo) { anim = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: .35, duration: 800, useNativeDriver: true }), Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true })])); anim.start(); }
    };
    void AccessibilityInfo.isReduceMotionEnabled().then(configurar);
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', configurar);
    return () => { vivo = false; anim?.stop(); listener.remove(); };
  }, [opacity]);
  return <Animated.View accessible={false} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c.primary, opacity }} />;
}
export default function Mapa() {
  const ui = useUI(); const { colors: c } = useSettings(); const { perfil } = usePerfil(); const linha = perfil?.linha;
  const [gps, setGps] = useState<Localizacao | null>(null); const [erro, setErro] = useState('');
  const [minhaPosicao, setMinhaPosicao] = useState<Location.LocationObject | null>(null);
  const [autorizado, setAutorizado] = useState(false); const [solicitando, setSolicitando] = useState(false);
  const [erroAluno, setErroAluno] = useState(''); const [agora, setAgora] = useState(() => Date.now());
  const foco = useIsFocused();
  useEffect(() => {
    if (!linha?.placa || !foco) return;
    let ativo = true, ocupado = false;
    const carregar = async () => {
      if (ocupado) return; ocupado = true;
      try { const p = await buscarLocalizacao(linha.placa!); if (ativo) { setGps(p); setErro(''); } }
      catch (e) { if (ativo) { setGps(null); setErro(mensagemDeErro(e, 'Sinal do veículo indisponível.')); } }
      finally { ocupado = false; }
    };
    void carregar(); const timer = setInterval(carregar, 5000); const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => { ativo = false; clearInterval(timer); clearInterval(t); };
  }, [linha?.placa, foco]);
  useEffect(() => {
    if (!autorizado || !foco) return;
    let ativo = true, ocupado = false;
    const atualizar = async () => {
      if (ocupado) return; ocupado = true;
      try {
        const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (ativo) { if ((p.coords.accuracy ?? Infinity) <= 100) { setMinhaPosicao(p); setErroAluno(''); } else setErroAluno('Sua localização está imprecisa. Tente em uma área aberta.'); }
      } catch { if (ativo) setErroAluno('Não foi possível obter sua posição. Confira a permissão de localização.'); }
      finally { ocupado = false; }
    };
    void atualizar(); const timer = setInterval(atualizar, 10000);
    return () => { ativo = false; clearInterval(timer); };
  }, [autorizado, foco]);
  async function ativar() {
    setSolicitando(true); setErroAluno('');
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.granted) setAutorizado(true); else setErroAluno('Permita sua localização nas configurações do aparelho para calcular a distância.');
    } catch { setErroAluno('Localização indisponível neste dispositivo.'); } finally { setSolicitando(false); }
  }
  const sinal = gps && agora - Date.parse(gps.ultimaAtualizacao) < 30000 ? gps : null;
  const posAluno = minhaPosicao && agora - minhaPosicao.timestamp < 60000 && autorizado ? minhaPosicao : null;
  const distancia = sinal && posAluno ? haversine(posAluno.coords, sinal) : null;
  const abrirMapa = () => { if (sinal) void Linking.openURL('https://www.google.com/maps/dir/?api=1&destination=' + sinal.latitude + ',' + sinal.longitude).catch(() => setErro('Não foi possível abrir o Google Maps.')); };
  return <Page><Header title="Minha linha" subtitle="DO SEU PONTO ATÉ A FACULDADE" /><AvisoBanner />
    <Card><Text style={ui.subtitle}>{linha?.nome || 'Carregando sua linha…'}</Text><Text style={ui.body}>{linha?.placa || '—'} · {linha?.motorista || 'Motorista não informado'}</Text>
      <Text style={sinal ? ui.success : ui.warning} accessibilityLiveRegion="polite">{sinal ? sinal.velocidadeKmh >= 3 ? '➜ Em movimento · ' + sinal.velocidadeKmh + ' km/h' : '◉ Veículo parado' : '◷ Sem sinal GPS recente'}</Text>
      <Text style={ui.label}>{sinal ? 'Última posição: ' + hora(sinal.ultimaAtualizacao) + (sinal.precisaoMetros === null ? ' · precisão não informada' : ' · precisão ±' + Math.round(sinal.precisaoMetros) + ' m') : erro || 'O motorista pode ativar o GPS no aplicativo.'}</Text>
    </Card>
    <Card><Text style={ui.label}>ÔNIBUS PERTO DE VOCÊ</Text>
      {distancia !== null && sinal ? <><Text style={ui.metric}>{distancia.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} km</Text>
        <Text style={ui.subtitle}>Aprox. {estimarMinutos(distancia, sinal.velocidadeKmh)} min de deslocamento</Text>
        <Text style={ui.label}>Estimativa em linha reta, usando {sinal.velocidadeKmh >= 5 ? 'a velocidade atual' : '30 km/h como referência'}. Não considera ruas, sentido da viagem, paradas ou trânsito; não confirma a chegada ao seu ponto.</Text></>
        : <Text style={ui.body}>{autorizado ? 'Aguardando posições recentes do ônibus e do seu aparelho.' : 'Ative sua localização para estimar a distância até o ônibus. Sua posição permanece neste aparelho.'}</Text>}
      {erroAluno ? <Text style={ui.error}>{erroAluno}</Text> : null}
      <Botao secondary icon={autorizado ? 'location-off' : 'my-location'} busy={solicitando} onPress={() => { if (autorizado) { setAutorizado(false); setMinhaPosicao(null); } else void ativar(); }}>{autorizado ? 'Desligar minha localização' : 'Calcular distância até mim'}</Botao>
      <Botao icon="map" disabled={!sinal} onPress={abrirMapa}>Abrir trajeto no Google Maps</Botao>
    </Card>
    <Card><Text style={ui.subtitle}>Paradas da linha</Text>
      <Text style={ui.label}>{linha && linha.paradaAtual >= 0 ? 'Atualização manual do motorista · ' + hora(linha.paradaAtualizadaEm) : 'Aguardando o motorista indicar a parada atual.'}</Text>
      {linha?.paradas.map((parada, i) => {
        const atual = i === linha.paradaAtual; const passou = i < linha.paradaAtual;
        return <View key={i} style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ width: 36, alignItems: 'center' }}><View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: atual || passou ? c.primary : c.border, alignItems: 'center', justifyContent: 'center' }}>
            {atual ? <Pulso /> : <Text style={[ui.label, { color: passou ? c.primary : c.muted }]}>{passou ? '✓' : i + 1}</Text>}</View>
            {i < linha.paradas.length - 1 && <View style={{ flex: 1, minHeight: 22, width: 2, backgroundColor: passou ? c.primary : c.border }} />}</View>
          <View style={{ flex: 1, paddingBottom: 16, gap: 4 }}><Text style={ui.subtitle}>{parada}</Text><Text style={atual ? ui.success : ui.label}>{atual ? '◉ Parada atual informada' : passou ? '✓ Já percorrida' : '◷ Próxima parada'}</Text></View>
        </View>;
      })}
      <Text style={ui.label}>As paradas seguem a ordem configurada até a faculdade. O marcador manual não confirma a posição GPS.</Text>
    </Card>
  </Page>;
}
