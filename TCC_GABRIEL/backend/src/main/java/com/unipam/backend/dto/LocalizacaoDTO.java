package com.unipam.backend.dto;
import java.time.Instant;
public record LocalizacaoDTO(String placa, Double latitude, Double longitude, Instant ultimaAtualizacao) {}

