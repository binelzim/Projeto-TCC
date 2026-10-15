package com.unipam.backend.domain.service;
import com.unipam.backend.dto.LocalizacaoDTO;
import com.unipam.backend.domain.repository.VeiculoRepository;
import java.time.Clock;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RastreioService {
    private record Sinal(LocalizacaoDTO localizacao, String emissor) {}
    private final ConcurrentHashMap<String, Sinal> frota = new ConcurrentHashMap<>();
    private final VeiculoRepository veiculos;
    private final Clock clock;
    private final long ttl;
    public RastreioService(VeiculoRepository veiculos, Clock clock, @Value("${app.gps.ttl-seconds}") long ttl) {
        this.veiculos = veiculos; this.clock = clock; this.ttl = ttl;
    }
    public void atualizar(String placa, Double lat, Double lon, String emissor) {
        if (lat == null || lon == null || !Double.isFinite(lat) || !Double.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Coordenadas GPS inválidas.");
        if (veiculos.findByPlaca(placa).isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Veículo não encontrado.");
        frota.put(placa, new Sinal(new LocalizacaoDTO(placa, lat, lon, clock.instant()), emissor));
    }
    public LocalizacaoDTO obterLocalizacao(String placa) {
        Sinal sinal = frota.get(placa);
        if (sinal == null || !sinal.localizacao().ultimaAtualizacao().plusSeconds(ttl).isAfter(clock.instant()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Aguardando transmissão do motorista.");
        return sinal.localizacao();
    }
    public void parar(String placa, String emissor) {
        frota.computeIfPresent(placa, (key, atual) -> atual.emissor().equals(emissor) ? null : atual);
    }
}

