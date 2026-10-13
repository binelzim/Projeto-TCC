package com.unipam.backend.dto;

public record LoginRequestDTO(
    String matricula,
    String senha
) {}