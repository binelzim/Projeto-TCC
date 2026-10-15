import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { enviarLocalizacao, mensagemDeErro, pararLocalizacao, PLACA_VEICULO } from './api';

export function useGps(ligado: boolean) {
  const [status, setStatus] = useState('GPS desligado');
  useEffect(() => {
    if (!ligado) return;
    let ativo = true;
    let busy = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    let envio: Promise<void> = Promise.resolve();
    const transmitir = async () => {
      if (!ativo || busy) return;
      busy = true;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        if (!ativo) return;
        envio = enviarLocalizacao(PLACA_VEICULO, pos.coords.latitude, pos.coords.longitude);
        await envio;
        if (ativo) setStatus('GPS ativo · localização enviada às ' + new Date().toLocaleTimeString('pt-BR'));
      } catch (e) {
        if (ativo) setStatus(mensagemDeErro(e, 'Sem sinal de GPS. Confira a permissão de localização e tente ao ar livre.'));
      } finally { busy = false; }
    };
    const iniciar = async () => {
      setStatus('Aguardando permissão e sinal de GPS…');
      try {
        const { status: permissao } = await Location.requestForegroundPermissionsAsync();
        if (!ativo) return;
        if (permissao !== 'granted') { setStatus('Localização não autorizada. Libere a permissão e ligue o GPS novamente.'); return; }
        void transmitir(); timer = setInterval(transmitir, 5000);
      } catch { if (ativo) setStatus('Não foi possível acessar o GPS deste dispositivo.'); }
    };
    void iniciar();
    return () => { ativo = false; clearInterval(timer); void envio.catch(() => {}).then(() => pararLocalizacao()).catch(() => {}); };
  }, [ligado]);
  return ligado ? status : 'GPS desligado';
}

