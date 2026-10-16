package com.unipam.backend.dto;
import java.time.Instant;
import java.util.List;
public final class FrotaDTO {
    private FrotaDTO() {}
    public record Cadastro(String role, String nome, String matricula, String curso, String senha,
        Long veiculoId, String placa, Long rotaId, String novaRota, String codigoFrota) {}
    public record Aviso(String mensagem, String motorista, Instant criadoEm) {}
    public record Linha(Long id, String nome, String destino, Long veiculoId, String placa, String motorista,
        List<String> paradas, int paradaAtual, Instant paradaAtualizadaEm, Aviso aviso, String suporte) {}
    public record Perfil(String nome, String matricula, String curso, boolean ativo, Linha linha) {}
    public record Aluno(Long id, String nome, String matricula, String curso, boolean ativo, String placaVeiculo) {}
    public record EdicaoRota(String nome, List<String> paradas, String suporte) {}
    public record Parada(Integer indice) {}
    public record Mensagem(String mensagem) {}
}
