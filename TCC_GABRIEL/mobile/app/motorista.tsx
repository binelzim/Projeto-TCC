import { Redirect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { AvisoBanner, Botao, Campo, Card, Header, Page, Situacao, useUI } from '@/components/ui';
import { CadastroForm } from '@/components/cadastro';
import { EditarRota } from '@/components/editar-rota';
import { useAuth } from '@/services/auth';
import { usePerfil } from '@/services/perfil';
import { useSettings } from '@/services/settings';
import { atualizarParada, buscarAlunos, buscarPainel, dispensarVolta, enviarAviso, hora, mensagemDeErro, reiniciarDia, type Aluno, type Painel } from '@/services/api';
import { exportarChamada } from '@/services/exportar';
import { useGps } from '@/services/use-gps';

type Secao = 'Viagem' | 'Passageiros' | 'Rota' | 'Avisos';
const avisos = ['Ônibus posicionado no ponto de embarque', 'Atraso previsto de 10 minutos', 'Última chamada! Saindo da faculdade em 5 min'];
export default function Motorista() {
  const ui = useUI(); const { sessao, sair } = useAuth(); const { perfil, atualizar, erro: erroPerfil } = usePerfil();
  const { announce } = useSettings(); const autorizado = sessao?.role === 'MOTORISTA'; const linha = perfil?.linha;
  const [secao, setSecao] = useState<Secao>('Viagem'); const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState(''); const [erroAcao, setErroAcao] = useState(''); const [sucesso, setSucesso] = useState(''); const [busy, setBusy] = useState(false);
  const [confirmar, setConfirmar] = useState(false); const [gpsLigado, setGpsLigado] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]); const [novoAluno, setNovoAluno] = useState(false); const [aviso, setAviso] = useState('');
  const [erroAlunos, setErroAlunos] = useState(''); const [alunosBusy, setAlunosBusy] = useState(false);
  const gps = useGps(gpsLigado && autorizado, linha?.placa, linha?.paradaAtual);
  const consultando = useRef(false); const ultimaContagem = useRef<number | null>(null);
  const carregar = useCallback(async () => {
    if (consultando.current) return; consultando.current = true;
    try { setPainel(await buscarPainel()); setErro(''); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível atualizar os passageiros.')); }
    finally { consultando.current = false; }
  }, []);
  useEffect(() => {
    if (!autorizado) return;
    const first = setTimeout(() => { void carregar(); }, 0); const timer = setInterval(carregar, 5000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [autorizado, carregar]);
  useEffect(() => {
    if (!painel || erro || ultimaContagem.current === painel.faltamChegar) return;
    ultimaContagem.current = painel.faltamChegar;
    if (painel.faltamChegar > 0) announce('Atenção: ainda faltam ' + painel.faltamChegar + ' alunos para a volta.');
    else if (painel.foramHoje > 0) announce('Todos os passageiros de hoje estão com o retorno resolvido.');
  }, [painel, erro, announce]);
  const listar = useCallback(async () => {
    setAlunosBusy(true);
    try { setAlunos(await buscarAlunos()); setErroAlunos(''); } catch (e) { setErroAlunos(mensagemDeErro(e, 'Falha ao listar os alunos.')); }
    finally { setAlunosBusy(false); }
  }, []);
  useEffect(() => { if (autorizado && secao === 'Passageiros') { const t = setTimeout(() => { void listar(); }, 0); return () => clearTimeout(t); } }, [secao, autorizado, listar]);
  const acao = async (fn: () => Promise<unknown>, mensagem = '') => {
    setBusy(true); setSucesso(''); setErroAcao('');
    try { await fn(); await carregar(); await atualizar(); if (mensagem) { setSucesso(mensagem); announce(mensagem); } }
    catch (e) { setSucesso(''); setErroAcao(mensagemDeErro(e, 'Não foi possível concluir a ação.')); }
    finally { setBusy(false); setConfirmar(false); }
  };
  if (!sessao) return <Redirect href="/" />;
  if (!autorizado) return <Redirect href="/scanner" />;
  return <Page><Header title="Painel do motorista" subtitle={'OLÁ, ' + sessao.nome.toLocaleUpperCase('pt-BR')} />
    <View style={[ui.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1, minWidth: 180 }}><Text style={ui.subtitle}>{linha?.nome || 'Carregando linha…'}</Text>
      <Text style={ui.label}>VEÍCULO · {linha?.placa || '—'}</Text></View><Botao secondary icon="logout" onPress={() => { setGpsLigado(false); void sair(); }}>Sair</Botao></View>
    <View style={ui.row}>{(['Viagem', 'Passageiros', 'Rota', 'Avisos'] as Secao[]).map((s, i) =>
      <Botao key={s} secondary={secao !== s} icon={(['directions-bus', 'groups', 'route', 'campaign'] as const)[i]} onPress={() => { setSecao(s); setSucesso(''); }}>{s}</Botao>)}</View>
    {erro ? <Text accessibilityLiveRegion="polite" style={ui.error}>⚠ {erro} Os dados podem estar desatualizados.</Text> : null}
    {erroPerfil || erroAcao ? <Text accessibilityLiveRegion="polite" style={ui.error}>⚠ {erroAcao || erroPerfil}</Text> : null}
    {sucesso ? <Text accessibilityLiveRegion="polite" style={ui.success}>✓ {sucesso}</Text> : null}
    {secao === 'Viagem' && <>
      <Card><Text style={ui.subtitle}>Transmissão da localização</Text><Text accessibilityLiveRegion="polite" style={ui.body}>{gps}</Text>
        <Botao icon={gpsLigado ? 'location-off' : 'gps-fixed'} disabled={!linha} onPress={() => setGpsLigado(v => !v)}>{gpsLigado ? 'Desligar transmissão GPS' : 'Ligar transmissão GPS'}</Botao>
        <Text style={ui.label}>Mantenha o app aberto e a tela ativa. Atualize os controles apenas com o veículo parado.</Text></Card>
      {!painel ? <Text style={ui.body}>Carregando a chamada de hoje…</Text> : <>
        <View style={[ui.row, { alignItems: 'stretch' }]}>{[['Foram hoje · Ida', painel.foramHoje], ['Já voltaram', painel.jaVoltaram], ['Faltam chegar', painel.faltamChegar]].map(([label, value]) =>
          <View key={label} style={[ui.card, { flex: 1, minWidth: 180 }]}><Text style={ui.label}>{label}</Text><Text style={ui.metric}>{value}</Text></View>)}</View>
        <Card><Text accessibilityLiveRegion="polite" style={erro || painel.faltamChegar ? ui.warning : ui.success}>
          {erro ? '◷ Aguardando atualização para confirmar o retorno.' : painel.faltamChegar > 0 ? '⚠ ' + painel.faltamChegar + ' estudante(s) ainda aguardados. Confira antes de partir.' :
            painel.foramHoje > 0 ? '✓ Todos prontos! Pode partir.' : '◷ Nenhum embarque hoje. Aguardando a ida.'}</Text><Text style={ui.label}>Voltas dispensadas: {painel.dispensados}</Text></Card>
        <Botao secondary icon="file-download" disabled={busy || !!erro} onPress={() => { void acao(() => exportarChamada(painel)); }}>Exportar Chamada do Dia</Botao>
      </>}
      {linha && <Card><Text style={ui.subtitle}>Atualizar parada atual</Text><Text style={ui.body}>Toque no ponto em que você está. O aluno recebe a atualização em poucos segundos.</Text>
        {linha.paradas.map((p, i) => <Botao key={i} icon={i === linha.paradaAtual ? 'check-circle' : 'location-on'} secondary={i !== linha.paradaAtual} disabled={busy}
          onPress={() => { void acao(() => atualizarParada(i), 'Parada atual: ' + p); }}>{(i + 1) + '. ' + p}</Botao>)}
        <Botao secondary icon="restart-alt" disabled={busy || linha.paradaAtual < 0} onPress={() => { void acao(() => atualizarParada(-1), 'Marcador de parada reiniciado.'); }}>Limpar parada atual</Botao></Card>}
      <Text style={ui.subtitle}>Passageiros de hoje</Text>
      {painel?.passageiros.length === 0 && <Text style={ui.body}>Os estudantes aparecerão após a primeira leitura.</Text>}
      {painel?.passageiros.map(p => <Card key={p.id}><View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={ui.subtitle}>{p.nomeEstudante}</Text><Situacao status={p.status} /></View>
        <Text style={ui.label}>Matrícula {p.matricula}</Text><Text style={ui.body}>Ida {hora(p.ida)} · Volta {hora(p.volta)}</Text>
        {p.status === 'NA_FACULDADE' && <Botao secondary icon="person-off" disabled={busy} label={'Dispensar volta de ' + p.nomeEstudante}
          onPress={() => { void acao(() => dispensarVolta(p.estudanteId), 'Volta dispensada para ' + p.nomeEstudante); }}>Dispensar Volta</Botao>}</Card>)}
      {painel?.demoEnabled && <Card>{!confirmar ? <Botao secondary icon="restart-alt" disabled={busy} onPress={() => setConfirmar(true)}>Reiniciar Ciclo do Dia (Demo)</Botao> : <>
        <Text style={ui.body}>Apagar os embarques de hoje do veículo {linha?.placa}? O histórico dos outros dias será preservado.</Text>
        <Botao danger icon="delete-outline" disabled={busy} onPress={() => { void acao(reiniciarDia, 'Ciclo de hoje reiniciado.'); }}>Confirmar reinício de hoje</Botao>
        <Botao secondary icon="close" disabled={busy} onPress={() => setConfirmar(false)}>Cancelar</Botao></>}</Card>}
    </>}
    {secao === 'Passageiros' && <>
      <Card><Text style={ui.subtitle}>Gerenciar passageiros</Text><Text style={ui.body}>Todos os alunos da sua rota, com o veículo de cada um. Novos cadastros ficam vinculados ao seu veículo.</Text>
        <Botao icon={novoAluno ? 'close' : 'person-add'} onPress={() => setNovoAluno(v => !v)}>{novoAluno ? 'Fechar cadastro' : '+ Novo Aluno'}</Botao>
        {novoAluno && linha && <><Text style={ui.label}>Você precisa estar conectado. O aluno pode entrar depois com a matrícula e a senha inicial informadas.</Text><CadastroForm linha={linha} onCreated={() => { void listar(); }} /></>}
      </Card>
      <View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={ui.subtitle}>{alunos.length} aluno(s) cadastrado(s)</Text><Botao secondary icon="refresh" busy={alunosBusy} onPress={() => { void listar(); }}>Atualizar lista</Botao></View>
      {erroAlunos ? <Text style={ui.error}>{erroAlunos}</Text> : null}
      {alunos.map(a => <Card key={a.id}><Text style={ui.subtitle}>{a.nome}</Text><Text style={ui.body}>{a.matricula} · {a.curso}</Text><Text style={ui.label}>Veículo {a.placaVeiculo}</Text><Text style={a.ativo ? ui.success : ui.warning}>{a.ativo ? '✓ Passageiro ativo' : '⚠ Cadastro inativo'}</Text></Card>)}
    </>}
    {secao === 'Rota' && linha && <EditarRota key={linha.id} linha={linha} />}
    {secao === 'Avisos' && <><Card><Text style={ui.subtitle}>Enviar Aviso para a Turma</Text><Text style={ui.body}>O comunicado aparece para os estudantes da sua rota e fica ativo por até 12 horas.</Text>
      {avisos.map((a, i) => <Botao key={a} secondary icon={(['directions-bus', 'schedule', 'campaign'] as const)[i]} disabled={busy} onPress={() => { void acao(() => enviarAviso(a), 'Aviso publicado para a turma.'); }}>{a}</Botao>)}
      <Campo label="Mensagem personalizada" value={aviso} onChangeText={setAviso} multiline maxLength={500} editable={!busy} /><Text style={ui.label}>{aviso.length}/500 caracteres</Text>
      <Botao icon="send" disabled={busy || !aviso.trim()} onPress={() => { void acao(() => enviarAviso(aviso), 'Aviso publicado para a turma.'); }}>Publicar mensagem</Botao>
      <Botao secondary icon="clear" disabled={busy || !linha?.aviso} onPress={() => { void acao(() => enviarAviso(''), 'Aviso removido.'); }}>Remover aviso atual</Botao>
    </Card><AvisoBanner /></>}
  </Page>;
}
