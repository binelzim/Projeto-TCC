import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Botao, Campo, Card, Header, Page, useUI } from '@/components/ui';
import { CadastroForm } from '@/components/cadastro';
import { useAuth } from '@/services/auth';
import { useSettings } from '@/services/settings';
import { buscarConfig, mensagemDeErro } from '@/services/api';

export default function Inicio() {
  const ui = useUI(); const { colors: c, settings } = useSettings(); const { width } = useWindowDimensions();
  const { sessao, entrar } = useAuth();
  const [cadastro, setCadastro] = useState(false); const [login, setLogin] = useState(''); const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(''); const [busy, setBusy] = useState(false); const [demo, setDemo] = useState(false);
  useEffect(() => { void buscarConfig().then(r => setDemo(r.demoEnabled)).catch(() => {}); }, []);
  async function acessar() {
    setBusy(true); setErro('');
    try { await entrar(login.trim(), senha); } catch (e) { setErro(mensagemDeErro(e, 'Não foi possível entrar.')); } finally { setBusy(false); }
  }
  if (sessao) return <Redirect href={sessao.role === 'MOTORISTA' ? '/motorista' : '/scanner'} />;
  return <Page><Header title="Rota Universitária" subtitle="CADA EMBARQUE CONTA" />
    <View style={{ flexDirection: width > 850 ? 'row' : 'column', gap: 24, alignItems: 'stretch' }}>
      <View style={{ flex: 1, backgroundColor: c.hero, borderColor: c.border, borderWidth: settings.mode === 'contrast' ? 2 : 0, padding: 28, borderRadius: 16, gap: 22, justifyContent: 'center' }}>
        <MaterialIcons name="directions-bus-filled" size={width > 850 ? 58 : 34} color="#FFFFFF" />
        <Text style={[ui.title, { color: '#FFFFFF', fontSize: (width > 850 ? 36 : 26) * settings.scale }]}>Sua viagem, mais tranquila.</Text>
        <Text style={[ui.body, { color: '#FFFFFF' }]}>Do ponto até a faculdade. Acompanhe sua linha, confirme o embarque e organize o retorno em um só lugar.</Text>
        {width > 850 && ['01  Confirme sua ida ao embarcar', '02  Acompanhe a rota e os avisos', '03  Confirme a volta ou avise sua carona'].map(t =>
          <Text key={t} style={[ui.body, { color: '#FFFFFF' }]}>{t}</Text>)}
        <Text style={[ui.label, { color: '#FFFFFF' }]}>LAGOA FORMOSA ↔ UNIPAM</Text>
      </View>
      <View style={{ flex: 1 }}><Card>
        <Text style={ui.subtitle}>{cadastro ? 'Bem-vindo à sua linha' : 'Entre para acompanhar'}</Text>
        <Text style={ui.body}>{cadastro ? 'Escolha seu perfil e vincule sua conta ao veículo.' : 'Use sua matrícula ou o login de motorista.'}</Text>
        {cadastro ? <CadastroForm /> : <>
          <Campo label="Matrícula ou login" value={login} onChangeText={setLogin} autoCapitalize="none" autoComplete="username" editable={!busy} />
          <Campo label="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="current-password" editable={!busy} onSubmitEditing={() => { if (login && senha && !busy) void acessar(); }} />
          {erro ? <Text style={ui.error} accessibilityLiveRegion="polite">⚠ {erro}</Text> : null}
          <Botao icon="login" busy={busy} disabled={!login.trim() || !senha} onPress={() => { void acessar(); }}>Entrar na minha conta</Botao>
          {demo && <View style={{ gap: 10, paddingTop: 10 }}><Text style={ui.label}>ACESSOS PARA DEMONSTRAÇÃO</Text>
            <View style={ui.row}>
              <Botao secondary icon="school" disabled={busy} onPress={() => { setLogin('22009264'); setSenha('demo-hash-22009264'); }}>Preencher estudante</Botao>
              <Botao secondary icon="directions-bus" disabled={busy} onPress={() => { setLogin('motorista'); setSenha('motorista123'); }}>Preencher motorista</Botao>
            </View><Text style={ui.label}>Gabriel: 22009264 / demo-hash-22009264 · Motorista: motorista / motorista123</Text>
          </View>}
        </>}
        <Botao secondary icon={cadastro ? 'login' : 'person-add'} disabled={busy} onPress={() => { setCadastro(v => !v); setErro(''); }}>{cadastro ? 'Já tenho conta · Entrar' : 'Primeiro acesso? Criar conta'}</Botao>
      </Card></View>
    </View>
    <Text style={[ui.label, { textAlign: 'center', padding: 12 }]}>Transporte universitário · Projeto de conclusão de curso</Text>
  </Page>;
}
