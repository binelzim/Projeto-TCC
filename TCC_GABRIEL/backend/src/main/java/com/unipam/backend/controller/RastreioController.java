package com.unipam.backend.controller;

import com.unipam.backend.dto.LocalizacaoDTO;
import com.unipam.backend.domain.service.RastreioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rastreio")
@CrossOrigin(origins = "*") // Permite o acesso do navegador (React) e do Mobile
public class RastreioController {

    private final RastreioService rastreioService;

    public RastreioController(RastreioService rastreioService) {
        this.rastreioService = rastreioService;
    }

    // Endpoint para o Painel Web ATUALIZAR o GPS (A cada 5 segundos)
    @PostMapping("/{placa}")
    public ResponseEntity<?> atualizarGPS(@PathVariable String placa, @RequestBody LocalizacaoDTO request) {
        try {
            rastreioService.atualizarLocalizacao(placa, request.getLatitude(), request.getLongitude());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro ao processar GPS");
        }
    }

    // Endpoint para a Aplicação do Aluno BUSCAR o GPS (A cada 5 segundos)
    @GetMapping("/{placa}")
    public ResponseEntity<?> buscarGPS(@PathVariable String placa) {
        try {
            LocalizacaoDTO loc = rastreioService.obterLocalizacao(placa);
            return ResponseEntity.ok(loc);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build(); // Retorna 404 se a van ainda não estiver online
        }
    }
}