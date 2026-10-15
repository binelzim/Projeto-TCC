package com.unipam.backend.domain.repository;
import com.unipam.backend.domain.entity.CicloDiario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
public interface CicloDiarioRepository extends JpaRepository<CicloDiario, Long> {
    Optional<CicloDiario> findByEstudanteIdAndDia(Long id, LocalDate dia);
    List<CicloDiario> findByVeiculoPlacaAndDiaOrderByIdaAsc(String placa, LocalDate dia);
    void deleteByVeiculoPlacaAndDia(String placa, LocalDate dia);
}

