import axios, { isAxiosError } from 'axios';

// EXPO_PUBLIC_API_URL aponta para o módulo de check-in (ex.: http://192.168.0.10:8080/api/checkin).
// A raiz do servidor é derivada dela para acessar os demais módulos (ex.: /api/rastreio).
const API_CHECKIN_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/checkin';
const API_BASE_URL = API_CHECKIN_URL.split('/api')[0];

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'ngrok-skip-browser-warning': 'true',
    'Content-Type': 'application/json',
  },
});

/** Placa fixa da van no MVP. */
export const PLACA_VEICULO = 'ABC-1234';

export type MetodoValidacao = 'QR_CODE' | 'NFC';

export interface CheckInRequest {
  tokenIdentificador: string;
  placaVeiculo: string;
  metodo: MetodoValidacao;
}

/** Espelha o LocalizacaoDTO do backend. */
export interface Localizacao {
  placa: string;
  latitude: number;
  longitude: number;
  ultimaAtualizacao: string;
}

export async function realizarCheckIn(request: CheckInRequest): Promise<string> {
  const { data } = await api.post<string>('/api/checkin/realizar', request);
  return data;
}

export async function buscarLocalizacao(placa: string): Promise<Localizacao> {
  const { data } = await api.get<Localizacao>(`/api/rastreio/${placa}`);
  return data;
}

/**
 * Converte qualquer erro de requisição em uma mensagem legível para o usuário.
 * O backend responde erros de negócio como texto puro ou como JSON com `message`.
 */
export function mensagemDeErro(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  if (!error.response) return 'Sem conexão com o servidor. Verifique sua internet.';

  const data: unknown = error.response.data;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string' && data.message) {
    return data.message;
  }
  return fallback;
}
