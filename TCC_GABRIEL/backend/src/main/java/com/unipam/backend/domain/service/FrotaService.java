package com.unipam.backend.domain.service;

import com.unipam.backend.domain.entity.*;
import com.unipam.backend.domain.repository.*;
import com.unipam.backend.dto.FrotaDTO.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FrotaService {
    private final UsuarioRepository usuarios;
    private final EstudanteRepository estudantes;
    private final RotaRepository rotas;
    private final VeiculoRepository veiculos;
    private final Clock clock;
    private final String codigo;
    private final boolean demo;
    public FrotaService(UsuarioRepository usuarios, EstudanteRepository estudantes, RotaRepository rotas,
        VeiculoRepository veiculos, Clock clock, @Value("${app.fleet.code}") String codigo, @Value("${app.demo.enabled}") boolean demo) {
        this.usuarios = usuarios; this.estudantes = estudantes; this.rotas = rotas; this.veiculos = veiculos;
        this.clock = clock; this.codigo = codigo; this.demo = demo;
        if (!demo && (codigo.isBlank() || codigo.equals("FROTA-UNIPAM")))
            throw new IllegalStateException("Defina FLEET_REGISTRATION_CODE fora da demonstração.");
    }
    public boolean demoEnabled() { return demo; }

    @Transactional
    public void cadastrar(Cadastro req) {
        if (req == null) throw erro(400, "Informe os dados do cadastro.");
        if ("ESTUDANTE".equals(req.role())) criarAluno(req, null);
        else if ("MOTORISTA".equals(req.role())) {
            if (req.codigoFrota() == null || !MessageDigest.isEqual(codigo.getBytes(StandardCharsets.UTF_8), req.codigoFrota().getBytes(StandardCharsets.UTF_8)))
                throw erro(403, "Código de credenciamento da frota inválido.");
            String nome = texto(req.nome(), "Nome completo", 2, 150);
            String login = validarLogin(req.matricula());
            validarSenha(req.senha());
            if (usuarios.findByLogin(login).isPresent()) throw erro(409, "Usuário já cadastrado.");
            String placa = texto(req.placa(), "Placa", 7, 8).toUpperCase(Locale.ROOT);
            if (!placa.matches("[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}")) throw erro(400, "Informe uma placa válida, como ABC-1234 ou ABC1D23.");
            placa = placa.replace("-", "");
            if (placa.matches("[A-Z]{3}[0-9]{4}")) placa = placa.substring(0, 3) + "-" + placa.substring(3);
            if (veiculos.findByPlaca(placa).isPresent()) throw erro(409, "Placa já cadastrada. Procure a coordenação.");
            Rota rota;
            if (req.rotaId() != null) rota = rotas.findById(req.rotaId()).orElseThrow(() -> erro(404, "Rota não encontrada."));
            else {
                rota = new Rota(); rota.setNome(texto(req.novaRota(), "Nome da nova rota", 3, 100));
                rota.setDestino("UNIPAM"); rota.setHorarioSaida(LocalTime.of(18, 0));
                rota.setParadas(List.of("Ponto de embarque", "Portaria UNIPAM")); rotas.save(rota);
            }
            Veiculo v = new Veiculo(); v.setPlaca(placa); v.setCapacidade(15); v.setModelo("Transporte universitário");
            v.setRotaAtual(rota); veiculos.save(v);
            Usuario u = usuario(nome, login, req.senha(), "MOTORISTA"); u.setVeiculo(v); usuarios.save(u);
        } else throw erro(400, "Selecione o perfil do cadastro.");
    }

    @Transactional
    public Aluno cadastrarAluno(AuthService.Sessao s, Cadastro req) { return criarAluno(req, veiculo(s)); }

    private Aluno criarAluno(Cadastro req, Veiculo autorizado) {
        String nome = texto(req.nome(), "Nome completo", 2, 150);
        String login = validarLogin(req.matricula());
        String curso = texto(req.curso(), "Curso e período", 2, 120);
        validarSenha(req.senha());
        if (usuarios.findByLogin(login).isPresent() || estudantes.findByMatricula(login).isPresent())
            throw erro(409, "Matrícula já cadastrada.");
        Veiculo v = autorizado != null ? autorizado : veiculos.findById(Objects.requireNonNullElse(req.veiculoId(), -1L))
            .orElseThrow(() -> erro(400, "Selecione uma rota e um veículo."));
        if (autorizado != null && req.veiculoId() != null && !req.veiculoId().equals(autorizado.getId()))
            throw erro(403, "Você só pode cadastrar passageiros da sua linha.");
        Estudante e = new Estudante(); e.setNomeCompleto(nome); e.setMatricula(login); e.setCurso(curso);
        e.setTokenIdentificador(login); e.setCpfHash(UUID.randomUUID().toString()); e.setVeiculo(v);
        estudantes.save(e);
        Usuario u = usuario(nome, login, req.senha(), "ESTUDANTE"); u.setEstudante(e); usuarios.save(u);
        return aluno(e);
    }
    private Usuario usuario(String nome, String login, String senha, String role) {
        Usuario u = new Usuario(); u.setNome(nome); u.setLogin(login); u.setRole(role); u.setSenhaHash(Senhas.hash(senha)); return u;
    }

    @Transactional(readOnly = true)
    public List<Linha> listarRotas() {
        List<Linha> result = new ArrayList<>();
        for (Rota r : rotas.findAll()) {
            List<Veiculo> lista = veiculos.findByRotaAtualId(r.getId());
            if (lista.isEmpty()) result.add(linha(r, null, false));
            else for (Veiculo v : lista) result.add(linha(r, v, false));
        }
        return result;
    }
    @Transactional(readOnly = true)
    public Perfil perfil(AuthService.Sessao s) {
        Usuario u = conta(s);
        Veiculo v = veiculo(s);
        Estudante e = u.getEstudante();
        return new Perfil(u.getNome(), u.getLogin(), e == null ? null : e.getCurso(),
            e == null || Boolean.TRUE.equals(e.getAtivo()), linha(v.getRotaAtual(), v, true));
    }
    @Transactional(readOnly = true)
    public List<Aluno> passageiros(AuthService.Sessao s) {
        return estudantes.findByVeiculoRotaAtualIdOrderByNomeCompletoAsc(veiculo(s).getRotaAtual().getId()).stream().map(this::aluno).toList();
    }
    @Transactional(readOnly = true)
    public String placa(AuthService.Sessao s, String solicitada) {
        String placa = veiculo(s).getPlaca();
        if (solicitada != null && !solicitada.equals(placa)) throw erro(403, "Acesso permitido somente ao veículo da sua linha.");
        return placa;
    }
    private Usuario conta(AuthService.Sessao s) { return usuarios.findByLogin(s.login()).orElseThrow(() -> erro(401, "Entre novamente.")); }
    private Veiculo veiculo(AuthService.Sessao s) {
        Usuario u = conta(s);
        if (u.getEstudante() != null && !Boolean.TRUE.equals(u.getEstudante().getAtivo())) throw erro(403, "Passageiro inativo.");
        Veiculo v = u.getEstudante() == null ? u.getVeiculo() : u.getEstudante().getVeiculo();
        if (v == null || v.getRotaAtual() == null) throw erro(409, "Seu cadastro ainda não possui uma linha. Procure a coordenação.");
        return v;
    }
    @Transactional
    public Linha editarRota(AuthService.Sessao s, EdicaoRota req) {
        Veiculo v = veiculo(s); Rota r = rBloqueada(v);
        String nome = texto(req.nome(), "Nome da rota", 3, 100);
        if (req.paradas() == null || req.paradas().isEmpty() || req.paradas().size() > 30) throw erro(400, "Cadastre entre 1 e 30 paradas.");
        List<String> pontos = req.paradas().stream().map(p -> texto(p, "Nome da parada", 2, 100)).toList();
        if (new HashSet<>(pontos).size() != pontos.size()) throw erro(400, "Use nomes diferentes para cada parada.");
        String suporte = req.suporte() == null ? "" : req.suporte().replaceAll("[^0-9]", "");
        if (!suporte.isEmpty() && (suporte.length() < 10 || suporte.length() > 15)) throw erro(400, "Telefone de suporte inválido.");
        boolean mudou = !r.getParadas().equals(pontos);
        r.setNome(nome); r.setSuporte(suporte); r.setParadas(pontos);
        if (mudou) for (Veiculo bus : veiculos.findByRotaAtualId(r.getId())) { bus.setParadaAtual(-1); bus.setParadaAtualizadaEm(null); }
        return linha(r, v, true);
    }
    private Rota rBloqueada(Veiculo v) { return rotas.bloquear(v.getRotaAtual().getId()).orElseThrow(); }
    @Transactional
    public Linha atualizarParada(AuthService.Sessao s, Integer indice) {
        Veiculo original = veiculo(s); Rota r = rBloqueada(original);
        Veiculo v = veiculos.bloquearPorPlaca(original.getPlaca()).orElseThrow();
        if (indice == null || indice < -1 || indice >= r.getParadas().size()) throw erro(400, "Parada inválida.");
        v.setParadaAtual(indice); v.setParadaAtualizadaEm(clock.instant());
        return linha(r, v, true);
    }
    @Transactional
    public Linha avisar(AuthService.Sessao s, String mensagem) {
        Veiculo v = veiculo(s); Rota r = rBloqueada(v);
        String texto = mensagem == null ? "" : mensagem.trim();
        if (texto.length() > 500) throw erro(400, "O aviso deve ter no máximo 500 caracteres.");
        r.setAvisoMensagem(texto); r.setAvisoMotorista(conta(s).getNome()); r.setAvisoEm(clock.instant());
        return linha(r, v, true);
    }
    private Linha linha(Rota r, Veiculo v, boolean privada) {
        boolean hoje = v != null && v.getParadaAtualizadaEm() != null &&
            LocalDate.ofInstant(v.getParadaAtualizadaEm(), clock.getZone()).equals(LocalDate.now(clock));
        Aviso aviso = privada && r.getAvisoMensagem() != null && !r.getAvisoMensagem().isBlank() &&
            r.getAvisoEm() != null && r.getAvisoEm().plusSeconds(12 * 3600).isAfter(clock.instant())
            ? new Aviso(r.getAvisoMensagem(), r.getAvisoMotorista(), r.getAvisoEm()) : null;
        String motorista = v == null ? null : usuarios.findByVeiculoId(v.getId()).map(Usuario::getNome).orElse("A definir");
        return new Linha(r.getId(), r.getNome(), r.getDestino(), v == null ? null : v.getId(),
            v == null ? null : v.getPlaca(), motorista, List.copyOf(r.getParadas()),
            privada && hoje && v.getParadaAtual() != null ? v.getParadaAtual() : -1,
            privada && hoje ? v.getParadaAtualizadaEm() : null, aviso, privada ? r.getSuporte() : null);
    }
    private Aluno aluno(Estudante e) { return new Aluno(e.getId(), e.getNomeCompleto(), e.getMatricula(), e.getCurso(), Boolean.TRUE.equals(e.getAtivo()), e.getVeiculo().getPlaca()); }
    private String validarLogin(String value) {
        String login = texto(value, "Matrícula / usuário", 3, 20);
        if (!login.matches("[A-Za-z0-9._-]+")) throw erro(400, "Use letras, números, ponto, hífen ou sublinhado no usuário.");
        return login;
    }
    private void validarSenha(String senha) { if (senha == null || senha.length() < 8 || senha.length() > 128) throw erro(400, "A senha deve ter entre 8 e 128 caracteres."); }
    private String texto(String value, String label, int min, int max) {
        if (value == null || value.trim().length() < min || value.trim().length() > max) throw erro(400, label + ": informe de " + min + " a " + max + " caracteres.");
        return value.trim();
    }
    private ResponseStatusException erro(int status, String message) { return new ResponseStatusException(HttpStatus.valueOf(status), message); }
}
