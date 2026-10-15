import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Botao, Card, ui } from '@/components/ui';
import { useAuth } from '@/services/auth';
import { mensagemDeErro } from '@/services/api';

export default function LoginScreen() {
  const { sessao, entrar } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');
  if (sessao) return <Redirect href={sessao.role === 'MOTORISTA' ? '/motorista' : '/scanner'} />;
  const acessar = async () => {
    if (busy) return;
    setBusy(true); setErro('');
    try { await entrar(usuario.trim(), senha); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível entrar.')); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={ui.safe}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={[ui.content, { justifyContent: 'center', maxWidth: 480 }]}>
      <View style={{ gap: 10, marginBottom: 12 }}>
        <MaterialIcons name="directions-bus" color="#0062cc" size={48} />
        <Text style={ui.label}>LAGOA FORMOSA ↔ UNIPAM</Text>
        <Text style={ui.title}>Sua viagem, acompanhada.</Text>
        <Text style={ui.body}>Acesse como estudante ou motorista para cuidar de cada ida e volta.</Text>
      </View>
      <Card>
        <Text style={ui.label}>Matrícula ou usuário</Text>
        <TextInput style={ui.input} value={usuario} onChangeText={setUsuario} autoCapitalize="none" autoCorrect={false}
          accessibilityLabel="Matrícula ou usuário" placeholder="22009264 ou motorista" />
        <Text style={ui.label}>Senha</Text>
        <TextInput style={ui.input} value={senha} onChangeText={setSenha} secureTextEntry autoCapitalize="none"
          accessibilityLabel="Senha" onSubmitEditing={acessar} returnKeyType="go" />
        {erro ? <Text accessibilityLiveRegion="polite" style={ui.error}>{erro}</Text> : null}
        <Botao onPress={acessar} disabled={busy || !usuario.trim() || !senha}>{busy ? 'Conectando…' : 'Entrar'}</Botao>
      </Card>
      <Card>
        <Text style={ui.subtitle}>Experimente a demonstração</Text>
        <Text style={ui.body}>Estudante: 22009264 · senha demo-hash-22009264</Text>
        <Botao secondary disabled={busy} onPress={() => { setUsuario('22009264'); setSenha('demo-hash-22009264'); }}>Preencher estudante</Botao>
        <Text style={ui.body}>Motorista: motorista · senha motorista123</Text>
        <Botao secondary disabled={busy} onPress={() => { setUsuario('motorista'); setSenha('motorista123'); }}>Preencher motorista</Botao>
        <Text style={ui.label}>Também disponível: 22009265 · senha demo-hash-22009265.</Text>
      </Card>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}

