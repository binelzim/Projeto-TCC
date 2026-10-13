import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, MIN_TOUCH, Radius, Spacing } from '@/constants/theme';

export type ToastTipo = 'sucesso' | 'erro' | 'info';

interface ToastDados {
  id: number;
  tipo: ToastTipo;
  titulo: string;
  mensagem?: string;
}

type MostrarToast = (tipo: ToastTipo, titulo: string, mensagem?: string) => void;

const ToastContext = createContext<MostrarToast>(() => {});

const DURACAO_MS = 3500;

const ESTILO_POR_TIPO: Record<ToastTipo, { cor: string; icone: keyof typeof MaterialIcons.glyphMap }> = {
  sucesso: { cor: Colors.success, icone: 'check-circle' },
  erro: { cor: Colors.danger, icone: 'error' },
  info: { cor: Colors.primary, icone: 'info' },
};

/** Notificação não-bloqueante exibida na parte inferior da tela. */
export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastDados | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const mostrar = useCallback<MostrarToast>((tipo, titulo, mensagem) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), tipo, titulo, mensagem });
    // Leitores de tela não leem automaticamente elementos que aparecem; anunciamos explicitamente.
    AccessibilityInfo.announceForAccessibility(mensagem ? `${titulo}. ${mensagem}` : titulo);
    timer.current = setTimeout(() => setToast(null), DURACAO_MS);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const estilo = toast ? ESTILO_POR_TIPO[toast.tipo] : null;

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <View pointerEvents="box-none" style={[styles.area, { bottom: insets.bottom + 72 }]}>
        {toast && estilo && (
          <Animated.View
            key={toast.id}
            entering={FadeInDown.springify().damping(18)}
            exiting={FadeOutDown.duration(200)}
            style={[styles.toast, { borderLeftColor: estilo.cor }]}>
            <MaterialIcons name={estilo.icone} size={28} color={estilo.cor} />
            <View style={styles.textos} accessible accessibilityRole="alert">
              <Text style={styles.titulo}>{toast.titulo}</Text>
              {toast.mensagem ? <Text style={styles.mensagem}>{toast.mensagem}</Text> : null}
            </View>
            <Pressable
              onPress={() => setToast(null)}
              hitSlop={8}
              style={styles.fechar}
              accessibilityRole="button"
              accessibilityLabel="Fechar notificação">
              <MaterialIcons name="close" size={20} color={Colors.textSecondary} />
            </Pressable>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): MostrarToast {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  area: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md - 4,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderLeftWidth: 5,
    paddingVertical: Spacing.md - 4,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  textos: { flex: 1 },
  titulo: { fontSize: 16, fontWeight: '700', color: Colors.text },
  mensagem: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  fechar: {
    minWidth: MIN_TOUCH,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
