package com.unipam.backend.domain.entity;

import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tb_rota")
public class Rota {
    @jakarta.persistence.ElementCollection
    @jakarta.persistence.OrderColumn(name = "ordem")
    @Column(length = 100)
    private java.util.List<String> paradas = new java.util.ArrayList<>();
    @Column(length = 500) private String avisoMensagem;
    private String avisoMotorista;
    private java.time.Instant avisoEm;
    @Column(length = 20) private String suporte;
    public java.util.List<String> getParadas() { return paradas; }
    public void setParadas(java.util.List<String> value) { paradas.clear(); paradas.addAll(value); }
    public String getAvisoMensagem() { return avisoMensagem; }
    public void setAvisoMensagem(String value) { avisoMensagem = value; }
    public String getAvisoMotorista() { return avisoMotorista; }
    public void setAvisoMotorista(String value) { avisoMotorista = value; }
    public java.time.Instant getAvisoEm() { return avisoEm; }
    public void setAvisoEm(java.time.Instant value) { avisoEm = value; }
    public String getSuporte() { return suporte; }
    public void setSuporte(String value) { suporte = value; }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getDestino() {
        return destino;
    }

    public void setDestino(String destino) {
        this.destino = destino;
    }

    public LocalTime getHorarioSaida() {
        return horarioSaida;
    }

    public void setHorarioSaida(LocalTime horarioSaida) {
        this.horarioSaida = horarioSaida;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome; // Ex: "Lagoa Formosa - Patos de Minas (Noturno)"

    @Column(nullable = false, length = 100)
    private String destino; // Ex: "UNIPAM"

    @Column(name = "horario_saida", nullable = false)
    private LocalTime horarioSaida;

    // Construtores, Getters e Setters omitidos para brevidade (recomenda-se o uso do Lombok @Data)
}
