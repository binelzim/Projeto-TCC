import { useEffect, useState } from 'react';
import { enviarLocalizacao, mensagemDeErro, pararLocalizacao, PLACA_VEICULO } from './api';

export function useGps(ligado: boolean) {
  const [status, setStatus] = useState('GPS desligado');
  useEffect(() => {
    if (!ligado) return;
    let ativo = true;
    let busy = false;
    let envio: Promise<void> = Promise.resolve();
    const atualizar = () => {
      if (!ativo || busy) return;
      if (!navigator.geolocation) { setStatus('Este navegador não oferece localização.'); return; }
      busy = true;
      navigator.geolocation.getCurrentPosition(pos => {
        if (!ativo) { busy = false; return; }
        envio = enviarLocalizacao(PLACA_VEICULO, pos.coords.latitude, pos.coords.longitude);
        void envio.then(() => { if (ativo) setStatus('GPS ativo · atualizado às ' + new Date().toLocaleTimeString('pt-BR')); })
          .catch(e => { if (ativo) setStatus(mensagemDeErro(e, 'Falha ao transmitir o GPS.')); })
          .finally(() => { busy = false; });
      }, () => {
        busy = false;
        if (ativo) setStatus('Sem sinal. Permita a localização no navegador e tente ao ar livre.');
      }, { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 });
    };
    const inicial = setTimeout(() => { setStatus('Buscando sinal de GPS…'); atualizar(); }, 0);
    const timer = setInterval(atualizar, 5000);
    return () => { ativo = false; clearTimeout(inicial); clearInterval(timer); void envio.catch(() => {}).then(() => pararLocalizacao()).catch(() => {}); };
  }, [ligado]);
  return ligado ? status : 'GPS desligado';
}

