package com.unipam.backend.domain.entity;
import jakarta.persistence.*;
@Entity
@Table(name = "tb_usuario")
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true, length = 50) private String login;
    @Column(nullable = false) private String senhaHash;
    @Column(nullable = false) private String nome;
    @Column(nullable = false) private String role;
    @OneToOne private Estudante estudante;
    public String getLogin() { return login; }
    public void setLogin(String value) { login = value; }
    public String getSenhaHash() { return senhaHash; }
    public void setSenhaHash(String value) { senhaHash = value; }
    public String getNome() { return nome; }
    public void setNome(String value) { nome = value; }
    public String getRole() { return role; }
    public void setRole(String value) { role = value; }
    public Estudante getEstudante() { return estudante; }
    public void setEstudante(Estudante value) { estudante = value; }
}

