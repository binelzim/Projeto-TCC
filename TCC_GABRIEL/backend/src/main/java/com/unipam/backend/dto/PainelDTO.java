package com.unipam.backend.dto;
import java.time.LocalDate;
import java.util.List;
public record PainelDTO(LocalDate dia, String placa, int foramHoje, long jaVoltaram,
    long faltamChegar, long dispensados, boolean demoEnabled, List<PassageiroDTO> passageiros) {}

