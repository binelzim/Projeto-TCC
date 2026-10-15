package com.unipam.backend.domain.entity;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Instant;
@Entity
@Table(name = "tb_ciclo_diario", uniqueConstraints = @UniqueConstraint(columnNames = {"estudante_id", "dia"}))
public class CicloDiario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) private Estudante estudante;
    @ManyToOne(optional = false) private Veiculo veiculo;
    @Column(nullable = false) private LocalDate dia;
    @Column(nullable = false) private Instant ida;
    private Instant volta;
    @Column(nullable = false) private String status;
    @Column(nullable = false) private String metodo;
    public Long getId() { return id; }
    public Estudante getEstudante() { return estudante; }
    public void setEstudante(Estudante value) { estudante = value; }
    public Veiculo getVeiculo() { return veiculo; }
    public void setVeiculo(Veiculo value) { veiculo = value; }
    public LocalDate getDia() { return dia; }
    public void setDia(LocalDate value) { dia = value; }
    public Instant getIda() { return ida; }
    public void setIda(Instant value) { ida = value; }
    public Instant getVolta() { return volta; }
    public void setVolta(Instant value) { volta = value; }
    public String getStatus() { return status; }
    public void setStatus(String value) { status = value; }
    public String getMetodo() { return metodo; }
    public void setMetodo(String value) { metodo = value; }
}

