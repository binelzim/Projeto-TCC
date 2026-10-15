package com.unipam.backend.dto;
import java.time.Instant;
import java.time.LocalDate;
public record PassageiroDTO(Long id, Long estudanteId, String nomeEstudante, String matricula,
    String placaVeiculo, LocalDate dia, Instant ida, Instant volta, String status, String metodo,
    Instant proximaLeituraEm) {}

