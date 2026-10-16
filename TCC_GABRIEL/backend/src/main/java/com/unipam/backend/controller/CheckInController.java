package com.unipam.backend.controller;
import com.unipam.backend.domain.service.*;
import com.unipam.backend.dto.*;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/checkin")
public class CheckInController {
    private final CheckInService checkin;
    private final AuthService auth;
    private final FrotaService frota;
    public CheckInController(CheckInService checkin, AuthService auth, FrotaService frota) { this.checkin = checkin; this.auth = auth; this.frota = frota; }
    @PostMapping("/realizar")
    public PassageiroDTO realizar(@RequestHeader(value = "Authorization", required = false) String h, @RequestBody CheckInRequestDTO req) {
        var s = auth.exigir(h, "ESTUDANTE");
        if (req.getPlacaVeiculo() == null) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Informe a placa.");
        frota.placa(s, req.getPlacaVeiculo());
        return checkin.processarEmbarque(s, req);
    }
    @GetMapping("/dia")
    public PassageiroDTO dia(@RequestHeader(value = "Authorization", required = false) String h) {
        return checkin.meuDia(auth.exigir(h, "ESTUDANTE").estudanteId());
    }
    @GetMapping("/painel")
    public PainelDTO painel(@RequestHeader(value = "Authorization", required = false) String h, @RequestParam(required = false) String placa) {
        return checkin.painel(frota.placa(auth.exigir(h, "MOTORISTA"), placa));
    }
    @PostMapping("/dispensar")
    public PassageiroDTO dispensar(@RequestHeader(value = "Authorization", required = false) String h, @RequestParam(required = false) String placa) {
        var s = auth.exigir(h, "ESTUDANTE"); return checkin.dispensar(s.estudanteId(), frota.placa(s, placa));
    }
    @PostMapping("/dispensar/{estudanteId}")
    public PassageiroDTO dispensarAluno(@RequestHeader(value = "Authorization", required = false) String h,
        @PathVariable Long estudanteId, @RequestParam(required = false) String placa) {
        return checkin.dispensar(estudanteId, frota.placa(auth.exigir(h, "MOTORISTA"), placa));
    }
    @DeleteMapping("/dia")
    public void reiniciar(@RequestHeader(value = "Authorization", required = false) String h, @RequestParam(required = false) String placa) {
        checkin.reiniciar(frota.placa(auth.exigir(h, "MOTORISTA"), placa));
    }
    @GetMapping("/historico")
    public List<CheckInResponseDTO> historico(@RequestHeader(value = "Authorization", required = false) String h) {
        String placa = frota.placa(auth.exigir(h, "MOTORISTA"), null);
        return checkin.listarHistorico().stream().filter(p -> p.placaVeiculo().equals(placa)).toList();
    }
    @GetMapping("/meu-historico")
    public List<PassageiroDTO> meuHistorico(@RequestHeader(value="Authorization", required=false) String h) {
        return checkin.historicoAluno(auth.exigir(h, "ESTUDANTE").estudanteId());
    }
}
