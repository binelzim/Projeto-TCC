package com.unipam.backend.domain.repository;

import com.unipam.backend.domain.entity.Veiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select v from Veiculo v where v.placa = :placa")
    Optional<Veiculo> bloquearPorPlaca(@org.springframework.data.repository.query.Param("placa") String placa);
    
    // Método personalizado: O Spring entende o nome do método e cria o SQL automaticamente!
    Optional<Veiculo> findByPlaca(String placa);
    
    // Busca todos os veículos associados a uma rota específica
    List<Veiculo> findByRotaAtualId(Long rotaId);
}
