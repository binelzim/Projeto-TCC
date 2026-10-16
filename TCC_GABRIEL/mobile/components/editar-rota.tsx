import { useState } from 'react';
import { Text, View } from 'react-native';
import { Botao, Campo, Card, useUI } from './ui';
import { mensagemDeErro, salvarRota, type Linha } from '@/services/api';
import { usePerfil } from '@/services/perfil';

export function EditarRota({ linha }: { linha: Linha }) {
  const ui = useUI(); const { atualizar } = usePerfil();
  const [nome, setNome] = useState(linha.nome); const [paradas, setParadas] = useState(linha.paradas);
  const [suporte, setSuporte] = useState(linha.suporte || ''); const [busy, setBusy] = useState(false); const [mensagem, setMensagem] = useState(''); const [erro, setErro] = useState('');
  function mover(i: number, delta: number) {
    setParadas(p => { const copia = [...p]; [copia[i], copia[i + delta]] = [copia[i + delta], copia[i]]; return copia; });
  }
  async function salvar() {
    setBusy(true); setMensagem(''); setErro('');
    try { await salvarRota({ nome, paradas, suporte }); await atualizar(); setMensagem('Rota salva. Alterar a ordem das paradas reinicia o marcador dos veículos desta linha.'); }
    catch (e) { setErro(mensagemDeErro(e, 'Não foi possível salvar a rota.')); } finally { setBusy(false); }
  }
  return <Card><Text style={ui.subtitle}>Configurar minha rota</Text><Text style={ui.body}>Organize os pontos na ordem de ida até a faculdade. A lista e o contato são compartilhados pelos veículos desta rota.</Text>
    <Campo label="Nome da linha" value={nome} onChangeText={setNome} maxLength={100} editable={!busy} />
    {paradas.map((p, i) => <View key={i} style={{ gap: 8 }}><Campo label={'Parada ' + (i + 1)} value={p} maxLength={100} editable={!busy}
      onChangeText={texto => setParadas(lista => lista.map((s, j) => i === j ? texto : s))} />
      <View style={ui.row}><Botao secondary icon="arrow-upward" label={'Mover parada ' + (i + 1) + ' para cima'} disabled={busy || i === 0} onPress={() => mover(i, -1)}>Subir</Botao>
        <Botao secondary icon="arrow-downward" label={'Mover parada ' + (i + 1) + ' para baixo'} disabled={busy || i === paradas.length - 1} onPress={() => mover(i, 1)}>Descer</Botao>
        <Botao secondary icon="delete-outline" label={'Remover parada ' + (i + 1)} disabled={busy || paradas.length === 1} onPress={() => setParadas(lista => lista.filter((_, j) => j !== i))}>Remover</Botao></View></View>)}
    <Botao secondary icon="add-location-alt" disabled={busy || paradas.length >= 30} onPress={() => setParadas(p => [...p, ''])}>Adicionar parada</Botao>
    <Campo label="WhatsApp da coordenação (opcional, país + DDD + número)" value={suporte} onChangeText={setSuporte} keyboardType="phone-pad" maxLength={20} editable={!busy} placeholder="Informe somente um contato autorizado" />
    {erro ? <Text style={ui.error} accessibilityLiveRegion="polite">{erro}</Text> : null}
    {mensagem ? <Text style={ui.success} accessibilityLiveRegion="polite">✓ {mensagem}</Text> : null}
    <Botao icon="save" busy={busy} onPress={() => { void salvar(); }}>Salvar rota e paradas</Botao>
  </Card>;
}
