package com.unipam.backend.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "tb_veiculo")
public class Veiculo {
    private Integer paradaAtual = -1;
    private java.time.Instant paradaAtualizadaEm;
    public Integer getParadaAtual() { return paradaAtual; }
    public void setParadaAtual(Integer value) { paradaAtual = value; }
    public java.time.Instant getParadaAtualizadaEm() { return paradaAtualizadaEm; }
    public void setParadaAtualizadaEm(java.time.Instant value) { paradaAtualizadaEm = value; }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 8)
    private String placa;

    @Column(nullable = false)
    private Integer capacidade; // Quantidade de assentos

    @Column(length = 50)
    private String modelo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rota_id")
    private Rota rotaAtual; // Um veículo é alocado para uma rota específica

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPlaca() {
        return placa;
    }

    public void setPlaca(String placa) {
        this.placa = placa;
    }

    public Integer getCapacidade() {
        return capacidade;
    }

    public void setCapacidade(Integer capacidade) {
        this.capacidade = capacidade;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public Rota getRotaAtual() {
        return rotaAtual;
    }

    public void setRotaAtual(Rota rotaAtual) {
        this.rotaAtual = rotaAtual;
    }

    // Construtores, Getters e Setters
}
