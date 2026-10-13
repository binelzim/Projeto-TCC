package com.unipam.backend.domain.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.unipam.backend.dto.CheckInResponseDTO;
import com.unipam.backend.domain.entity.CheckInLog;
import com.unipam.backend.domain.entity.Estudante;
import com.unipam.backend.domain.entity.Veiculo;
import com.unipam.backend.domain.entity.MetodoValidacao;
import com.unipam.backend.domain.entity.StatusCheckIn;
import com.unipam.backend.domain.repository.CheckInLogRepository;
import com.unipam.backend.domain.repository.EstudanteRepository;
import com.unipam.backend.domain.repository.VeiculoRepository;

@Service
public class CheckInService {

    private final CheckInLogRepository checkInLogRepository;
    private final EstudanteRepository estudanteRepository;
    private final VeiculoRepository veiculoRepository;

    public CheckInService(CheckInLogRepository checkInLogRepository, 
                          EstudanteRepository estudanteRepository, 
                          VeiculoRepository veiculoRepository) {
        this.checkInLogRepository = checkInLogRepository;
        this.estudanteRepository = estudanteRepository;
        this.veiculoRepository = veiculoRepository;
    }

    @Transactional
    public CheckInLog processarEmbarque(String tokenIdentificador, String placaVeiculo, String metodoStr) {
        
        CheckInLog log = new CheckInLog();
        
        // 1. Converte a String recebida da internet para o Enum Java
        try {
            log.setMetodo(MetodoValidacao.valueOf(metodoStr.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Método de validação inválido: " + metodoStr);
        }

        // 2. Busca o veículo pela placa
        Optional<Veiculo> veiculoOpt = veiculoRepository.findByPlaca(placaVeiculo);
        if (veiculoOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Veículo não encontrado com a placa: " + placaVeiculo);
        }
        Veiculo veiculo = veiculoOpt.get();
        log.setVeiculo(veiculo);

        // 3. Busca o estudante pelo token (NFC ou QR Code)
        Optional<Estudante> estudanteOpt = estudanteRepository.findByTokenIdentificador(tokenIdentificador);
        if (estudanteOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Estudante não encontrado (Token Inválido).");
        }
        Estudante estudante = estudanteOpt.get();
        log.setEstudante(estudante);

        // ==============================================================================
        // 4. REGRA DE NEGÓCIO: Bloqueio de Check-in Duplicado (Intervalo de 1 Hora)
        // ==============================================================================
        LocalDateTime umaHoraAtras = LocalDateTime.now().minusHours(1);
        LocalDateTime agora = LocalDateTime.now();

        boolean jaFezCheckin = checkInLogRepository.existsByEstudanteAndTimestampValidacaoBetween(
                estudante, 
                umaHoraAtras, 
                agora
        );

        if (jaFezCheckin) {
            // Retorna Erro 409 - Conflict. O React Native exibirá esta mensagem exata na tela.
            throw new ResponseStatusException(
                HttpStatus.CONFLICT, 
                "Acesso negado: Você já realizou um check-in recente. Aguarde para embarcar novamente."
            );
        }

        // 5. Regra de Negócio: Aprovar ou Negar e preencher o Status do CheckInLog
        if (!estudante.getAtivo()) {
            log.setStatus(StatusCheckIn.NEGADO_INATIVO);
            System.out.println("Embarque Negado: Estudante Inativo.");
            
            // Lança exceção para bloquear na interface do celular também
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso negado: Estudante inativo no sistema.");
        } else {
            log.setStatus(StatusCheckIn.APROVADO);
            System.out.println("Embarque Aprovado para: " + estudante.getNomeCompleto());
        }

        // 6. Salva no banco de dados com todos os dados preenchidos corretamente
        return checkInLogRepository.save(log);
    }

    public List<CheckInResponseDTO> listarHistorico() {
        return checkInLogRepository.findAllByOrderByTimestampValidacaoDesc()
                .stream()
                .map(log -> new CheckInResponseDTO(
                        log.getId(),
                        log.getEstudante().getNomeCompleto(),
                        log.getVeiculo().getPlaca(),
                        log.getStatus().name(),
                        log.getMetodo().name(),
                        log.getTimestampValidacao()
                ))
                .collect(Collectors.toList());
    }
}