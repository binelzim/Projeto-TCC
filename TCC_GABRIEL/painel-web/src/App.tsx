import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { aoExpirarSessao, buscarPainel, definirSessao, dispensarVolta, hora, login, logout,
  mensagemDeErro, reiniciarDia, ROTULOS, type Painel, type Sessao } from './api';
import { useGps } from './useGps';
import './App.css';

function IconeVan() {
  return <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <rect x="4" y="3" width="16" height="16" rx="4" /><path d="M4 11h16M8 19v2m8-2v2M8 7h8" />
    <circle cx="8" cy="15" r="1" /><circle cx="16" cy="15" r="1" />
  </svg>;
}
export default function App() {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [expirou, setExpirou] = useState(false);
  useEffect(() => {
    aoExpirarSessao(() => { definirSessao(null); setSessao(null); setExpirou(true); });
    return () => aoExpirarSessao(undefined);
  }, []);
  const sair = async () => {
    try { await logout(); } catch { /* O acesso local também é encerrado sem rede. */ }
    finally { setSessao(null); }
  };
  if (!sessao) return <Login expirou={expirou} entrar={s => { definirSessao(s); setSessao(s); setExpirou(false); }} />;
  return <Dashboard sessao={sessao} sair={sair} />;
}
function Login({ entrar, expirou }: { entrar: (s: Sessao) => void; expirou: boolean }) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');
  const acessar = async (e: FormEvent) => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setErro('');
    try {
      const s = await login(usuario.trim(), senha);
      if (s.role !== 'MOTORISTA') {
        definirSessao(s); await logout();
        setErro('Este painel é exclusivo do motorista. Use o aplicativo para acessar como estudante.');
      } else entrar(s);
    } catch (error) { setErro(mensagemDeErro(error, 'Não foi possível entrar.')); }
    finally { setBusy(false); }
  };
  return <main className="login-shell">
    <section className="login-story">
      <div className="brand"><span className="brand-icon"><IconeVan /></span>Rota Universitária</div>
      <div><p className="eyebrow">LAGOA FORMOSA ↔ UNIPAM</p><h1>Uma viagem tranquila começa com todos a bordo.</h1>
        <p className="story-copy">Acompanhe cada embarque, saiba quem ainda falta e coordene o retorno com segurança.</p></div>
      <div className="route-line"><span>Lagoa Formosa</span><span className="route-dots" /><span>UNIPAM</span></div>
    </section>
    <section className="login-form-area">
      <div className="login-box"><p className="eyebrow blue">ÁREA DO MOTORISTA</p><h2>Bem-vindo de volta.</h2><p className="muted">Entre para acompanhar a viagem de hoje.</p>
        <form onSubmit={acessar}>
          <label htmlFor="usuario">Usuário</label><input id="usuario" autoComplete="username" value={usuario} onChange={e => setUsuario(e.target.value)} required />
          <label htmlFor="senha">Senha</label><input id="senha" type="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} required />
          {(erro || expirou) && <p className="error" role="alert">{erro || 'Sua sessão expirou. Entre novamente.'}</p>}
          <button className="primary full" disabled={busy}>{busy ? 'Conectando…' : 'Entrar no painel →'}</button>
        </form>
        <div className="demo-box"><strong>Pronto para a demonstração</strong><p>Usuário: motorista<br />Senha: motorista123</p>
          <button type="button" className="secondary full" disabled={busy} onClick={() => { setUsuario('motorista'); setSenha('motorista123'); }}>Preencher credenciais de teste</button></div>
      </div>
    </section>
  </main>;
}
function Dashboard({ sessao, sair }: { sessao: Sessao; sair: () => Promise<void> }) {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState('');
  const [acaoErro, setAcaoErro] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [gpsLigado, setGpsLigado] = useState(false);
  const [ultimaConsulta, setUltimaConsulta] = useState('');
  const consultando = useRef(false);
  const mounted = useRef(true);
  const gps = useGps(gpsLigado);
  const carregar = useCallback(async () => {
    if (consultando.current) return;
    consultando.current = true;
    try {
      const dados = await buscarPainel();
      if (mounted.current) { setPainel(dados); setErro(''); setUltimaConsulta(new Date().toLocaleTimeString('pt-BR')); }
    } catch (e) { if (mounted.current) setErro(mensagemDeErro(e, 'Falha ao atualizar os passageiros.')); }
    finally { consultando.current = false; }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const inicial = setTimeout(() => { void carregar(); }, 0);
    const timer = setInterval(carregar, 5000);
    return () => { mounted.current = false; clearTimeout(inicial); clearInterval(timer); };
  }, [carregar]);
  const acao = async (fn: () => Promise<unknown>) => {
    setBusy(true); setAcaoErro('');
    try { await fn(); await carregar(); }
    catch (e) { setAcaoErro(mensagemDeErro(e, 'Não foi possível concluir a ação.')); }
    finally { setBusy(false); setConfirmar(false); }
  };
  const pendentes = painel?.faltamChegar ?? 0;
  const pronto = painel && painel.foramHoje > 0 && pendentes === 0 && !erro;
  return <div className="dashboard">
    <a className="skip-link" href="#passageiros">Pular para passageiros</a>
    <header className="topbar"><div className="brand"><span className="brand-icon"><IconeVan /></span>Rota Universitária</div>
      <div className="topbar-user"><span>{sessao.nome}</span><button className="secondary" onClick={() => { setGpsLigado(false); void sair(); }}>Sair</button></div></header>
    <main className="dashboard-main">
      <section className="heading"><div><p className="eyebrow blue">CONTROLE DE EMBARQUE</p><h1>A viagem de hoje</h1>
        <p className="muted">Lagoa Formosa ↔ UNIPAM <span aria-hidden="true">·</span> Van ABC-1234</p></div>
        <div className="date-chip">{painel ? painel.dia.split('-').reverse().join('/') : 'Consultando…'}<small>Horário de Brasília</small></div></section>
      <section className="stats" aria-label="Resumo da viagem" aria-live="polite">
        <article className="stat"><span className="stat-label">Foram na ida</span><strong>{painel?.foramHoje ?? '—'}</strong><span>estudantes registrados</span><span className="stat-index">01 / IDA</span></article>
        <article className="stat green"><span className="stat-label">Já voltaram</span><strong>{painel?.jaVoltaram ?? '—'}</strong><span>a bordo para o retorno</span><span className="stat-index">02 / VOLTA</span></article>
        <article className={'stat ' + (pendentes ? 'amber' : '')}><span className="stat-label">Faltam chegar</span><strong>{painel?.faltamChegar ?? '—'}</strong><span>aguardados na faculdade</span><span className="stat-index">03 / CONFERÊNCIA</span></article>
      </section>
      <section className={'return-banner ' + (pronto ? 'ready' : pendentes ? 'pending' : '')} aria-live="polite">
        <span className="banner-symbol" aria-hidden="true">{pronto ? '✓' : pendentes ? '!' : '↔'}</span>
        <div><h2>{erro ? 'Confirme a conexão antes de partir' : !painel ? 'Consultando o retorno…' : pendentes ?
          'Ainda há estudantes aguardados' : pronto ? 'Todos prontos! Pode partir.' : 'Aguardando os primeiros embarques'}</h2>
          <p>{erro ? 'A última lista pode estar desatualizada.' : pendentes ? 'Confira a lista abaixo antes de iniciar a viagem de volta.' :
            pronto ? 'Todos que foram na ida embarcaram na volta ou foram dispensados.' : 'Cada primeira leitura aparecerá automaticamente no painel.'}</p></div>
        <span className="dispensed">{painel?.dispensados ?? 0} volta(s) dispensada(s)</span>
      </section>
      {(erro || acaoErro) && <div className="error-box" role="alert">{acaoErro || erro}</div>}
      <section className="gps-card">
        <div><p className="eyebrow blue">LOCALIZAÇÃO AO VIVO</p><h2>Compartilhe a posição da van</h2><p className="muted" aria-live="polite">{gps}</p>
          <small>Mantenha esta página aberta durante a transmissão.</small></div>
        <button className={gpsLigado ? 'secondary' : 'primary'} onClick={() => setGpsLigado(v => !v)}>{gpsLigado ? 'Desligar transmissão GPS' : 'Ligar transmissão GPS'}</button>
      </section>
      <section id="passageiros" className="passengers" tabIndex={-1}>
        <div className="table-heading"><div><h2>Passageiros de hoje</h2><p className="muted">Uma lista para acompanhar a ida e conferir a volta.</p></div><small>Atualizado {ultimaConsulta || '—'}</small></div>
        {!painel ? <p className="empty" role="status">Carregando passageiros…</p> : painel.passageiros.length === 0 ?
          <div className="empty"><IconeVan /><h3>Nenhum embarque por enquanto</h3><p>Os registros por QR Code e NFC aparecerão aqui.</p></div> :
          <div className="table-scroll"><table><caption className="sr-only">Passageiros da van ABC-1234 no dia atual</caption>
            <thead><tr><th scope="col">Estudante</th><th scope="col">Ida</th><th scope="col">Volta</th><th scope="col">Situação</th><th scope="col">Ação</th></tr></thead>
            <tbody>{painel.passageiros.map(p => <tr key={p.id}>
              <th scope="row"><span className="passenger-name">{p.nomeEstudante}</span><small>{p.matricula}</small></th>
              <td>{hora(p.ida)}</td><td>{hora(p.volta)}</td><td><span className={'badge ' + p.status}>{ROTULOS[p.status]}</span></td>
              <td>{p.status === 'NA_FACULDADE' ? <button className="text-button" disabled={busy}
                aria-label={'Dispensar volta de ' + p.nomeEstudante} onClick={() => { void acao(() => dispensarVolta(p.estudanteId)); }}>Dispensar Volta</button> : '—'}</td>
            </tr>)}</tbody></table></div>}
        <footer className="table-footer"><small>Atualização automática a cada 5 segundos.</small>
          {painel?.demoEnabled && <button className="text-button" disabled={busy} onClick={() => setConfirmar(true)}>Reiniciar Ciclo do Dia (Demo)</button>}</footer>
        {confirmar && <div className="reset-confirm" role="group" aria-label="Confirmar reinício da viagem">
          <p>Apagar os embarques de hoje da van ABC-1234? Os outros dias serão preservados.</p>
          <div><button className="danger" disabled={busy} onClick={() => { void acao(reiniciarDia); }}>Confirmar reinício</button>
            <button className="secondary" disabled={busy} onClick={() => setConfirmar(false)}>Cancelar</button></div></div>}
      </section>
      <footer className="page-footer"><span>Transporte universitário · Lagoa Formosa</span><span>Ida acompanhada. Volta conferida.</span></footer>
    </main>
  </div>;
}

