package com.unipam.backend.domain.repository;

import com.unipam.backend.domain.entity.Veiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {
    
    // Método personalizado: O Spring entende o nome do método e cria o SQL automaticamente!
    Optional<Veiculo> findByPlaca(String placa);
    
    // Busca todos os veículos associados a uma rota específica
    List<Veiculo> findByRotaAtualId(Long rotaId);
}