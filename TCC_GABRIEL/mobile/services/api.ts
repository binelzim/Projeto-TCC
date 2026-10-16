import axios, { isAxiosError } from 'axios';
const ENV_URL = process.env.EXPO_PUBLIC_API_URL;

export function normalizarUrl(value?: string): string {
  return (value?.trim() || 'http://localhost:8080').replace(/\/+$/, '').replace(/\/api(?:\/checkin)?$/i, '');
}

const api = axios.create({
  baseURL: normalizarUrl(ENV_URL),
  timeout: 60000,
  headers: { 'ngrok-skip-browser-warning': 'true', 'Content-Type': 'application/json' },
});
export type Role = 'ESTUDANTE' | 'MOTORISTA';
export type MetodoValidacao = 'QR_CODE' | 'NFC';
export type StatusDia = 'NA_FACULDADE' | 'EMBARCADO_VOLTA' | 'VOLTA_DISPENSADA';
export interface Sessao {
  nome: string; matricula: string; token: string; role: Role; tokenIdentificador: string | null; expiresAt: string;
}
export interface Passageiro {
  id: number; estudanteId: number; nomeEstudante: string; matricula: string; placaVeiculo: string;
  dia: string; ida: string; volta: string | null; status: StatusDia; metodo: MetodoValidacao; proximaLeituraEm: string;
}
export interface Painel {
  dia: string; placa: string; foramHoje: number; jaVoltaram: number; faltamChegar: number;
  dispensados: number; demoEnabled: boolean; passageiros: Passageiro[];
}
export interface Localizacao { placa: string; latitude: number; longitude: number; ultimaAtualizacao: string; velocidadeKmh: number; precisaoMetros: number | null; paradaAtual: number }
export interface Aviso { mensagem: string; motorista: string; criadoEm: string }
export interface Linha { id: number; nome: string; destino: string; veiculoId: number | null; placa: string | null; motorista: string | null; paradas: string[]; paradaAtual: number; paradaAtualizadaEm: string | null; aviso: Aviso | null; suporte: string | null }
export interface Perfil { nome: string; matricula: string; curso: string | null; ativo: boolean; linha: Linha }
export interface Aluno { id: number; nome: string; matricula: string; curso: string; ativo: boolean; placaVeiculo: string }
export interface Cadastro { role: Role; nome: string; matricula: string; curso?: string; senha: string; veiculoId?: number; placa?: string; rotaId?: number; novaRota?: string; codigoFrota?: string }
export const ROTULOS: Record<StatusDia, string> = {
  NA_FACULDADE: 'Falta voltar', EMBARCADO_VOLTA: 'Embarcado para volta', VOLTA_DISPENSADA: 'Volta dispensada',
};
let onUnauthorized: (() => void) | undefined;
export function aoExpirarSessao(callback?: () => void) { onUnauthorized = callback; }
export function definirSessao(sessao: Sessao | null) {
  if (sessao) api.defaults.headers.common.Authorization = 'Bearer ' + sessao.token;
  else delete api.defaults.headers.common.Authorization;
}
api.interceptors.response.use(response => response, error => {
  if (isAxiosError(error) && error.response?.status === 401 && !error.config?.url?.startsWith('/api/auth/')) onUnauthorized?.();
  return Promise.reject(error);
});
export async function login(matricula: string, senha: string): Promise<Sessao> {
  return (await api.post<Sessao>('/api/auth/login', { matricula, senha })).data;
}
export async function logout() {
  try { await api.post('/api/auth/logout'); } finally { definirSessao(null); }
}
export async function realizarCheckIn(request: { tokenIdentificador: string; placaVeiculo: string; metodo: MetodoValidacao }): Promise<Passageiro> {
  return (await api.post<Passageiro>('/api/checkin/realizar', request)).data;
}
export async function buscarMeuDia(): Promise<Passageiro | null> {
  return (await api.get<Passageiro | ''>('/api/checkin/dia')).data || null;
}
export async function buscarPainel(): Promise<Painel> { return (await api.get<Painel>('/api/checkin/painel')).data; }
export async function dispensarVolta(estudanteId?: number): Promise<Passageiro> {
  return (await api.post<Passageiro>('/api/checkin/dispensar' + (estudanteId === undefined ? '' : '/' + estudanteId))).data;
}
export async function reiniciarDia(): Promise<void> { await api.delete('/api/checkin/dia'); }
export async function buscarLocalizacao(placa: string): Promise<Localizacao> { return (await api.get<Localizacao>('/api/rastreio/' + placa)).data; }
export async function enviarLocalizacao(placa: string, latitude: number, longitude: number, velocidadeKmh: number, precisaoMetros: number, paradaAtual: number): Promise<void> {
  await api.post('/api/rastreio/' + placa, { latitude, longitude, velocidadeKmh, precisaoMetros, paradaAtual });
}
export async function pararLocalizacao(placa: string): Promise<void> { await api.delete('/api/rastreio/' + placa); }
export async function buscarPerfil(): Promise<Perfil> { return (await api.get<Perfil>('/api/perfil')).data; }
export async function buscarRotas(): Promise<Linha[]> { return (await api.get<Linha[]>('/api/rotas')).data; }
export async function buscarConfig(): Promise<{ demoEnabled: boolean }> { return (await api.get('/api/config')).data; }
export async function cadastrar(req: Cadastro): Promise<Sessao> { return (await api.post<Sessao>('/api/auth/cadastro', req)).data; }
export async function buscarAlunos(): Promise<Aluno[]> { return (await api.get<Aluno[]>('/api/frota/passageiros')).data; }
export async function cadastrarAluno(req: Cadastro): Promise<Aluno> { return (await api.post<Aluno>('/api/frota/passageiros', req)).data; }
export async function salvarRota(req: { nome: string; paradas: string[]; suporte: string }): Promise<Linha> { return (await api.put<Linha>('/api/frota/rota', req)).data; }
export async function atualizarParada(indice: number): Promise<Linha> { return (await api.post<Linha>('/api/frota/parada', { indice })).data; }
export async function enviarAviso(mensagem: string): Promise<Linha> { return (await api.post<Linha>('/api/frota/aviso', { mensagem })).data; }
export async function buscarMeuHistorico(): Promise<Passageiro[]> { return (await api.get<Passageiro[]>('/api/checkin/meu-historico')).data; }
export function mensagemDeErro(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  if (!error.response) return 'Sem conexão com o servidor. Ele pode estar iniciando; tente novamente em instantes.';
  const data: unknown = error.response.data;
  if (typeof data === 'string' && data.trim() && !data.includes('<html')) return data;
  if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') return data.message;
  return fallback;
}
export function hora(iso: string | null): string {
  return iso ? new Date(iso).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }) : '—';
}
