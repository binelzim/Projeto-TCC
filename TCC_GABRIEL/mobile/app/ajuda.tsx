import { useState } from 'react';
import { Linking, Platform, Share, Text, View } from 'react-native';
import { Botao, Card, Header, Page, useUI } from '@/components/ui';
import { usePerfil } from '@/services/perfil';

const perguntas = [
  ['A câmera não consegue ler o QR Code. O que fazer?', 'Limpe a lente, melhore a iluminação e enquadre o código inteiro. Confira a permissão da câmera. Em demonstrações, use “Simular leitura”. O NFC exige aparelho e versão instalada compatíveis; no Expo Go use QR Code. Se o problema continuar, procure o motorista.'],
  ['Fui de ônibus, mas volto de carona. Como proceder?', 'Na aba Embarque, escolha “Não volto hoje / Peguei carona” e confirme. A opção aparece após a ida e antes da volta. O motorista deixa de aguardar você; a dispensa fica registrada no dia.'],
  ['Como sei se o ônibus já passou pelo meu ponto?', 'Abra Minha linha. A linha do tempo mostra as paradas percorridas, a parada informada pelo motorista e as próximas. Confira o horário da atualização. O GPS mostra a posição recente; o marcador das paradas é atualizado manualmente.'],
  ['Esqueci um pertence no veículo. Como falar com o motorista?', 'Use o contato de coordenação abaixo e informe linha, placa, dia e descrição do pertence. O motorista configura esse contato na área Rota. Se não houver número, prepare a mensagem e escolha a pessoa responsável no seu aplicativo de mensagens.'],
] as const;
export default function Ajuda() {
  const ui = useUI(); const { perfil } = usePerfil(); const [aberta, setAberta] = useState<number | null>(null); const [erro, setErro] = useState(''); const [rascunho, setRascunho] = useState('');
  async function suporte() {
    const texto = 'Olá, preciso de ajuda com o transporte universitário.' + (perfil ? ' Linha: ' + perfil.linha.nome + '. Veículo: ' + perfil.linha.placa + '.' : '');
    try {
      if (perfil?.linha.suporte) await Linking.openURL('https://wa.me/' + perfil.linha.suporte + '?text=' + encodeURIComponent(texto));
      else {
        setRascunho(texto);
        if (Platform.OS !== 'web') await Share.share({ message: texto, title: 'Ajuda com transporte' });
      }
    } catch { setErro('Não foi possível abrir o compartilhamento. Procure a coordenação pelo contato da sua instituição.'); }
  }
  return <Page><Header title="Central de Ajuda" back /><Text style={ui.body}>Da primeira leitura ao retorno: veja como organizar sua viagem.</Text>
    <View style={[ui.row, { alignItems: 'stretch' }]}>{[['1 · Embarque de ida', 'Leia o QR Code ao entrar. Sua ida é confirmada.'], ['2 · Bom estudo!', 'Desembarque na faculdade. Não precisa ler novamente para sair.'], ['3 · Embarque de volta', 'Leia novamente ao entrar para voltar, ou avise que pegou carona.']].map(([title, text]) =>
      <View key={title} style={[ui.card, { flex: 1, minWidth: 220 }]}><Text style={ui.subtitle}>{title}</Text><Text style={ui.body}>{text}</Text></View>)}</View>
    <Text style={ui.subtitle}>Perguntas frequentes</Text>
    {perguntas.map(([p, resposta], i) => <Card key={p}><Botao secondary icon={aberta === i ? 'expand-less' : 'expand-more'} label={p + (aberta === i ? ', recolher resposta' : ', expandir resposta')}
      onPress={() => setAberta(aberta === i ? null : i)}>{p}</Botao>{aberta === i && <Text style={ui.body}>{resposta}</Text>}</Card>)}
    <Card><Text style={ui.subtitle}>Fale com a coordenação</Text><Text style={ui.body}>{perfil?.linha.suporte ? 'Contato informado pela sua linha: +' + perfil.linha.suporte : 'Esta linha ainda não informou um telefone de suporte. Prepare uma mensagem e escolha o contato da coordenação.'}</Text>
      <Botao icon="support-agent" onPress={() => { void suporte(); }}>{perfil?.linha.suporte ? 'Abrir WhatsApp da coordenação' : 'Preparar mensagem de suporte'}</Botao>
      <Text style={ui.label}>Você revisa a mensagem e decide quando enviar. Este canal não é um serviço de emergência.</Text>
      {rascunho ? <><Text style={ui.label}>Copie a mensagem e envie ao contato responsável:</Text><Text selectable style={ui.body}>{rascunho}</Text></> : null}
      {erro ? <Text style={ui.error}>{erro}</Text> : null}
    </Card>
  </Page>;
}
