package com.unipam.backend.dto;

import java.time.LocalDateTime;

public class LocalizacaoDTO {
    private String placa;
    private Double latitude;
    private Double longitude;
    private LocalDateTime ultimaAtualizacao;

    public LocalizacaoDTO() {}

    public LocalizacaoDTO(String placa, Double latitude, Double longitude) {
        this.placa = placa;
        this.latitude = latitude;
        this.longitude = longitude;
        this.ultimaAtualizacao = LocalDateTime.now();
    }

    public String getPlaca() { return placa; }
    public void setPlaca(String placa) { this.placa = placa; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public LocalDateTime getUltimaAtualizacao() { return ultimaAtualizacao; }
    public void setUltimaAtualizacao(LocalDateTime ultimaAtualizacao) { this.ultimaAtualizacao = ultimaAtualizacao; }
}