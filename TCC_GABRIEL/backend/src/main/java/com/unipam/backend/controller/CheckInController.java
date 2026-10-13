package com.unipam.backend.controller;

import java.util.List;
import com.unipam.backend.dto.CheckInResponseDTO;
import com.unipam.backend.domain.entity.CheckInLog;
import com.unipam.backend.domain.service.CheckInService;
import com.unipam.backend.dto.CheckInRequestDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/checkin")
@CrossOrigin(origins = "*")
public class CheckInController {

    private final CheckInService checkInService;

    public CheckInController(CheckInService checkInService) {
        this.checkInService = checkInService;
    }

    @PostMapping("/realizar")
    public ResponseEntity<?> realizarCheckIn(@RequestBody CheckInRequestDTO request) {
        try {
            CheckInLog logGerado = checkInService.processarEmbarque(
                    request.getTokenIdentificador(), 
                    request.getPlacaVeiculo(), 
                    request.getMetodo()
            );
            
            System.out.println("✅ Check-in realizado com sucesso! ID: " + logGerado.getId());
            return ResponseEntity.ok("Check-in aprovado! Número do bilhete gerado: " + logGerado.getId());
            
        } catch (IllegalArgumentException e) {
            // Imprime o erro de negócio (ex: Veículo não encontrado, Estudante não cadastrado)
            System.out.println("❌ RECUSADO (Regra de Negócio): " + e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (ResponseStatusException e) {
            // Erros de negócio com status próprio (404, 403, 409) e mensagem exibida no app do aluno
            System.out.println("❌ RECUSADO (" + e.getStatusCode() + "): " + e.getReason());
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            // Imprime erros graves (ex: falha na base de dados)
            System.out.println("❌ ERRO INTERNO (Exception):");
            e.printStackTrace(); 
            return ResponseEntity.internalServerError().body("Erro interno ao processar o embarque.");
        }
    }

    @GetMapping("/historico")
    public ResponseEntity<List<CheckInResponseDTO>> obterHistorico() {
        List<CheckInResponseDTO> historico = checkInService.listarHistorico();
        return ResponseEntity.ok(historico);
    }
}