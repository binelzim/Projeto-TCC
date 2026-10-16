import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { enviarLocalizacao, mensagemDeErro, pararLocalizacao } from './api';
import { filtrarGps, type PosicaoFiltrada } from './geo';

export function useGps(ligado: boolean, placa?: string | null, paradaAtual = -1) {
  const [status, setStatus] = useState('Transmissão desligada.');
  const parada = useRef(paradaAtual);
  useEffect(() => { parada.current = paradaAtual; }, [paradaAtual]);
  useEffect(() => {
    if (!ligado || !placa) { setStatus('Transmissão desligada.'); return; }
    let cancelado = false, ocupado = false;
    let anterior: PosicaoFiltrada | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let envio: Promise<void> = Promise.resolve();
    const capturar = async () => {
      if (ocupado || cancelado) return;
      ocupado = true;
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.BestForNavigation });
        if (cancelado) return;
        const filtrada = filtrarGps({ ...pos.coords, accuracy: pos.coords.accuracy ?? 101, speed: pos.coords.speed, timestamp: pos.timestamp }, anterior);
        if (!filtrada) { setStatus('Sinal impreciso. Aguardando uma leitura GPS confiável.'); return; }
        anterior = filtrada;
        envio = enviarLocalizacao(placa, filtrada.latitude, filtrada.longitude, filtrada.velocidadeKmh, filtrada.accuracy, parada.current);
        await envio;
        if (!cancelado) setStatus('● GPS transmitindo · ' + filtrada.velocidadeKmh + ' km/h · precisão ±' + Math.round(filtrada.accuracy) + ' m');
      } catch (e) { if (!cancelado) setStatus(mensagemDeErro(e, 'GPS indisponível. Confira a permissão e o sinal do aparelho.')); }
      finally { ocupado = false; }
    };
    const iniciar = async () => {
      setStatus('Solicitando acesso à localização…');
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (cancelado) return;
        if (!permission.granted) { setStatus('Localização não autorizada. Libere o acesso nas configurações do aparelho.'); return; }
        void capturar(); timer = setInterval(capturar, 5000);
      } catch { if (!cancelado) setStatus('Não foi possível iniciar o GPS.'); }
    };
    void iniciar();
    return () => { cancelado = true; clearInterval(timer); void envio.catch(() => {}).then(() => pararLocalizacao(placa)).catch(() => {}); };
  }, [ligado, placa]);
  return status;
}
