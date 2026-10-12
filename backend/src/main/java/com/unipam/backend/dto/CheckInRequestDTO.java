package com.unipam.backend.dto;

public class CheckInRequestDTO {
    
    private String tokenIdentificador;
    private String placaVeiculo;
    private String metodo; // "QR_CODE" ou "NFC"

    // Getters e Setters
    public String getTokenIdentificador() { return tokenIdentificador; }
    public void setTokenIdentificador(String tokenIdentificador) { this.tokenIdentificador = tokenIdentificador; }
    
    public String getPlacaVeiculo() { return placaVeiculo; }
    public void setPlacaVeiculo(String placaVeiculo) { this.placaVeiculo = placaVeiculo; }
    
    public String getMetodo() { return metodo; }
    public void setMetodo(String metodo) { this.metodo = metodo; }
}