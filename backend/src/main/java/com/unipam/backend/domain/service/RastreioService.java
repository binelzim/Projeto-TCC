package com.unipam.backend.domain.service;

import com.unipam.backend.dto.LocalizacaoDTO;
import org.springframework.stereotype.Service;
import java.util.concurrent.ConcurrentHashMap; // Apenas este import do Java é necessário

@Service
public class RastreioService {

    // Guarda a localização em RAM. A chave (String) é a placa do veículo.
    private final ConcurrentHashMap<String, LocalizacaoDTO> frotaLocalizacao = new ConcurrentHashMap<>();

    // O Painel do Motorista envia as coordenadas para aqui
    public void atualizarLocalizacao(String placa, Double latitude, Double longitude) {
        LocalizacaoDTO loc = new LocalizacaoDTO(placa, latitude, longitude);
        frotaLocalizacao.put(placa, loc);
        System.out.println("📍 GPS Atualizado [" + placa + "] -> Lat: " + latitude + " | Lng: " + longitude);
    }

    // A Aplicação do Aluno pergunta onde está a van
    public LocalizacaoDTO obterLocalizacao(String placa) {
        if (!frotaLocalizacao.containsKey(placa)) {
            throw new IllegalArgumentException("Localização não disponível para o veículo: " + placa);
        }
        return frotaLocalizacao.get(placa);
    }
}