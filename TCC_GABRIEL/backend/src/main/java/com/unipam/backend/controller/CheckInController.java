package com.unipam.backend.controller;
import com.unipam.backend.domain.service.*;
import com.unipam.backend.dto.*;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/checkin")
public class CheckInController {
    private final CheckInService checkin;
    private final AuthService auth;
    public CheckInController(CheckInService checkin, AuthService auth) { this.checkin = checkin; this.auth = auth; }
    @PostMapping("/realizar")
    public PassageiroDTO realizar(@RequestHeader(value = "Authorization", required = false) String h, @RequestBody CheckInRequestDTO req) {
        return checkin.processarEmbarque(auth.exigir(h, "ESTUDANTE"), req);
    }
    @GetMapping("/dia")
    public PassageiroDTO dia(@RequestHeader(value = "Authorization", required = false) String h) {
        return checkin.meuDia(auth.exigir(h, "ESTUDANTE").estudanteId());
    }
    @GetMapping("/painel")
    public PainelDTO painel(@RequestHeader(value = "Authorization", required = false) String h, @RequestParam(defaultValue = "ABC-1234") String placa) {
        auth.exigir(h, "MOTORISTA"); return checkin.painel(placa);
    }
    @PostMapping("/dispensar")
    public PassageiroDTO dispensar(@RequestHeader(value = "Authorization", required = false) String h, @RequestParam(defaultValue = "ABC-1234") String placa) {
        return checkin.dispensar(auth.exigir(h, "ESTUDANTE").estudanteId(), placa);
    }
    @PostMapping("/dispensar/{estudanteId}")
    public PassageiroDTO dispensarAluno(@RequestHeader(value = "Authorization", required = false) String h,
        @PathVariable Long estudanteId, @RequestParam(defaultValue = "ABC-1234") String placa) {
        auth.exigir(h, "MOTORISTA"); return checkin.dispensar(estudanteId, placa);
    }
    @DeleteMapping("/dia")
    public void reiniciar(@RequestHeader(value = "Authorization", required = false) String h, @RequestParam(defaultValue = "ABC-1234") String placa) {
        auth.exigir(h, "MOTORISTA"); checkin.reiniciar(placa);
    }
    @GetMapping("/historico")
    public List<CheckInResponseDTO> historico(@RequestHeader(value = "Authorization", required = false) String h) {
        auth.exigir(h, "MOTORISTA"); return checkin.listarHistorico();
    }
}

