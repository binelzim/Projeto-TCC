package com.unipam.backend.domain.repository;

import com.unipam.backend.domain.entity.Estudante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EstudanteRepository extends JpaRepository<Estudante, Long> {
    
    Optional<Estudante> findByMatricula(String matricula);
    
    Optional<Estudante> findByTokenIdentificador(String tokenIdentificador);

}