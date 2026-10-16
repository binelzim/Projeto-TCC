export type Coordenada = { latitude: number; longitude: number };
export type Amostra = Coordenada & { timestamp: number; accuracy: number; speed: number | null };
export type PosicaoFiltrada = Amostra & { velocidadeKmh: number };
export function haversine(a: Coordenada, b: Coordenada): number {
  const rad = Math.PI / 180;
  const dlat = (b.latitude - a.latitude) * rad, dlon = (b.longitude - a.longitude) * rad;
  const h = Math.sin(dlat / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}
export function filtrarGps(amostra: Amostra, anterior: PosicaoFiltrada | null, agora = Date.now()): PosicaoFiltrada | null {
  if (![amostra.latitude, amostra.longitude, amostra.timestamp, amostra.accuracy].every(Number.isFinite) ||
    Math.abs(amostra.latitude) > 90 || Math.abs(amostra.longitude) > 180 || amostra.accuracy < 0 || amostra.accuracy > 100 ||
    agora - amostra.timestamp > 20000 || amostra.timestamp > agora + 5000 || (anterior && amostra.timestamp <= anterior.timestamp)) return null;
  const intervalo = anterior ? (amostra.timestamp - anterior.timestamp) / 1000 : 0;
  const distancia = anterior ? haversine(anterior, amostra) * 1000 : 0;
  const oscilacao = anterior && distancia < Math.max(8, Math.min(25, amostra.accuracy));
  let velocidade = amostra.speed !== null && Number.isFinite(amostra.speed) && amostra.speed >= 0
    ? amostra.speed * 3.6 : intervalo > 0 ? distancia / intervalo * 3.6 : 0;
  if (velocidade > 180 || (anterior && intervalo > 0 && distancia / intervalo * 3.6 > 180)) return null;
  if (velocidade < 3 || (oscilacao && (amostra.speed === null || amostra.speed < 1))) velocidade = 0;
  return { ...amostra, ...(oscilacao && velocidade === 0 ? { latitude: anterior!.latitude, longitude: anterior!.longitude } : {}), velocidadeKmh: Math.round(velocidade) };
}
export function estimarMinutos(distanciaKm: number, velocidadeKmh: number): number {
  return Math.max(1, Math.ceil(distanciaKm / (velocidadeKmh >= 5 ? velocidadeKmh : 30) * 60));
}
