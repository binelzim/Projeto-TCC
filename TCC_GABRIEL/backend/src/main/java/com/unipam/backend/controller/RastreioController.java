package com.unipam.backend.controller;
import com.unipam.backend.domain.service.*;
import com.unipam.backend.dto.LocalizacaoDTO;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/rastreio")
public class RastreioController {
    private final RastreioService rastreio;
    private final AuthService auth;
    private final FrotaService frota;
    public RastreioController(RastreioService rastreio, AuthService auth, FrotaService frota) { this.rastreio = rastreio; this.auth = auth; this.frota = frota; }
    @PostMapping("/{placa}")
    public void atualizar(@RequestHeader(value = "Authorization", required = false) String h, @PathVariable String placa, @RequestBody LocalizacaoDTO req) {
        frota.placa(auth.exigir(h, "MOTORISTA"), placa); rastreio.atualizar(placa, req.latitude(), req.longitude(), req.velocidadeKmh(), req.precisaoMetros(), h);
    }
    @GetMapping("/{placa}")
    public LocalizacaoDTO buscar(@RequestHeader(value = "Authorization", required = false) String h, @PathVariable String placa) {
        frota.placa(auth.exigir(h, null), placa); return rastreio.obterLocalizacao(placa);
    }
    @DeleteMapping("/{placa}")
    public void parar(@RequestHeader(value = "Authorization", required = false) String h, @PathVariable String placa) {
        frota.placa(auth.exigir(h, "MOTORISTA"), placa); rastreio.parar(placa, h);
    }
}
