import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [historico, setHistorico] = useState<any[]>([]);  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);  const [gpsStatus, setGpsStatus] = useState("A aguardar sinal de GPS...");

  const placaVeiculo = "ABC-1234"; // Placa fixa da carrinha para o MVP

  // 1. Função para carregar a lista de passageiros (Já tínhamos)
  const fetchHistorico = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/checkin/historico', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      setHistorico(response.data);
      setErro(null);
    } catch (err) {
      console.error("Erro na API:", err);
      setErro("Falha ao carregar o histórico de passageiros.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Efeito para a lista de Check-ins (Short Polling a cada 5s)
  useEffect(() => {
    fetchHistorico();
    const intervaloHistorico = setInterval(fetchHistorico, 5000);
    return () => clearInterval(intervaloHistorico);
  }, []);

  // 3. Efeito para capturar e enviar o GPS do Motorista em tempo real
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsStatus("Geolocalização não suportada neste navegador.");
      return;
    }

    // watchPosition rastreia o dispositivo continuamente
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Envia as coordenadas para o Spring Boot
        axios.post(`http://localhost:8080/api/rastreio/${placaVeiculo}`, {
          latitude: lat,
          longitude: lng
        }).then(() => {
          setGpsStatus(`GPS a transmitir: Lat ${lat.toFixed(4)} | Lng ${lng.toFixed(4)}`);
        }).catch(err => {
          console.error("Erro ao enviar GPS", err);
          setGpsStatus("Erro ao sincronizar GPS com o servidor.");
        });
      },
      (error) => {
        console.error("Erro de GPS:", error);
        setGpsStatus("Erro de GPS: Por favor, permita o acesso à localização no navegador.");
      },
      { 
        enableHighAccuracy: true, // Usa o GPS real do dispositivo (mais preciso)
        maximumAge: 0, 
        timeout: 5000 
      }
    );

    // Limpa o rastreio se o motorista fechar o painel
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Painel do Motorista - Rota Lagoa Formosa</h1>
          <p style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '5px' }}>
            Status da Localização: {gpsStatus}
          </p>
        </div>
        <div className="status-badge">
          Passageiros a bordo: <strong>{historico.length}</strong>
        </div>
      </header>

      {erro && <div className="alerta-erro">{erro}</div>}

      <main className="tabela-container">
        {loading ? (
          <p>A carregar dados...</p>
        ) : (
          <table className="tabela-checkin">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Estudante</th>
                <th>Matrícula</th>
                <th>Método</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
          {historico.length === 0 ? (
            <tr>
              <td colSpan={5} className="sem-dados">Nenhum passageiro embarcou ainda.</td>
            </tr>
          ) : (
            historico.map((log, index) => (
                  <tr key={index}>
                    <td>{new Date(log.timestampValidacao || log.dataHora).toLocaleString('pt-PT')}</td>
                    <td>{log.nomeEstudante || log.estudante?.nome_completo || 'Gabriel Costa'}</td>
                    <td>{log.matricula || '123456'}</td>
                    <td>
                      <span className={`tag-metodo ${log.metodo === 'NFC' ? 'tag-nfc' : 'tag-qr'}`}>
                        {log.metodo}
                      </span>
                    </td>
                    <td><span className="tag-sucesso">Aprovado</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

export default App;