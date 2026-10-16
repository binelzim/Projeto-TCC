import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, useUI } from './ui';
import { buscarConfig, buscarRotas, cadastrar, cadastrarAluno, mensagemDeErro, type Linha, type Role } from '@/services/api';
import { useAuth } from '@/services/auth';
import { useSettings } from '@/services/settings';

export function CadastroForm({ linha, onCreated }: { linha?: Linha; onCreated?: () => void }) {
  const ui = useUI(); const { adotar } = useAuth(); const { announce } = useSettings();
  const [role, setRole] = useState<Role>('ESTUDANTE');
  const [nome, setNome] = useState(''); const [matricula, setMatricula] = useState('');
  const [curso, setCurso] = useState(''); const [senha, setSenha] = useState('');
  const [placa, setPlaca] = useState(''); const [codigo, setCodigo] = useState('');
  const [novaRota, setNovaRota] = useState(''); const [criarRota, setCriarRota] = useState(false);
  const [rotas, setRotas] = useState<Linha[]>([]); const [escolha, setEscolha] = useState<Linha | null>(null);
  const [demo, setDemo] = useState(false); const [carregando, setCarregando] = useState(!linha);
  const [erro, setErro] = useState(''); const [sucesso, setSucesso] = useState(''); const [busy, setBusy] = useState(false);
  async function carregar() {
    setCarregando(true); setErro('');
    try { setRotas(await buscarRotas()); } catch (e) { setErro(mensagemDeErro(e, 'Não foi possível carregar as linhas.')); }
    finally { setCarregando(false); }
  }
  useEffect(() => {
    if (!linha) {
      const t = setTimeout(() => { void carregar(); void buscarConfig().then(c => setDemo(c.demoEnabled)).catch(() => {}); }, 0);
      return () => clearTimeout(t);
    }
  }, [linha]);
  async function salvar() {
    setErro(''); setSucesso('');
    if (!nome.trim() || !matricula.trim() || senha.length < 8) { setErro('Preencha nome, login e uma senha com pelo menos 8 caracteres.'); return; }
    if (role === 'ESTUDANTE' && (!curso.trim() || !(linha || escolha)?.veiculoId)) { setErro('Informe o curso/período e selecione um veículo.'); return; }
    if (role === 'MOTORISTA' && (!placa.trim() || !codigo.trim() || (criarRota ? !novaRota.trim() : !escolha))) { setErro('Informe placa, código da frota e escolha ou crie uma rota.'); return; }
    setBusy(true);
    try {
      const req = { role, nome: nome.trim(), matricula: matricula.trim(), curso: curso.trim(), senha,
        veiculoId: (linha || escolha)?.veiculoId || undefined, placa: placa.trim(),
        rotaId: criarRota ? undefined : escolha?.id, novaRota: criarRota ? novaRota.trim() : undefined, codigoFrota: codigo };
      if (linha) {
        await cadastrarAluno(req); setSucesso('Aluno cadastrado nesta linha. Ele já pode entrar com a matrícula e senha informadas.');
        setNome(''); setMatricula(''); setCurso(''); setSenha(''); onCreated?.(); announce('Aluno cadastrado com sucesso.');
      } else adotar(await cadastrar(req));
    } catch (e) { setErro(mensagemDeErro(e, 'Não foi possível cadastrar.')); } finally { setBusy(false); }
  }
  const opcoes = role === 'ESTUDANTE' ? rotas.filter(r => r.veiculoId) : rotas.filter((r, i, arr) => arr.findIndex(x => x.id === r.id) === i);
  return <View style={{ gap: 16 }}>
    {!linha && <View style={ui.row}>{(['ESTUDANTE', 'MOTORISTA'] as Role[]).map(r =>
      <Botao key={r} secondary={role !== r} icon={r === 'ESTUDANTE' ? 'school' : 'directions-bus'} disabled={busy}
        onPress={() => { setRole(r); setEscolha(null); setCriarRota(false); setErro(''); }}>{r === 'ESTUDANTE' ? 'Sou estudante' : 'Sou motorista'}</Botao>)}</View>}
    <Campo label="Nome completo" value={nome} onChangeText={setNome} maxLength={150} autoComplete="name" editable={!busy} />
    <Campo label={role === 'ESTUDANTE' ? 'Matrícula / RA' : 'Login (CPF ou usuário)'} value={matricula} onChangeText={setMatricula} autoCapitalize="none" maxLength={20} autoComplete="username" editable={!busy} />
    {role === 'ESTUDANTE' ? <Campo label="Curso / período" value={curso} onChangeText={setCurso} placeholder="Ex.: Sistemas de Informação / 6º período" maxLength={120} editable={!busy} />
      : <Campo label="Placa do veículo" value={placa} onChangeText={setPlaca} placeholder="ABC-1234 ou ABC1D23" autoCapitalize="characters" maxLength={8} editable={!busy} />}
    {linha ? <Text style={ui.body}>Vínculo: {linha.nome} · {linha.placa}</Text> : <>
      <Text style={ui.label}>ESCOLHA SUA {role === 'ESTUDANTE' ? 'LINHA E VEÍCULO' : 'ROTA'}</Text>
      {carregando && <Text style={ui.body}>Carregando rotas…</Text>}
      {!criarRota && opcoes.map(r => <Botao key={r.id + ':' + r.veiculoId} secondary={escolha !== r} icon={escolha === r ? 'check-circle' : 'radio-button-unchecked'} disabled={busy}
        label={'Selecionar ' + r.nome + (role === 'ESTUDANTE' ? ' · ' + r.placa : '')} onPress={() => setEscolha(r)}>
        {r.nome + (role === 'ESTUDANTE' ? ' · ' + r.placa : '')}</Botao>)}
      {!carregando && !opcoes.length && <Text style={ui.body}>Nenhum veículo disponível. Um motorista precisa cadastrar a primeira linha.</Text>}
      <Botao secondary icon="refresh" disabled={busy || carregando} onPress={() => { void carregar(); }}>Atualizar opções</Botao>
      {role === 'MOTORISTA' && <><Botao secondary icon={criarRota ? 'list' : 'add'} disabled={busy} onPress={() => setCriarRota(v => !v)}>{criarRota ? 'Escolher rota existente' : 'Criar uma nova rota'}</Botao>
        {criarRota && <Campo label="Nome da nova rota" value={novaRota} onChangeText={setNovaRota} maxLength={100} placeholder="Linha 02 · Bairros / Diurno" editable={!busy} />}</>}
    </>}
    <Campo label={linha ? 'Senha inicial do aluno (mínimo 8 caracteres)' : 'Senha (mínimo 8 caracteres)'} value={senha} onChangeText={setSenha} secureTextEntry maxLength={128} autoComplete="new-password" editable={!busy} />
    {role === 'MOTORISTA' && <><Campo label="Código de credenciamento da frota" value={codigo} onChangeText={setCodigo} secureTextEntry autoCapitalize="characters" editable={!busy} />
      {demo && <Text style={ui.label}>Ambiente de demonstração · código padrão: FROTA-UNIPAM</Text>}</>}
    {erro ? <Text style={ui.error} accessibilityLiveRegion="polite">⚠ {erro}</Text> : null}
    {sucesso ? <Text style={ui.success} accessibilityLiveRegion="polite">✓ {sucesso}</Text> : null}
    <Botao icon="person-add" busy={busy} onPress={() => { void salvar(); }}>{linha ? 'Cadastrar aluno nesta linha' : 'Criar conta e entrar'}</Botao>
  </View>;
}
