package com.unipam.backend.domain.service;

import com.unipam.backend.domain.entity.Estudante;
import com.unipam.backend.domain.repository.EstudanteRepository;
import com.unipam.backend.dto.LoginResponseDTO;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final EstudanteRepository estudanteRepository;

    public AuthService(EstudanteRepository estudanteRepository) {
        this.estudanteRepository = estudanteRepository;
    }

    public LoginResponseDTO autenticar(String matricula, String senha) {
        // 1. Busca o estudante pela matrícula
        Optional<Estudante> estudanteOpt = estudanteRepository.findByMatricula(matricula);
        
        if (estudanteOpt.isEmpty()) {
            throw new IllegalArgumentException("Matrícula não encontrada no sistema.");
        }
        
        Estudante estudante = estudanteOpt.get();

        // 2. Valida a senha (aqui estamos comparando com o CPF cadastrado)
        // No futuro, se você criptografar senhas (BCrypt), a mudança é feita só nesta linha!
        if (!estudante.getCpfHash().equals(senha)) {
            throw new IllegalArgumentException("Senha incorreta.");
        }

        // 3. Valida se o aluno está ativo
        if (!estudante.getAtivo()) {
            throw new IllegalArgumentException("Estudante inativo. Procure a secretaria da UNIPAM.");
        }

        // 4. Se deu tudo certo, devolve o nome e o Token Secreto
        return new LoginResponseDTO(estudante.getNomeCompleto(), estudante.getTokenIdentificador());
    }
}