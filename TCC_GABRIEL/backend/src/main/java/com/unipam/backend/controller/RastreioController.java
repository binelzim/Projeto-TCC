package com.unipam.backend.controller;
import com.unipam.backend.domain.service.*;
import com.unipam.backend.dto.LocalizacaoDTO;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/rastreio")
public class RastreioController {
    private final RastreioService rastreio;
    private final AuthService auth;
    public RastreioController(RastreioService rastreio, AuthService auth) { this.rastreio = rastreio; this.auth = auth; }
    @PostMapping("/{placa}")
    public void atualizar(@RequestHeader(value = "Authorization", required = false) String h, @PathVariable String placa, @RequestBody LocalizacaoDTO req) {
        auth.exigir(h, "MOTORISTA"); rastreio.atualizar(placa, req.latitude(), req.longitude(), h);
    }
    @GetMapping("/{placa}")
    public LocalizacaoDTO buscar(@RequestHeader(value = "Authorization", required = false) String h, @PathVariable String placa) {
        auth.exigir(h, null); return rastreio.obterLocalizacao(placa);
    }
    @DeleteMapping("/{placa}")
    public void parar(@RequestHeader(value = "Authorization", required = false) String h, @PathVariable String placa) {
        auth.exigir(h, "MOTORISTA"); rastreio.parar(placa, h);
    }
}

