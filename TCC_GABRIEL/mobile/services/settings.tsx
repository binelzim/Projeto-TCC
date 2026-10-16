import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { palettes, type ThemeMode } from '@/constants/theme';

type Settings = { mode: ThemeMode; scale: number; easyTouch: boolean; voice: boolean; haptics: boolean };
const defaults: Settings = { mode: 'light', scale: 1, easyTouch: false, voice: false, haptics: true };
const Context = createContext({ settings: defaults, colors: palettes.light, ready: false,
  update: (_: Partial<Settings>) => {}, announce: (_: string) => {}, vibrate: () => {} });
const KEY = 'rota-universitaria-settings-v2';
function sanitize(value: Partial<Settings>): Settings {
  return { mode: value.mode && value.mode in palettes ? value.mode : 'light',
    scale: [1, 1.2, 1.4].includes(value.scale || 0) ? value.scale! : 1,
    easyTouch: value.easyTouch === true, voice: value.voice === true, haptics: value.haptics !== false };
}
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(defaults);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY).then(raw => { if (active && raw) setSettings(sanitize(JSON.parse(raw))); })
      .catch(() => {}).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (ready) void AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch(() => {}); }, [ready, settings]);
  const update = useCallback((next: Partial<Settings>) => setSettings(s => sanitize({ ...s, ...next })), []);
  const announce = useCallback((message: string) => {
    if (!settings.voice) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(message); speech.lang = 'pt-BR'; window.speechSynthesis.speak(speech);
    } else if (Platform.OS !== 'web') { void Speech.stop(); Speech.speak(message, { language: 'pt-BR' }); }
  }, [settings.voice]);
  const vibrate = useCallback(() => {
    if (settings.haptics && Platform.OS !== 'web') void Haptics.selectionAsync().catch(() => {});
  }, [settings.haptics]);
  const value = useMemo(() => ({ settings, colors: palettes[settings.mode], ready, update, announce, vibrate }), [settings, ready, update, announce, vibrate]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useSettings = () => useContext(Context);
