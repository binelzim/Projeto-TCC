package com.unipam.backend.controller;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    ResponseEntity<?> duplicado(Exception e) { return ResponseEntity.status(409).body(Map.of("message", "Usuário, matrícula ou placa já cadastrados. Confira os dados.")); }
    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<?> negocio(ResponseStatusException e) { return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason() == null ? "Requisição inválida" : e.getReason())); }
    @ExceptionHandler({IllegalArgumentException.class, HttpMessageNotReadableException.class})
    ResponseEntity<?> invalida(Exception e) { return ResponseEntity.badRequest().body(Map.of("message", "Dados inválidos. Confira os campos enviados.")); }
}
