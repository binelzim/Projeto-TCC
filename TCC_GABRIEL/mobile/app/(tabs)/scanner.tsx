import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao, Card, ui } from '@/components/ui';
import { useAuth } from '@/services/auth';
import { buscarMeuDia, dispensarVolta, mensagemDeErro, PLACA_VEICULO, realizarCheckIn, type Passageiro, type MetodoValidacao } from '@/services/api';
import { lerNfc, cancelarNfc } from '@/services/nfc';

export default function Scanner() {
  const { sessao, sair } = useAuth();
  const [permissao, pedirPermissao] = useCameraPermissions();
  const [dia, setDia] = useState<Passageiro | null>(null);
  const [carregado, setCarregado] = useState(false);
  const [busy, setBusy] = useState(false);
  const [camera, setCamera] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [confirmarDispensa, setConfirmarDispensa] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  const trava = useRef(false);
  const foco = useIsFocused();
  useEffect(() => {
    if (!foco) return;
    let ativo = true;
    const atualizar = async () => {
      if (trava.current) return;
      try { const d = await buscarMeuDia(); if (ativo && !trava.current) { setDia(d); setCarregado(true); setErro(''); } }
      catch (e) { if (ativo) setErro(mensagemDeErro(e, 'Não foi possível atualizar seu dia.')); }
    };
    void atualizar();
    const timer = setInterval(atualizar, 5000);
    const relogio = setInterval(() => setAgora(Date.now()), 1000);
    return () => { ativo = false; clearInterval(timer); clearInterval(relogio); void cancelarNfc(); };
  }, [foco]);
  const espera = dia?.status === 'NA_FACULDADE' ? Math.max(0, Math.ceil((Date.parse(dia.proximaLeituraEm) - agora) / 1000)) : 0;
  const concluido = dia?.status === 'EMBARCADO_VOLTA' || dia?.status === 'VOLTA_DISPENSADA';
  const registrar = async (token: string, metodo: MetodoValidacao = 'QR_CODE') => {
    if (trava.current) return;
    trava.current = true; setBusy(true); setCamera(false); setErro(''); setMensagem('');
    try {
      const resultado = await realizarCheckIn({ tokenIdentificador: token.trim(), placaVeiculo: PLACA_VEICULO, metodo });
      setDia(resultado); setCarregado(true); setAgora(Date.now());
    } catch (e) { setErro(mensagemDeErro(e, 'Não foi possível registrar o embarque.')); }
    finally { trava.current = false; setBusy(false); }
  };
  const abrirCamera = async () => {
    setErro('');
    try {
      const resultado = permissao?.granted ? permissao : await pedirPermissao();
      if (resultado.granted) setCamera(true);
      else setErro('Câmera não autorizada. Libere o acesso nas configurações ou use a simulação abaixo.');
    } catch { setErro('Câmera indisponível. Você pode usar a simulação de leitura.'); }
  };
  const nfc = async () => {
    setBusy(true); setErro('');
    try { const token = await lerNfc(); await registrar(token, 'NFC'); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível ler a tag NFC.'); }
    finally { setBusy(false); }
  };
  const dispensar = async () => {
    setBusy(true); trava.current = true; setErro('');
    try { setDia(await dispensarVolta()); setMensagem('Volta dispensada. O motorista já foi avisado no painel.'); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível dispensar a volta.')); }
    finally { setBusy(false); trava.current = false; setConfirmarDispensa(false); }
  };
  return <SafeAreaView edges={['top']} style={ui.safe}><ScrollView contentContainerStyle={ui.content}>
    <View style={ui.row}><View style={{ flex: 1 }}><Text style={ui.label}>SUA VIAGEM DE HOJE</Text>
      <Text style={ui.title}>Olá, {sessao?.nome.split(' ')[0]}</Text></View><Botao secondary onPress={() => { void sair(); }}>Sair</Botao></View>
    <Card>
      <Text style={ui.label}>Lagoa Formosa ↔ UNIPAM · {PLACA_VEICULO}</Text>
      <Text style={ui.subtitle} accessibilityLiveRegion="polite">{!carregado ? 'Consultando seu dia…' :
        !dia ? 'Sem embarque hoje' : dia.status === 'NA_FACULDADE' ? 'Ida confirmada — bom estudo!' :
          dia.status === 'EMBARCADO_VOLTA' ? 'Volta confirmada — boa viagem!' : 'Volta dispensada'}</Text>
      <Text style={ui.body}>{!dia ? 'Faça a primeira leitura ao entrar no veículo.' : dia.status === 'NA_FACULDADE' ?
        'Na faculdade, basta desembarcar. Faça uma nova leitura apenas quando entrar no veículo para voltar.' :
        dia.status === 'VOLTA_DISPENSADA' ? 'Você não está na lista de estudantes aguardados para o retorno.' : 'Você está a bordo para o retorno. Até a próxima viagem!'}</Text>
      {espera > 0 ? <Text style={ui.label}>Proteção contra leitura repetida: {espera}s</Text> : null}
    </Card>
    {mensagem ? <Text accessibilityLiveRegion="polite" style={ui.success}>{mensagem}</Text> : null}
    {erro ? <Text accessibilityLiveRegion="polite" style={ui.error}>{erro}</Text> : null}
    {!concluido && <Card>
      <Text style={ui.subtitle}>{dia ? 'Embarque de volta' : 'Embarque de ida'}</Text>
      {camera && foco && permissao?.granted ? <>
        <View style={{ height: 270, overflow: 'hidden', borderRadius: 12 }}>
          <CameraView style={StyleSheet.absoluteFill} barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={busy ? undefined : ({ data }: BarcodeScanningResult) => { void registrar(data); }}
            accessibilityLabel="Câmera para ler o QR Code do veículo" />
        </View>
        <Text style={ui.body}>Aponte para o QR Code. A câmera fecha após uma leitura.</Text>
        <Botao secondary onPress={() => setCamera(false)}>Fechar câmera</Botao>
      </> : <Botao onPress={() => { void abrirCamera(); }} disabled={busy || !carregado || espera > 0}>Ler QR Code</Botao>}
      <Botao secondary disabled={busy || !carregado || espera > 0} onPress={() => { void registrar(PLACA_VEICULO); }}>
        {busy ? 'Aguarde…' : 'Simular leitura do QR Code (Demo)'}
      </Botao>
      <Botao secondary disabled={busy || !carregado || espera > 0} onPress={() => { void nfc(); }}>Ler carteirinha NFC</Botao>
      <Text style={ui.label}>A simulação registra um embarque real na demonstração e funciona sem câmera.</Text>
    </Card>}
    {dia?.status === 'NA_FACULDADE' && <Card>
      <Text style={ui.subtitle}>Vai voltar de carona?</Text>
      {!confirmarDispensa ? <Botao secondary disabled={busy} onPress={() => setConfirmarDispensa(true)}>Não voltarei no veículo hoje (Peguei carona)</Botao> : <>
        <Text style={ui.body}>Confirma que o motorista não precisa aguardar você hoje?</Text>
        <Botao disabled={busy} onPress={() => { void dispensar(); }}>Confirmar dispensa da volta</Botao>
        <Botao secondary disabled={busy} onPress={() => setConfirmarDispensa(false)}>Cancelar</Botao>
      </>}
    </Card>}
  </ScrollView></SafeAreaView>;
}

