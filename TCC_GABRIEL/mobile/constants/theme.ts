export const palettes = {
  light: { background: '#F3F6FB', surface: '#FFFFFF', text: '#15263E', muted: '#52647A', border: '#CAD6E4', primary: '#155BC4', onPrimary: '#FFFFFF', tint: '#E8EFFC', success: '#18643E', warning: '#8A4B08', danger: '#AD261C', hero: '#133864' },
  dark: { background: '#0F172A', surface: '#1E293B', text: '#F1F5F9', muted: '#BCCADD', border: '#55677F', primary: '#93C5FD', onPrimary: '#10213C', tint: '#263C59', success: '#86EFAC', warning: '#FCD34D', danger: '#FDA4AF', hero: '#1E3A5F' },
  contrast: { background: '#000000', surface: '#000000', text: '#FFFFFF', muted: '#FFFFFF', border: '#FFFFFF', primary: '#FFFF00', onPrimary: '#000000', tint: '#101010', success: '#FFFFFF', warning: '#FFFF00', danger: '#FFB4B4', hero: '#000000' },
};
export type ThemeMode = keyof typeof palettes;
export type Palette = typeof palettes.light;
