/**
 * Design system do app do aluno.
 * Paleta definida nas diretrizes de UX/UI: fundo cinza-claro, texto quase preto,
 * azul institucional para ações primárias e verde/vermelho para status.
 */

export const Colors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#636366', // contraste 5.9:1 sobre #F2F2F7 (WCAG AA)
  border: '#D1D1D6',
  primary: '#007AFF',
  primaryPressed: '#0062CC',
  success: '#34C759',
  successText: '#1E7B34', // verde escurecido para texto (contraste AA)
  danger: '#FF3B30',
  dangerText: '#C4271D',
  onPrimary: '#FFFFFF',
  scannerBackground: '#111113',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

/** Área mínima de toque recomendada (44x44 dp). */
export const MIN_TOUCH = 44;

/**
 * Hierarquia tipográfica. Os tamanhos são a base: como nenhum Text desativa
 * `allowFontScaling`, todos crescem com a preferência de fonte do sistema (Dynamic Type).
 */
export const Typography = {
  title: { fontSize: 28, fontWeight: '700' as const, color: Colors.text },
  subtitle: { fontSize: 17, fontWeight: '600' as const, color: Colors.text },
  body: { fontSize: 16, color: Colors.text },
  caption: { fontSize: 13, color: Colors.textSecondary },
  button: { fontSize: 17, fontWeight: '600' as const, color: Colors.onPrimary },
};
