package com.unipam.backend.domain.service;
import com.unipam.backend.domain.entity.Usuario;
import com.unipam.backend.domain.repository.UsuarioRepository;
import com.unipam.backend.dto.LoginResponseDTO;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
@Service
public class AuthService {
    public record Sessao(String login, String role, Long estudanteId, String identificador, Instant expiresAt) {}
    private final ConcurrentHashMap<String, Sessao> sessoes = new ConcurrentHashMap<>();
    private final UsuarioRepository usuarios;
    private final Clock clock;
    private final long hours;
    public AuthService(UsuarioRepository usuarios, Clock clock, @Value("${app.session.hours}") long hours) {
        this.usuarios = usuarios; this.clock = clock; this.hours = hours;
    }
    @Transactional(readOnly = true)
    public LoginResponseDTO autenticar(String matricula, String senha) {
        if (matricula == null || matricula.isBlank()) throw invalido();
        Usuario u = usuarios.findByLogin(matricula.trim()).orElseThrow(AuthService::invalido);
        if (!Senhas.conferir(senha, u.getSenhaHash())) throw invalido();
        if (u.getEstudante() != null && !Boolean.TRUE.equals(u.getEstudante().getAtivo()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Estudante inativo. Procure a coordenação.");
        sessoes.entrySet().removeIf(e -> !e.getValue().expiresAt().isAfter(clock.instant()));
        String token = UUID.randomUUID().toString() + UUID.randomUUID();
        String identificador = u.getEstudante() == null ? null : u.getEstudante().getTokenIdentificador();
        Instant expires = clock.instant().plusSeconds(hours * 3600);
        sessoes.put(token, new Sessao(u.getLogin(), u.getRole(), u.getEstudante() == null ? null : u.getEstudante().getId(), identificador, expires));
        return new LoginResponseDTO(u.getNome(), u.getLogin(), token, u.getRole(), identificador, expires);
    }
    public Sessao exigir(String authorization, String role) {
        String token = bearer(authorization);
        Sessao sessao = sessoes.get(token);
        if (sessao == null || !sessao.expiresAt().isAfter(clock.instant())) {
            sessoes.remove(token);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sessão expirada. Entre novamente.");
        }
        if (role != null && !role.equals(sessao.role()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seu perfil não tem acesso a esta ação.");
        return sessao;
    }
    public void sair(String authorization) { sessoes.remove(bearer(authorization)); }
    private String bearer(String header) { return header != null && header.startsWith("Bearer ") ? header.substring(7) : ""; }
    private static ResponseStatusException invalido() { return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário ou senha incorretos."); }
}

