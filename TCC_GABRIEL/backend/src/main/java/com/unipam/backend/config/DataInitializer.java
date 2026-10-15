package com.unipam.backend.config;
import com.unipam.backend.domain.entity.*;
import com.unipam.backend.domain.repository.*;
import com.unipam.backend.domain.service.Senhas;
import java.time.LocalTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
@Component
public class DataInitializer implements CommandLineRunner {
    private final RotaRepository rotas;
    private final VeiculoRepository veiculos;
    private final EstudanteRepository estudantes;
    private final UsuarioRepository usuarios;
    private final String driverPassword;
    private final boolean demo;
    public DataInitializer(RotaRepository rotas, VeiculoRepository veiculos, EstudanteRepository estudantes,
        UsuarioRepository usuarios, @Value("${app.driver.password}") String password, @Value("${app.demo.enabled}") boolean demo) {
        this.rotas = rotas; this.veiculos = veiculos; this.estudantes = estudantes; this.usuarios = usuarios;
        this.driverPassword = password; this.demo = demo;
    }
    @Override @Transactional
    public void run(String... args) {
        if (!demo && "motorista123".equals(driverPassword))
            throw new IllegalStateException("Defina DRIVER_PASSWORD ao desativar o modo demo.");
        if (veiculos.findByPlaca("ABC-1234").isEmpty()) {
            Rota rota = rotas.findAll().stream().filter(r -> "UNIPAM".equals(r.getDestino())).findFirst().orElseGet(() -> {
                Rota r = new Rota(); r.setNome("Lagoa Formosa - Patos de Minas (Noturno)");
                r.setDestino("UNIPAM"); r.setHorarioSaida(LocalTime.of(18, 0)); return rotas.save(r);
            });
            Veiculo v = new Veiculo(); v.setPlaca("ABC-1234"); v.setCapacidade(15); v.setModelo("Sprinter");
            v.setRotaAtual(rota); veiculos.save(v);
        }
        if (demo) {
            seedEstudante("22009264", "Gabriel Costa");
            seedEstudante("22009265", "Ana Souza");
        }
        for (Estudante e : estudantes.findAll()) {
            seedUsuario(e.getMatricula(), e.getNomeCompleto(), e.getCpfHash(), "ESTUDANTE", e);
        }
        seedUsuario("motorista", "Motorista da rota", driverPassword, "MOTORISTA", null);
    }
    private void seedEstudante(String matricula, String nome) {
        if (estudantes.findByMatricula(matricula).isPresent()) return;
        Estudante e = new Estudante(); e.setMatricula(matricula); e.setNomeCompleto(nome);
        e.setCpfHash("demo-hash-" + matricula); e.setTokenIdentificador(matricula); estudantes.save(e);
    }
    private void seedUsuario(String login, String nome, String senha, String role, Estudante estudante) {
        if (usuarios.findByLogin(login).isPresent()) return;
        Usuario u = new Usuario(); u.setLogin(login); u.setNome(nome); u.setSenhaHash(Senhas.hash(senha));
        u.setRole(role); u.setEstudante(estudante); usuarios.save(u);
    }
}

