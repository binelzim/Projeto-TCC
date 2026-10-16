import type { Painel } from './api';
const status = { NA_FACULDADE: 'Falta voltar', EMBARCADO_VOLTA: 'Volta confirmada', VOLTA_DISPENSADA: 'Volta dispensada' };
function hora(iso: string | null) { return iso ? new Date(iso).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }) : '—'; }
function celula(valor: string) {
  // Impede que nomes ou matrículas sejam interpretados como fórmulas ao abrir no Excel.
  const seguro = /^[\s]*[=+@-]|^[\t\r]/.test(valor) ? "'" + valor : valor;
  return '"' + seguro.replace(/"/g, '""') + '"';
}
export function gerarCsv(painel: Painel): string {
  const linhas = [['Data', 'Placa', 'Nome', 'Matrícula', 'Status', 'Hora de Ida', 'Hora de Volta'],
    ...painel.passageiros.map(p => [p.dia, p.placaVeiculo, p.nomeEstudante, p.matricula, status[p.status], hora(p.ida), hora(p.volta)])];
  return '\uFEFF' + linhas.map(l => l.map(celula).join(';')).join('\r\n') + '\r\n';
}
export function gerarResumo(painel: Painel): string {
  return ['Chamada · ' + painel.dia + ' · ' + painel.placa, 'Ida: ' + painel.foramHoje + ' | Volta: ' + painel.jaVoltaram + ' | Aguardados: ' + painel.faltamChegar + ' | Dispensados: ' + painel.dispensados,
    ...painel.passageiros.map(p => p.nomeEstudante + ' (RA ' + p.matricula + ') · ' + status[p.status] + ' · Ida ' + hora(p.ida) + ' · Volta ' + hora(p.volta))].join('\n');
}
