package com.unipam.backend.controller;
import com.unipam.backend.dto.*;
import com.unipam.backend.dto.FrotaDTO.*;
import com.unipam.backend.domain.service.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api")
public class FrotaController {
    private final FrotaService frota; private final AuthService auth;
    public FrotaController(FrotaService frota, AuthService auth) { this.frota = frota; this.auth = auth; }
    @GetMapping("/config") public Map<String, Boolean> config() { return Map.of("demoEnabled", frota.demoEnabled()); }
    @GetMapping("/rotas") public List<Linha> rotas() { return frota.listarRotas(); }
    @PostMapping("/auth/cadastro") public LoginResponseDTO cadastro(@RequestBody Cadastro req) {
        frota.cadastrar(req); return auth.autenticar(req.matricula().trim(), req.senha());
    }
    @GetMapping("/perfil") public Perfil perfil(@RequestHeader(value="Authorization", required=false) String h) { return frota.perfil(auth.exigir(h, null)); }
    @GetMapping("/frota/passageiros") public List<Aluno> passageiros(@RequestHeader(value="Authorization", required=false) String h) { return frota.passageiros(auth.exigir(h, "MOTORISTA")); }
    @PostMapping("/frota/passageiros") public Aluno cadastrar(@RequestHeader(value="Authorization", required=false) String h, @RequestBody Cadastro req) { return frota.cadastrarAluno(auth.exigir(h, "MOTORISTA"), req); }
    @PutMapping("/frota/rota") public Linha rota(@RequestHeader(value="Authorization", required=false) String h, @RequestBody EdicaoRota req) { return frota.editarRota(auth.exigir(h, "MOTORISTA"), req); }
    @PostMapping("/frota/parada") public Linha parada(@RequestHeader(value="Authorization", required=false) String h, @RequestBody Parada req) { return frota.atualizarParada(auth.exigir(h, "MOTORISTA"), req.indice()); }
    @PostMapping("/frota/aviso") public Linha aviso(@RequestHeader(value="Authorization", required=false) String h, @RequestBody Mensagem req) { return frota.avisar(auth.exigir(h, "MOTORISTA"), req.mensagem()); }
}
