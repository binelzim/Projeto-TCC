package com.unipam.backend.domain.repository;

import com.unipam.backend.domain.entity.CheckInLog;
import com.unipam.backend.domain.entity.Estudante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CheckInLogRepository extends JpaRepository<CheckInLog, Long> {
    
    // Histórico de check-ins de um aluno específico
    List<CheckInLog> findByEstudanteId(Long estudanteId);
    
    // Histórico de embarques em um veículo específico
    List<CheckInLog> findByVeiculoId(Long veiculoId);
    
    // Traz o histórico ordenado do mais recente para o mais antigo
    List<CheckInLog> findAllByOrderByTimestampValidacaoDesc();

    // Método corrigido para alinhar com as entidades do seu banco de dados
    boolean existsByEstudanteAndTimestampValidacaoBetween(
        Estudante estudante, 
        LocalDateTime inicio, 
        LocalDateTime fim
    );
}