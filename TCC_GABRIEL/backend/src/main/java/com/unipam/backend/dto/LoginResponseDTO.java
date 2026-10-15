package com.unipam.backend.dto;
import java.time.Instant;
public record LoginResponseDTO(String nome, String matricula, String token, String role,
    String tokenIdentificador, Instant expiresAt) {}

