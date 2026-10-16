import test from 'node:test';
import assert from 'node:assert/strict';
import { haversine, filtrarGps, estimarMinutos } from '../services/geo.ts';
import { gerarCsv, gerarResumo } from '../services/relatorio.ts';

test('Haversine retorna km, trata pontos iguais, simetria e antípodas', () => {
  const a = { latitude: 0, longitude: 0 }, b = { latitude: 0, longitude: 1 };
  assert.equal(haversine(a, a), 0);
  assert.ok(Math.abs(haversine(a, b) - 111.195) < .001);
  assert.equal(haversine(a, b), haversine(b, a));
  assert.ok(Math.abs(haversine(a, { latitude: 0, longitude: 180 }) - Math.PI * 6371) < .001);
});

const now = 100000;
const sample = { latitude: -18.58, longitude: -46.51, timestamp: now, accuracy: 5, speed: 10 };
test('GPS converte m/s, rejeita precisão ruim, posição vencida e salto impossível', () => {
  const first = filtrarGps(sample, null, now);
  assert.equal(first.velocidadeKmh, 36);
  assert.equal(filtrarGps({ ...sample, accuracy: 101 }, null, now), null);
  assert.equal(filtrarGps({ ...sample, timestamp: now - 20001 }, null, now), null);
  assert.equal(filtrarGps({ ...sample, speed: 51 }, null, now), null);
  assert.equal(filtrarGps({ ...sample, latitude: -19, timestamp: now + 5000 }, first, now + 5000), null);
  assert.equal(filtrarGps(sample, first, now), null);
});

test('GPS filtra oscilação parado e mantém atualização recente', () => {
  const first = filtrarGps({ ...sample, speed: null }, null, now);
  const next = filtrarGps({ ...sample, speed: null, latitude: sample.latitude + .00001, timestamp: now + 5000 }, first, now + 5000);
  assert.equal(next.velocidadeKmh, 0);
  assert.equal(next.latitude, first.latitude);
  assert.equal(next.timestamp, now + 5000);
});

test('ETA usa velocidade atual ou referência de 30 km/h com mínimo de um minuto', () => {
  assert.equal(estimarMinutos(1.4, 0), 3);
  assert.equal(estimarMinutos(2, 60), 2);
  assert.equal(estimarMinutos(0, 0), 1);
});

const painel = { placa: 'ABC-1234', dia: '2026-10-15', foramHoje: 1, jaVoltaram: 0, faltamChegar: 1, dispensados: 0,
  passageiros: [{ dia: '2026-10-15', placaVeiculo: 'ABC-1234', nomeEstudante: '=HYPERLINK("teste")', matricula: '001234',
    status: 'NA_FACULDADE', ida: '2026-10-15T21:30:00Z', volta: null }] };
test('CSV preserva acentos, aspas e neutraliza fórmulas; usa hora de Brasília', () => {
  const csv = gerarCsv(painel);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"Matrícula"'));
  assert.ok(csv.includes('"\'=HYPERLINK(""teste"")"'));
  assert.ok(csv.includes('"18:30"'));
  assert.ok(csv.includes('"Falta voltar"'));
  assert.equal(csv.split('\r\n').length, 3);
});

test('Resumo para compartilhamento contém veículo e chamada do dia', () => {
  const resumo = gerarResumo(painel);
  assert.ok(resumo.includes('ABC-1234'));
  assert.ok(resumo.includes('Aguardados: 1'));
  assert.ok(resumo.includes('RA 001234'));
});
