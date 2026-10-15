import { Redirect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao, Card, ui } from '@/components/ui';
import { useAuth } from '@/services/auth';
import { buscarPainel, dispensarVolta, hora, mensagemDeErro, reiniciarDia, ROTULOS, type Painel } from '@/services/api';
import { useGps } from '@/services/use-gps';

export default function Motorista() {
  const { sessao, sair } = useAuth();
  const autorizado = sessao?.role === 'MOTORISTA';
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [gpsLigado, setGpsLigado] = useState(false);
  const gps = useGps(gpsLigado && autorizado);
  const consultando = useRef(false);
  const carregar = useCallback(async () => {
    if (consultando.current) return;
    consultando.current = true;
    try { setPainel(await buscarPainel()); setErro(''); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível atualizar os passageiros.')); }
    finally { consultando.current = false; }
  }, []);
  useEffect(() => {
    if (!autorizado) return;
    const inicial = setTimeout(() => { void carregar(); }, 0);
    const timer = setInterval(carregar, 5000);
    return () => { clearTimeout(inicial); clearInterval(timer); };
  }, [autorizado, carregar]);
  const acao = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); await carregar(); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível concluir a ação.')); }
    finally { setBusy(false); setConfirmar(false); }
  };
  if (!sessao) return <Redirect href="/" />;
  if (!autorizado) return <Redirect href="/scanner" />;
  return <SafeAreaView style={ui.safe}><ScrollView contentContainerStyle={ui.content}>
    <View style={ui.row}><View style={{ flex: 1 }}><Text style={ui.label}>LAGOA FORMOSA ↔ UNIPAM</Text><Text style={ui.title}>Painel do motorista</Text></View>
      <Botao secondary onPress={() => { setGpsLigado(false); void sair(); }}>Sair</Botao></View>
    <Card>
      <Text style={ui.subtitle}>Localização da van · ABC-1234</Text>
      <Text accessibilityLiveRegion="polite" style={ui.body}>{gps}</Text>
      <Botao onPress={() => setGpsLigado(v => !v)}>{gpsLigado ? 'Desligar transmissão GPS' : 'Ligar transmissão GPS'}</Botao>
      <Text style={ui.label}>Mantenha esta tela aberta durante a transmissão.</Text>
    </Card>
    {erro ? <Text accessibilityLiveRegion="polite" style={ui.error}>{erro} Os dados podem estar desatualizados.</Text> : null}
    {!painel ? <Text style={ui.body}>Carregando passageiros…</Text> : <>
      <View style={ui.row} accessibilityLiveRegion="polite">
        {[['Foram hoje (Ida)', painel.foramHoje], ['Já voltaram', painel.jaVoltaram], ['Faltam chegar', painel.faltamChegar]].map(([label, value]) =>
          <View key={label} style={{ flexGrow: 1, minWidth: 95, backgroundColor: 'white', padding: 16, borderRadius: 14 }}>
            <Text style={ui.label}>{label}</Text><Text style={ui.title}>{value}</Text>
          </View>)}
      </View>
      <Card>
        <Text accessibilityLiveRegion="polite" style={erro || painel.faltamChegar ? ui.warning : ui.success}>
          {erro ? 'Aguardando atualização para confirmar o retorno.' : painel.faltamChegar > 0 ? painel.faltamChegar + ' estudante(s) ainda aguardados. Confira antes de partir.' :
            painel.foramHoje > 0 ? 'Todos prontos! Pode partir.' : 'Nenhum embarque hoje. Aguardando a ida.'}
        </Text>
        <Text style={ui.label}>Voltas dispensadas: {painel.dispensados}</Text>
      </Card>
      <Text style={ui.subtitle}>Passageiros de hoje</Text>
      {painel.passageiros.length === 0 && <Text style={ui.body}>Os estudantes aparecerão após a primeira leitura.</Text>}
      {painel.passageiros.map(p => <Card key={p.id}>
        <Text style={ui.subtitle}>{p.nomeEstudante}</Text><Text style={ui.label}>Matrícula {p.matricula}</Text>
        <Text style={ui.body}>Ida {hora(p.ida)} · Volta {hora(p.volta)}</Text>
        <Text style={p.status === 'NA_FACULDADE' ? ui.warning : ui.success}>{ROTULOS[p.status]}</Text>
        {p.status === 'NA_FACULDADE' && <Botao secondary disabled={busy} label={'Dispensar volta de ' + p.nomeEstudante}
          onPress={() => { void acao(() => dispensarVolta(p.estudanteId)); }}>Dispensar Volta</Botao>}
      </Card>)}
      {painel.demoEnabled && <Card>
        {!confirmar ? <Botao secondary disabled={busy} onPress={() => setConfirmar(true)}>Reiniciar Ciclo do Dia (Demo)</Botao> : <>
          <Text style={ui.body}>Apagar os embarques de hoje da van ABC-1234? O histórico de outros dias será preservado.</Text>
          <Botao danger disabled={busy} onPress={() => { void acao(reiniciarDia); }}>Confirmar reinício de hoje</Botao>
          <Botao secondary disabled={busy} onPress={() => setConfirmar(false)}>Cancelar</Botao>
        </>}
      </Card>}
    </>}
  </ScrollView></SafeAreaView>;
}

