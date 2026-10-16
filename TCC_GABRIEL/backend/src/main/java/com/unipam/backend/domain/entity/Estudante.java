package com.unipam.backend.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "tb_estudante")
public class Estudante {
    @Column(length = 120)
    private String curso;
    @jakarta.persistence.ManyToOne
    private Veiculo veiculo;
    public String getCurso() { return curso; }
    public void setCurso(String value) { curso = value; }
    public Veiculo getVeiculo() { return veiculo; }
    public void setVeiculo(Veiculo value) { veiculo = value; }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNomeCompleto() {
        return nomeCompleto;
    }

    public void setNomeCompleto(String nomeCompleto) {
        this.nomeCompleto = nomeCompleto;
    }

    public String getCpfHash() {
        return cpfHash;
    }

    public void setCpfHash(String cpfHash) {
        this.cpfHash = cpfHash;
    }

    public String getMatricula() {
        return matricula;
    }

    public void setMatricula(String matricula) {
        this.matricula = matricula;
    }

    public String getTokenIdentificador() {
        return tokenIdentificador;
    }

    public void setTokenIdentificador(String tokenIdentificador) {
        this.tokenIdentificador = tokenIdentificador;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nomeCompleto;

    @Column(nullable = false, unique = true, length = 64)
    private String cpfHash; // LGPD: Armazenar apenas o hash ou dado criptografado

    @Column(nullable = false, unique = true, length = 20)
    private String matricula; // Vínculo com a instituição de ensino

    @Column(name = "token_identificador", unique = true, length = 255)
    private String tokenIdentificador; // Emulação NFC ou Token dinâmico para o QR Code

    @Column(nullable = false)
    private Boolean ativo = true;

    // Construtores, Getters e Setters
}
