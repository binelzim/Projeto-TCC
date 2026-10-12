package com.unipam.backend.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_checkin_log")
public class CheckInLog {

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Estudante getEstudante() {
        return estudante;
    }

    public void setEstudante(Estudante estudante) {
        this.estudante = estudante;
    }

    public Veiculo getVeiculo() {
        return veiculo;
    }

    public void setVeiculo(Veiculo veiculo) {
        this.veiculo = veiculo;
    }

    public LocalDateTime getTimestampValidacao() {
        return timestampValidacao;
    }

    public void setTimestampValidacao(LocalDateTime timestampValidacao) {
        this.timestampValidacao = timestampValidacao;
    }

    public MetodoValidacao getMetodo() {
        return metodo;
    }

    public void setMetodo(MetodoValidacao metodo) {
        this.metodo = metodo;
    }

    public StatusCheckIn getStatus() {
        return status;
    }

    public void setStatus(StatusCheckIn status) {
        this.status = status;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relacionamento Muitos-para-Um: Vários check-ins pertencem a um estudante
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "estudante_id", nullable = false)
    private Estudante estudante;

    // Relacionamento Muitos-para-Um: Vários check-ins ocorrem em um veículo
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "veiculo_id", nullable = false)
    private Veiculo veiculo;

    @Column(nullable = false)
    private LocalDateTime timestampValidacao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MetodoValidacao metodo; // Enum: QR_CODE, NFC

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusCheckIn status; // Enum: APROVADO, NEGADO_INATIVO, NEGADO_ROTA_INVALIDA

    @PrePersist
    protected void onCreate() {
        this.timestampValidacao = LocalDateTime.now(); // Garante o registro exato do momento do embarque
    }

    // Construtores, Getters e Setters
}