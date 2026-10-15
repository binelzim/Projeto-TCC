import Constants from 'expo-constants';
import { Platform } from 'react-native';

export async function lerNfc(): Promise<string> {
  if (Platform.OS === 'web' || Constants.appOwnership === 'expo')
    throw new Error('NFC requer um aparelho compatível com o aplicativo instalado. No navegador ou Expo Go, use QR Code ou a simulação.');
  const { default: NfcManager, NfcTech, Ndef } = await import('react-native-nfc-manager');
  try {
    if (!await NfcManager.isSupported()) throw new Error('Este aparelho não oferece NFC.');
    await NfcManager.start();
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    const record = tag?.ndefMessage?.[0];
    if (!record) throw new Error('Tag sem identificação. Use uma tag NDEF de texto.');
    const token = Ndef.text.decodePayload(new Uint8Array(record.payload));
    if (!token) throw new Error('Identificação NFC vazia.');
    return token;
  } finally { await NfcManager.cancelTechnologyRequest().catch(() => {}); }
}
export async function cancelarNfc() {
  if (Platform.OS === 'web' || Constants.appOwnership === 'expo') return;
  const { default: NfcManager } = await import('react-native-nfc-manager');
  await NfcManager.cancelTechnologyRequest().catch(() => {});
}

