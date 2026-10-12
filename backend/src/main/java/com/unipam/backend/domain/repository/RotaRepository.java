package com.unipam.backend.domain.repository;

import com.unipam.backend.domain.entity.Rota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RotaRepository extends JpaRepository<Rota, Long> {
    // O JpaRepository já traz métodos prontos como save(), findAll(), findById(), deleteById()
}