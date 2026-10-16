import test from 'node:test';
import assert from 'node:assert/strict';
import ndefText from 'react-native-nfc-manager/dist/ndef-lib/ndef-text.js';
import { criarLeitor, identificarTag, LeituraCancelada } from '../services/nfc-core.ts';

const texto = value => ({tnf:1, type:[84], payload:ndefText.encodePayload(value,'pt')});
const ler = registros => identificarTag(registros, ndefText.decodePayload);
const pendente = () => { let resolve; const promise = new Promise(r => {resolve=r;}); return {promise, resolve}; };
const turno = () => new Promise(r => setImmediate(r));
function simulado(overrides = {}) {
  const calls = [];
  const adapter = {
    preparar: async () => { calls.push('preparar'); },
    solicitar: async () => { calls.push('solicitar'); },
    obter: async () => { calls.push('obter'); return '22009264'; },
    cancelar: async () => { calls.push('cancelar'); }, ...overrides,
  };
  return {calls, reader:criarLeitor(async () => adapter, 1000)};
}
test('NDEF real: matrícula, placa, idioma e registro de texto após URI', () => {
  assert.equal(ler([texto('22009264')]),'22009264');
  assert.equal(ler([{tnf:1,type:[85],payload:[0,97]},texto(' ABC-1234 ')]),'ABC-1234');
  assert.equal(ler([{...texto('22009264'),type:'T'}]),'22009264');
});
test('rejeita tags vazias, ambíguas, URI, texto truncado e UTF-16', () => {
  for (const records of [undefined, [], [{tnf:1,type:[85],payload:[0,97]}], [texto('')], [texto('https://site.com')], [texto('1'),texto('2')], [{tnf:1,type:[84],payload:[5,112]}], [{tnf:1,type:[84],payload:[130,112,116,0,49]}]]) {
    assert.throws(() => ler(records));
  }
});
test('sucesso encerra a sessão e permite nova leitura', async () => {
  const {reader,calls}=simulado();
  assert.equal(await reader.ler(),'22009264');
  assert.deepEqual(calls,['preparar','solicitar','obter','cancelar']);
  assert.equal(await reader.ler(),'22009264');
});
test('NFC desligado ou indisponível não solicita tag', async () => {
  const {reader,calls}=simulado({preparar:async()=>{throw new Error('desligado');}});
  await assert.rejects(reader.ler(),/desligado/); assert.deepEqual(calls,[]);
});
test('cancelamento antes do módulo carregar impede abertura tardia', async () => {
  const gate=pendente(); let opened=false;
  const reader=criarLeitor(()=>gate.promise);
  const reading=reader.ler(); reader.cancelar();
  await assert.rejects(reading,LeituraCancelada);
  gate.resolve({preparar:async()=>{opened=true;}}); await turno();
  assert.equal(opened,false);
});
test('cancela espera, descarta leitura tardia e bloqueia sobreposição até encerrar', async () => {
  const tag=pendente(), cleanup=pendente();
  const {reader,calls}=simulado({solicitar:()=>tag.promise,cancelar:()=>cleanup.promise});
  const reading=reader.ler(); await turno();
  reader.cancelar(); await turno();
  await assert.rejects(reader.ler(),/andamento/);
  cleanup.resolve(); await assert.rejects(reading,LeituraCancelada);
  tag.resolve(); await turno(); assert.equal(calls.includes('obter'),false);
});
test('tempo limite encerra a solicitação nativa', async () => {
  let cleaned=false;
  const reader=criarLeitor(async()=>({preparar:async()=>{},solicitar:()=>new Promise(()=>{}),obter:async()=>'',cancelar:async()=>{cleaned=true;}}),10);
  await assert.rejects(reader.ler(),/esgotado/); assert.equal(cleaned,true);
});
test('erro ao ler ainda encerra a sessão', async () => {
  const {reader,calls}=simulado({obter:async()=>{throw new Error('tag removida');}});
  await assert.rejects(reader.ler(),/tag removida/); assert.equal(calls.at(-1),'cancelar');
});
