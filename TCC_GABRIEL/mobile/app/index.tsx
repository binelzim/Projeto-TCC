import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/toast';
import { Colors, MIN_TOUCH, Radius, Spacing, Typography } from '@/constants/theme';

export default function LoginScreen() {
  const [matricula, setMatricula] = useState('');
  const [cpf, setCpf] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const mostrarToast = useToast();

  const fazerLogin = () => {
    // Atalho para o TCC: matrícula de demonstração
    if (matricula === '22009264') {
      router.push({
        pathname: '/scanner',
        params: { token: matricula, nome: 'Gabriel' },
      });
    } else {
      mostrarToast('erro', 'Acesso negado', 'Matrícula não encontrada. Verifique se digitou corretamente.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.marca} accessible accessibilityRole="header">
          <View style={styles.marcaIcone}>
            <MaterialIcons name="directions-bus" size={40} color={Colors.onPrimary} />
          </View>
          <Text style={styles.titulo}>Portal do Aluno</Text>
          <Text style={styles.subtitulo}>Acesso ao Transporte Universitário</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label} nativeID="label-matricula">Matrícula</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: 22009264"
            placeholderTextColor={Colors.textSecondary}
            value={matricula}
            onChangeText={setMatricula}
            keyboardType="numeric"
            returnKeyType="next"
            accessibilityLabel="Matrícula"
            accessibilityLabelledBy="label-matricula"
          />

          <Text style={styles.label} nativeID="label-senha">Senha (CPF)</Text>
          <View style={styles.inputSenhaContainer}>
            <TextInput
              style={styles.inputSenha}
              placeholder="Somente números"
              placeholderTextColor={Colors.textSecondary}
              value={cpf}
              onChangeText={setCpf}
              secureTextEntry={!mostrarSenha}
              keyboardType="numeric"
              returnKeyType="done"
              onSubmitEditing={fazerLogin}
              accessibilityLabel="Senha, CPF"
              accessibilityLabelledBy="label-senha"
            />
            <Pressable
              style={styles.botaoOlho}
              onPress={() => setMostrarSenha(!mostrarSenha)}
              accessibilityRole="button"
              accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}>
              <MaterialIcons
                name={mostrarSenha ? 'visibility-off' : 'visibility'}
                size={24}
                color={Colors.textSecondary}
              />
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.botaoEntrar, pressed && styles.botaoPressionado]}
            onPress={fazerLogin}
            accessibilityRole="button"
            accessibilityLabel="Entrar no portal do aluno">
            <Text style={styles.textoBotao}>Entrar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  marca: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  marcaIcone: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg + 4,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  titulo: { ...Typography.title, textAlign: 'center' },
  subtitulo: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg - 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs + 2,
  },
  input: {
    ...Typography.body,
    minHeight: 50,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  inputSenhaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  inputSenha: {
    ...Typography.body,
    flex: 1,
    minHeight: 50,
    paddingHorizontal: Spacing.md,
  },
  botaoOlho: {
    minWidth: MIN_TOUCH + 4,
    minHeight: MIN_TOUCH + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoEntrar: {
    minHeight: 52,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPressionado: { backgroundColor: Colors.primaryPressed },
  textoBotao: Typography.button,
});
