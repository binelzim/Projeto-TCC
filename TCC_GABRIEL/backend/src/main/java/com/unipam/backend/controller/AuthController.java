package com.unipam.backend.controller;
import com.unipam.backend.domain.service.AuthService;
import com.unipam.backend.dto.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth) { this.auth = auth; }
    @PostMapping("/login")
    public LoginResponseDTO login(@RequestBody LoginRequestDTO request) { return auth.autenticar(request.matricula(), request.senha()); }
    @PostMapping("/logout")
    public void logout(@RequestHeader(value = "Authorization", required = false) String header) { auth.sair(header); }
}

