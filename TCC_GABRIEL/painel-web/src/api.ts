import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  timeout: 10000,
  headers: { 'ngrok-skip-browser-warning': 'true' },
});

/** Espelha o CheckInResponseDTO do backend. */
export interface CheckInRegistro {
  id: number;
  nomeEstudante: string;
  placaVeiculo: string;
  status: string;
  metodo: 'QR_CODE' | 'NFC';
  dataHora: string;
}

export async function buscarHistorico(): Promise<CheckInRegistro[]> {
  const { data } = await api.get<CheckInRegistro[]>('/api/checkin/historico');
  return data;
}

export async function enviarLocalizacao(placa: string, latitude: number, longitude: number): Promise<void> {
  await api.post(`/api/rastreio/${placa}`, { latitude, longitude });
}
