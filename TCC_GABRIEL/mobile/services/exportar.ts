import { Platform, Share } from 'react-native';
import type { Painel } from './api';
import { gerarCsv, gerarResumo } from './relatorio';
export async function exportarChamada(painel: Painel) {
  if (Platform.OS === 'web') {
    const blob = new Blob([gerarCsv(painel)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = 'chamada-' + painel.placa + '-' + painel.dia + '.csv';
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  } else await Share.share({ title: 'Chamada do dia', message: gerarResumo(painel) });
}
