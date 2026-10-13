import { useEffect, useState } from 'react';
import { buscarHistorico, enviarLocalizacao, type CheckInRegistro } from './api';
import './App.css';

const PLACA_VEICULO = 'ABC-1234'; // Placa fixa da van para o MVP
const INTERVALO_POLLING_MS = 5000;
const ITENS_POR_PAGINA = 10;

type GpsEstado = 'aguardando' | 'ativo' | 'erro';

interface GpsStatus {
  estado: GpsEstado;
  mensagem: string;
}

const GPS_INICIAL: GpsStatus =
  'geolocation' in navigator
    ? { estado: 'aguardando', mensagem: 'Aguardando sinal de GPS...' }
    : { estado: 'erro', mensagem: 'Geolocalização não suportada neste navegador.' };

const ROTULO_GPS: Record<GpsEstado, string> = {
  aguardando: 'Conectando ao GPS',
  ativo: 'Conexão GPS ativa',
  erro: 'GPS desconectado',
};

function formatarDataHora(iso: string): string {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? '—' : data.toLocaleString('pt-BR');
}

function IconeVan() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
      <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-6H6V6h12v5z" />
    </svg>
  );
}

function IconeBilhete() {
  return (
    <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor">
      <path d="M22 10V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v4a2 2 0 1 1 0 4v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a2 2 0 1 1 0-4zm-9 7.5h-2v-2h2v2zm0-4.5h-2v-2h2v2zm0-4.5h-2v-2h2v2z" />
    </svg>
  );
}

function App() {
  const [historico, setHistorico] = useState<CheckInRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [gps, setGps] = useState<GpsStatus>(GPS_INICIAL);
  const [agora, setAgora] = useState(() => new Date());
  const [pagina, setPagina] = useState(1);

  // Relógio digital do cabeçalho
  useEffect(() => {
    const relogio = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(relogio);
  }, []);

  // Lista de check-ins (short polling a cada 5s)
  useEffect(() => {
    const carregarHistorico = () => {
      buscarHistorico()
        .then((dados) => {
          setHistorico(dados);
          setErro(null);
        })
        .catch(() => setErro('Falha ao carregar o histórico de passageiros. Tentando novamente...'))
        .finally(() => setLoading(false));
    };

    carregarHistorico();
    const intervaloHistorico = setInterval(carregarHistorico, INTERVALO_POLLING_MS);
    return () => clearInterval(intervaloHistorico);
  }, []);

  // Captura e envia o GPS do motorista em tempo real
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        enviarLocalizacao(PLACA_VEICULO, latitude, longitude)
          .then(() =>
            setGps({
              estado: 'ativo',
              mensagem: `Transmitindo: Lat ${latitude.toFixed(4)} | Lng ${longitude.toFixed(4)}`,
            })
          )
          .catch(() => setGps({ estado: 'erro', mensagem: 'Erro ao sincronizar o GPS com o servidor.' }));
      },
      () => {
        setGps({ estado: 'erro', mensagem: 'Permita o acesso à localização no navegador.' });
      },
      {
        enableHighAccuracy: true, // Usa o GPS real do dispositivo (mais preciso)
        maximumAge: 0,
        timeout: 5000,
      }
    );

    // Limpa o rastreio se o motorista fechar o painel
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const totalPaginas = Math.max(1, Math.ceil(historico.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const registrosDaPagina = historico.slice(inicio, inicio + ITENS_POR_PAGINA);

  return (
    <div className="dashboard">
      <a className="pular-conteudo" href="#conteudo">Pular para a lista de passageiros</a>

      <header className="cabecalho">
        <div className="cabecalho-titulo">
          <span className="cabecalho-icone" aria-hidden="true"><IconeVan /></span>
          <div>
            <h1>Painel do Motorista</h1>
            <p className="cabecalho-rota">Rota Lagoa Formosa · Van {PLACA_VEICULO}</p>
          </div>
        </div>

        <time className="relogio" dateTime={agora.toISOString()} aria-label="Hora atual">
          {agora.toLocaleTimeString('pt-BR')}
        </time>
      </header>

      <section className="resumo" aria-label="Resumo da viagem">
        <div className={`cartao-status gps-${gps.estado}`} role="status" aria-live="polite">
          <span className="indicador" aria-hidden="true" />
          <div>
            <p className="cartao-rotulo">{ROTULO_GPS[gps.estado]}</p>
            <p className="cartao-detalhe">{gps.mensagem}</p>
          </div>
        </div>

        <div className="cartao-status cartao-passageiros">
          <p className="cartao-rotulo">Passageiros a bordo</p>
          <p className="contador" aria-live="polite">{historico.length}</p>
        </div>
      </section>

      <div aria-live="polite">
        {erro && (
          <div className="alerta-erro" role="alert">
            {erro}
          </div>
        )}
      </div>

      <main id="conteudo" className="tabela-card" tabIndex={-1}>
        <div className="tabela-cabecalho">
          <h2>Histórico de embarques</h2>
          {historico.length > 0 && (
            <span className="tabela-contagem">
              {historico.length} {historico.length === 1 ? 'registro' : 'registros'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="estado-vazio" role="status">
            <span className="spinner" aria-hidden="true" />
            <p>Carregando dados...</p>
          </div>
        ) : historico.length === 0 ? (
          <div className="estado-vazio">
            <span className="estado-vazio-icone" aria-hidden="true"><IconeBilhete /></span>
            <p className="estado-vazio-titulo">Nenhum passageiro embarcou ainda</p>
            <p>Os check-ins por QR Code ou NFC aparecerão aqui automaticamente.</p>
          </div>
        ) : (
          <>
            <div className="tabela-rolagem">
              <table className="tabela-checkin">
                <caption className="sr-only">
                  Lista de estudantes que realizaram check-in, do mais recente para o mais antigo
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Data/Hora</th>
                    <th scope="col">Estudante</th>
                    <th scope="col">Veículo</th>
                    <th scope="col">Método</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosDaPagina.map((log) => (
                    <tr key={log.id}>
                      <td>{formatarDataHora(log.dataHora)}</td>
                      <th scope="row" className="celula-nome">{log.nomeEstudante}</th>
                      <td>{log.placaVeiculo}</td>
                      <td>
                        <span className={`tag ${log.metodo === 'NFC' ? 'tag-nfc' : 'tag-qr'}`}>
                          {log.metodo === 'NFC' ? 'NFC' : 'QR Code'}
                        </span>
                      </td>
                      <td>
                        <span className={`tag ${log.status === 'APROVADO' ? 'tag-sucesso' : 'tag-negado'}`}>
                          {log.status === 'APROVADO' ? 'Aprovado' : 'Negado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPaginas > 1 && (
              <nav className="paginacao" aria-label="Paginação do histórico">
                <button
                  type="button"
                  onClick={() => setPagina(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                  aria-label="Página anterior">
                  ← Anterior
                </button>
                <span aria-live="polite">
                  Página {paginaAtual} de {totalPaginas}
                </span>
                <button
                  type="button"
                  onClick={() => setPagina(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                  aria-label="Próxima página">
                  Próxima →
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
