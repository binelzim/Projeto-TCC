import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState, Text, View, StyleSheet } from 'react-native';
import { AvisoBanner, Botao, Card, Header, Page, useUI } from '@/components/ui';
import { useAuth } from '@/services/auth';
import { usePerfil } from '@/services/perfil';
import { useSettings } from '@/services/settings';
import { buscarConfig, buscarMeuDia, dispensarVolta, hora, mensagemDeErro, realizarCheckIn, type Passageiro, type MetodoValidacao } from '@/services/api';
import { lerNfc, cancelarNfc, LeituraCancelada } from '@/services/nfc';

export default function Scanner() {
  const ui = useUI(); const { sessao } = useAuth(); const { perfil } = usePerfil(); const { announce, vibrate } = useSettings();
  const placa = perfil?.linha.placa;
  const [permissao, pedirPermissao] = useCameraPermissions();
  const [dia, setDia] = useState<Passageiro | null>(null); const [carregado, setCarregado] = useState(false);
  const [busy, setBusy] = useState(false); const [camera, setCamera] = useState(false); const [demo, setDemo] = useState(false);
  const [mensagem, setMensagem] = useState(''); const [erro, setErro] = useState('');
  const [confirmarDispensa, setConfirmarDispensa] = useState(false); const [agora, setAgora] = useState(() => Date.now());
  const trava = useRef(false); const foco = useIsFocused();
  const leituraAtiva = useRef(false); const telaAtiva = useRef(false);
  const [lendoNfc, setLendoNfc] = useState(false);
  useEffect(() => {
    telaAtiva.current = foco;
    const listener = AppState.addEventListener('change', estado => {
      // iOS temporarily becomes inactive while its native NFC sheet is visible.
      if (estado === 'background') { telaAtiva.current = false; cancelarNfc(); }
      if (estado === 'active') telaAtiva.current = foco;
    });
    return () => { telaAtiva.current = false; cancelarNfc(); listener.remove(); };
  }, [foco]);
  useEffect(() => { void buscarConfig().then(r => setDemo(r.demoEnabled)).catch(() => {}); }, []);
  useEffect(() => {
    if (!foco) return;
    let ativo = true;
    const atualizar = async () => {
      if (trava.current) return;
      try { const d = await buscarMeuDia(); if (ativo && !trava.current) { setDia(d); setCarregado(true); } }
      catch (e) { if (ativo) setErro(mensagemDeErro(e, 'Não foi possível atualizar seu dia.')); }
    };
    void atualizar(); const timer = setInterval(atualizar, 5000);
    const relogio = setInterval(() => setAgora(Date.now()), 1000);
    return () => { ativo = false; clearInterval(timer); clearInterval(relogio); setCamera(false); void cancelarNfc(); };
  }, [foco]);
  const espera = dia?.status === 'NA_FACULDADE' ? Math.max(0, Math.ceil((Date.parse(dia.proximaLeituraEm) - agora) / 1000)) : 0;
  const concluido = dia?.status === 'EMBARCADO_VOLTA' || dia?.status === 'VOLTA_DISPENSADA';
  const registrar = async (token: string, metodo: MetodoValidacao = 'QR_CODE') => {
    if (trava.current || !placa) return;
    trava.current = true; setBusy(true); setCamera(false); setErro(''); setMensagem('');
    try {
      const resultado = await realizarCheckIn({ tokenIdentificador: token.trim(), placaVeiculo: placa, metodo });
      setDia(resultado); setCarregado(true); setAgora(Date.now());
      const texto = 'Embarque de ' + (resultado.status === 'NA_FACULDADE' ? 'ida' : 'volta') + ' confirmado para ' + sessao?.nome + '.';
      setMensagem(texto); announce(texto); vibrate();
    } catch (e) { setErro(mensagemDeErro(e, 'Não foi possível registrar o embarque.')); }
    finally { trava.current = false; setBusy(false); }
  };
  const abrirCamera = async () => {
    setErro('');
    try {
      const resultado = permissao?.granted ? permissao : await pedirPermissao();
      if (resultado.granted) setCamera(true);
      else setErro('Câmera não autorizada. Libere o acesso nas configurações do aparelho ou consulte o motorista.');
    } catch { setErro('Câmera indisponível. Consulte a Central de Ajuda.'); }
  };
  const nfc = async () => {
    if (leituraAtiva.current || trava.current) return;
    leituraAtiva.current = true;
    setBusy(true); setLendoNfc(true); setCamera(false); setErro(''); setMensagem('');
    try {
      const token = await lerNfc();
      if (telaAtiva.current) await registrar(token, 'NFC');
    } catch (e) {
      if (telaAtiva.current && !(e instanceof LeituraCancelada)) setErro(e instanceof Error ? e.message : 'Não foi possível ler a tag NFC.');
    } finally { leituraAtiva.current = false; setLendoNfc(false); setBusy(false); }
  };
  const dispensar = async () => {
    setBusy(true); trava.current = true; setErro('');
    try { setDia(await dispensarVolta()); const texto = 'Volta dispensada. O motorista já vê sua decisão no painel.'; setMensagem(texto); announce(texto); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível dispensar a volta.')); }
    finally { setBusy(false); trava.current = false; setConfirmarDispensa(false); }
  };
  const bloqueado = busy || !carregado || !placa || espera > 0;
  return <Page><Header title={'Olá, ' + (sessao?.nome.split(' ')[0] || 'estudante')} subtitle="SUA VIAGEM DE HOJE" /><AvisoBanner />
    <Card><Text style={ui.label}>{perfil?.linha.nome || 'Carregando sua linha…'} · {placa || '—'}</Text>
      <Text style={ui.subtitle} accessibilityLiveRegion="polite">{!carregado ? 'Consultando seu dia…' : !dia ? '◷ Pronto para embarcar?' : dia.status === 'NA_FACULDADE' ? '✓ Ida confirmada. Bom estudo!' : dia.status === 'EMBARCADO_VOLTA' ? '✓ Volta confirmada. Boa viagem!' : '↗ Volta dispensada'}</Text>
      <Text style={ui.body}>{!dia ? 'Faça a primeira leitura ao entrar no veículo.' : dia.status === 'NA_FACULDADE' ? 'Na faculdade, basta desembarcar. Leia novamente apenas quando entrar no veículo para voltar.' : dia.status === 'VOLTA_DISPENSADA' ? 'O motorista não precisa aguardar você para o retorno.' : 'Você está a bordo para o retorno. Até a próxima viagem!'}</Text>
      <View style={ui.row}><Text style={ui.label}>IDA · {hora(dia?.ida || null)}</Text><Text style={ui.label}>VOLTA · {hora(dia?.volta || null)}</Text></View>
      {espera > 0 && <Text style={ui.label}>Proteção contra leitura repetida: {espera}s</Text>}
    </Card>
    {mensagem ? <Text accessibilityLiveRegion="polite" style={ui.success}>{mensagem}</Text> : null}
    {erro ? <Text accessibilityLiveRegion="polite" style={ui.error}>⚠ {erro}</Text> : null}
    {!concluido && <Card><Text style={ui.subtitle}>{dia ? 'Embarque de volta' : 'Embarque de ida'}</Text>
      {camera && foco && permissao?.granted ? <>
        <View style={{ height: 270, overflow: 'hidden', borderRadius: 12 }}><CameraView style={StyleSheet.absoluteFill} barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={busy ? undefined : ({ data }: BarcodeScanningResult) => { void registrar(data); }} accessibilityLabel="Câmera para ler o QR Code do veículo" /></View>
        <Text style={ui.body}>Aponte para o QR Code. A câmera fecha após uma leitura.</Text>
        <Botao secondary icon="close" onPress={() => setCamera(false)}>Fechar câmera</Botao>
      </> : <Botao icon="qr-code-scanner" onPress={() => { void abrirCamera(); }} disabled={bloqueado}>Ler QR Code</Botao>}
      <Botao secondary icon="contactless" disabled={bloqueado} onPress={() => { void nfc(); }}>Ler tag NFC</Botao>
      {lendoNfc && <>
        <Text accessibilityLiveRegion="polite" style={ui.body}>Aproxime e mantenha a tag encostada na parte superior do iPhone ou na traseira do Android. Aguardando leitura…</Text>
        <Botao secondary icon="close" onPress={() => cancelarNfc()}>Cancelar leitura NFC</Botao>
      </>}
      {demo && <><Botao secondary icon="science" disabled={bloqueado} onPress={() => { if (placa) void registrar(placa); }}>Simular leitura do QR Code (Demo)</Botao>
        <Text style={ui.label}>A simulação registra um embarque na demonstração e funciona sem câmera.</Text></>}
    </Card>}
    {dia?.status === 'NA_FACULDADE' && <Card><Text style={ui.subtitle}>Vai voltar de carona?</Text>
      {!confirmarDispensa ? <Botao secondary icon="directions-car" disabled={busy} onPress={() => setConfirmarDispensa(true)}>Não volto hoje / Peguei carona</Botao> : <>
        <Text style={ui.body}>Confirma que o motorista não precisa aguardar você hoje?</Text>
        <Botao icon="check" disabled={busy} onPress={() => { void dispensar(); }}>Confirmar dispensa da volta</Botao>
        <Botao secondary icon="close" disabled={busy} onPress={() => setConfirmarDispensa(false)}>Cancelar</Botao>
      </>}
    </Card>}
  </Page>;
}
