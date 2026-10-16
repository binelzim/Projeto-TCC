import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { criarLeitor, ErroNfc, identificarTag, LeituraCancelada } from './nfc-core';

export { LeituraCancelada } from './nfc-core';

const leitor = criarLeitor(async () => {
  if (Platform.OS === 'web' || Constants.appOwnership === 'expo')
    throw new ErroNfc('NFC requer o aplicativo nativo instalado. No navegador ou Expo Go, use QR Code.');
  const { default: manager, NfcTech, Ndef, NfcError } = await import('react-native-nfc-manager');
  const traduzir = async <T>(acao: () => Promise<T>): Promise<T> => {
    try { return await acao(); }
    catch (e) {
      if (e instanceof ErroNfc) throw e;
      if (e instanceof NfcError.UserCancel) throw new LeituraCancelada('Leitura NFC cancelada.');
      if (e instanceof NfcError.Timeout) throw new ErroNfc('Tempo de leitura esgotado. Aproxime a tag e tente novamente.');
      if (e instanceof NfcError.RadioDisabled) throw new ErroNfc('Ative o NFC nas configurações do Android e tente novamente.');
      throw new ErroNfc('Não foi possível ler a tag. Mantenha-a próxima ao celular e tente novamente.');
    }
  };
  return {
    preparar: () => traduzir(async () => {
      if (!await manager.isSupported(NfcTech.Ndef)) throw new ErroNfc('Este aparelho não oferece leitura NFC NDEF.');
      await manager.start();
      if (Platform.OS === 'android' && !await manager.isEnabled())
        throw new ErroNfc('Ative o NFC nas configurações do Android e tente novamente.');
    }),
    solicitar: () => traduzir(() => manager.requestTechnology(NfcTech.Ndef, {
      alertMessage: 'Aproxime a tag da parte superior do iPhone para identificar seu embarque.',
    })),
    obter: () => traduzir(async () => {
      const tag = await manager.getTag();
      return identificarTag(tag?.ndefMessage, bytes => Ndef.text.decodePayload(bytes));
    }),
    cancelar: () => manager.cancelTechnologyRequest(),
  };
});

export const lerNfc = () => leitor.ler();
export const cancelarNfc = () => leitor.cancelar();
