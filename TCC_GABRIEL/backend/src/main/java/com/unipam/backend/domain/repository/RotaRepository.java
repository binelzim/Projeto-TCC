package com.unipam.backend.domain.repository;

import com.unipam.backend.domain.entity.Rota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RotaRepository extends JpaRepository<Rota, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select r from Rota r where r.id = :id")
    java.util.Optional<Rota> bloquear(@org.springframework.data.repository.query.Param("id") Long id);
    // O JpaRepository já traz métodos prontos como save(), findAll(), findById(), deleteById()
}
