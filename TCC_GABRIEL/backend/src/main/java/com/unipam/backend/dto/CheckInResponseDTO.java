package com.unipam.backend.dto;

import java.time.LocalDateTime;

public record CheckInResponseDTO(
    Long id,
    String nomeEstudante,
    String placaVeiculo,
    String status,
    String metodo,
    LocalDateTime dataHora
) {}