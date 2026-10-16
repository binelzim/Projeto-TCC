import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AvisoBanner, Botao, Card, Header, Page, Situacao, useUI } from '@/components/ui';
import { buscarMeuHistorico, hora, mensagemDeErro, type Passageiro } from '@/services/api';
import { useAuth } from '@/services/auth';
import { usePerfil } from '@/services/perfil';
import { useSettings } from '@/services/settings';

export default function PerfilScreen() {
  const ui = useUI(); const { colors: c } = useSettings(); const { perfil } = usePerfil(); const { sair } = useAuth(); const foco = useIsFocused();
  const [historico, setHistorico] = useState<Passageiro[]>([]); const [erro, setErro] = useState(''); const [busy, setBusy] = useState(true);
  useEffect(() => {
    if (!foco) return; let ativo = true;
    const carregar = async () => {
      try { const dados = await buscarMeuHistorico(); if (ativo) { setHistorico(dados); setErro(''); } }
      catch (e) { if (ativo) setErro(mensagemDeErro(e, 'Falha ao consultar o histórico.')); } finally { if (ativo) setBusy(false); }
    };
    void carregar(); const timer = setInterval(carregar, 10000);
    return () => { ativo = false; clearInterval(timer); };
  }, [foco]);
  return <Page><Header title="Sua carteirinha" subtitle="IDENTIFICAÇÃO E VIAGENS" /><AvisoBanner />
    <View style={[ui.card, { backgroundColor: c.hero, gap: 20 }]}>
      <View style={[ui.row, { justifyContent: 'space-between' }]}><MaterialIcons name="badge" color="#FFFFFF" size={38} />
        <Text style={[ui.label, { color: '#FFFFFF' }]}>{perfil?.ativo ? '✓ PASSAGEIRO ATIVO' : perfil ? '⚠ PASSAGEIRO INATIVO' : 'CONSULTANDO CADASTRO'}</Text></View>
      <View><Text style={[ui.label, { color: '#FFFFFF' }]}>TRANSPORTE UNIVERSITÁRIO</Text><Text style={[ui.title, { color: '#FFFFFF' }]}>{perfil?.nome || 'Carregando…'}</Text></View>
      <View><Text style={[ui.label, { color: '#FFFFFF' }]}>MATRÍCULA / RA</Text><Text style={[ui.subtitle, { color: '#FFFFFF' }]}>{perfil?.matricula || '—'}</Text></View>
      <Text style={[ui.body, { color: '#FFFFFF' }]}>{perfil?.curso || 'Curso não informado'}{"\n"}{perfil?.linha.nome}{"\n"}Veículo {perfil?.linha.placa || '—'}</Text>
      <View style={{ backgroundColor: c.surface, padding: 16, borderRadius: 12, gap: 6 }}><Text style={ui.label}>CÓDIGO DE IDENTIFICAÇÃO</Text>
        <Text accessibilityLabel={'Código de identificação ' + perfil?.matricula} selectable style={[ui.title, { letterSpacing: 3 }]}>{perfil?.matricula || '—'}</Text>
        <Text style={ui.label}>Identificação no transporte · não substitui documento oficial.</Text></View>
    </View>
    <Text style={ui.subtitle}>Meu histórico de viagens</Text><Text style={ui.body}>Seus últimos 30 dias com embarques registrados.</Text>
    {busy ? <Text style={ui.body}>Consultando viagens…</Text> : null}
    {erro ? <Text style={ui.error} accessibilityLiveRegion="polite">{erro}</Text> : null}
    {!busy && !erro && historico.length === 0 && <Card><Text style={ui.body}>Sua primeira viagem aparecerá aqui após a confirmação da ida.</Text></Card>}
    {historico.map(p => <Card key={p.id}><View style={[ui.row, { justifyContent: 'space-between' }]}><Text style={ui.subtitle}>{p.dia.split('-').reverse().join('/')}</Text><Situacao status={p.status} /></View>
      <Text style={ui.body}>Ida {hora(p.ida)} · Volta {hora(p.volta)}</Text><Text style={ui.label}>{p.placaVeiculo} · {p.metodo === 'NFC' ? 'Carteirinha NFC' : 'QR Code'}</Text></Card>)}
    <Botao secondary icon="logout" onPress={() => { void sair(); }}>Sair da conta</Botao>
  </Page>;
}
