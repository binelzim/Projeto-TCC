package com.unipam.backend.domain.service;
import com.unipam.backend.domain.entity.*;
import com.unipam.backend.domain.repository.*;
import com.unipam.backend.dto.*;
import java.time.*;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CheckInService {
    private final CicloDiarioRepository ciclos;
    private final EstudanteRepository estudantes;
    private final VeiculoRepository veiculos;
    private final CheckInLogRepository logs;
    private final Clock clock;
    private final long cooldown;
    private final boolean demo;
    public CheckInService(CicloDiarioRepository ciclos, EstudanteRepository estudantes,
        VeiculoRepository veiculos, CheckInLogRepository logs, Clock clock,
        @Value("${app.checkin.cooldown-seconds}") long cooldown, @Value("${app.demo.enabled}") boolean demo) {
        this.ciclos = ciclos; this.estudantes = estudantes; this.veiculos = veiculos; this.logs = logs;
        this.clock = clock; this.cooldown = Math.max(3, cooldown); this.demo = demo;
    }

    @Transactional
    public PassageiroDTO processarEmbarque(AuthService.Sessao sessao, CheckInRequestDTO request) {
        Veiculo veiculo = bloquear(request.getPlacaVeiculo());
        if (!veiculo.getPlaca().equals(request.getTokenIdentificador()) &&
            !sessao.identificador().equals(request.getTokenIdentificador()))
            throw erro(HttpStatus.FORBIDDEN, "QR Code inválido para este veículo ou estudante.");
        MetodoValidacao metodo;
        try { metodo = MetodoValidacao.valueOf(request.getMetodo() == null ? "" : request.getMetodo()); }
        catch (IllegalArgumentException e) { throw erro(HttpStatus.BAD_REQUEST, "Método de leitura inválido."); }
        Estudante estudante = estudantes.findById(sessao.estudanteId()).orElseThrow(() -> erro(HttpStatus.NOT_FOUND, "Estudante não encontrado."));
        if (!Boolean.TRUE.equals(estudante.getAtivo())) throw erro(HttpStatus.FORBIDDEN, "Estudante inativo.");
        LocalDate hoje = LocalDate.now(clock);
        Instant agora = clock.instant();
        CicloDiario ciclo = ciclos.findByEstudanteIdAndDia(estudante.getId(), hoje).orElse(null);
        StatusCheckIn evento;
        if (ciclo == null) {
            ciclo = new CicloDiario(); ciclo.setEstudante(estudante); ciclo.setVeiculo(veiculo);
            ciclo.setDia(hoje); ciclo.setIda(agora); ciclo.setStatus("NA_FACULDADE");
            ciclo.setMetodo(metodo.name()); evento = StatusCheckIn.IDA;
        } else {
            if (!ciclo.getVeiculo().getPlaca().equals(veiculo.getPlaca()))
                throw erro(HttpStatus.CONFLICT, "Você já iniciou a viagem em outro veículo.");
            if (!"NA_FACULDADE".equals(ciclo.getStatus()))
                throw erro(HttpStatus.CONFLICT, "Seu ciclo de hoje já foi concluído ou dispensado.");
            if (agora.isBefore(ciclo.getIda().plusSeconds(cooldown))) {
                long faltam = Math.max(1, Duration.between(agora, ciclo.getIda().plusSeconds(cooldown)).toSeconds() + 1);
                throw erro(HttpStatus.CONFLICT, "Ida já registrada. Aguarde " + faltam + " segundos para registrar a volta.");
            }
            ciclo.setVolta(agora); ciclo.setStatus("EMBARCADO_VOLTA"); evento = StatusCheckIn.VOLTA;
        }
        ciclos.save(ciclo);
        CheckInLog log = new CheckInLog(); log.setEstudante(estudante); log.setVeiculo(veiculo);
        log.setMetodo(metodo); log.setStatus(evento); log.setTimestampValidacao(LocalDateTime.now(clock));
        logs.save(log);
        return dto(ciclo);
    }

    @Transactional(readOnly = true)
    public PassageiroDTO meuDia(Long estudanteId) {
        return ciclos.findByEstudanteIdAndDia(estudanteId, LocalDate.now(clock)).map(this::dto).orElse(null);
    }

    @Transactional(readOnly = true)
    public PainelDTO painel(String placa) {
        if (veiculos.findByPlaca(placa).isEmpty()) throw erro(HttpStatus.NOT_FOUND, "Veículo não encontrado.");
        List<PassageiroDTO> lista = ciclos.findByVeiculoPlacaAndDiaOrderByIdaAsc(placa, LocalDate.now(clock)).stream().map(this::dto).toList();
        return new PainelDTO(LocalDate.now(clock), placa, lista.size(),
            lista.stream().filter(p -> p.status().equals("EMBARCADO_VOLTA")).count(),
            lista.stream().filter(p -> p.status().equals("NA_FACULDADE")).count(),
            lista.stream().filter(p -> p.status().equals("VOLTA_DISPENSADA")).count(), demo, lista);
    }

    @Transactional
    public PassageiroDTO dispensar(Long estudanteId, String placa) {
        bloquear(placa);
        CicloDiario ciclo = ciclos.findByEstudanteIdAndDia(estudanteId, LocalDate.now(clock))
            .orElseThrow(() -> erro(HttpStatus.CONFLICT, "Nenhuma ida registrada hoje."));
        if (!ciclo.getVeiculo().getPlaca().equals(placa)) throw erro(HttpStatus.CONFLICT, "Viagem de outro veículo.");
        if ("EMBARCADO_VOLTA".equals(ciclo.getStatus())) throw erro(HttpStatus.CONFLICT, "Volta já registrada.");
        ciclo.setStatus("VOLTA_DISPENSADA");
        return dto(ciclos.save(ciclo));
    }

    @Transactional
    public void reiniciar(String placa) {
        if (!demo) throw erro(HttpStatus.FORBIDDEN, "Reinício disponível apenas no modo demonstração.");
        bloquear(placa);
        LocalDate hoje = LocalDate.now(clock);
        ciclos.deleteByVeiculoPlacaAndDia(placa, hoje);
        logs.deleteByVeiculoPlacaAndTimestampValidacaoGreaterThanEqualAndTimestampValidacaoLessThan(placa, hoje.atStartOfDay(), hoje.plusDays(1).atStartOfDay());
    }

    @Transactional(readOnly = true)
    public List<CheckInResponseDTO> listarHistorico() {
        return logs.findAllByOrderByTimestampValidacaoDesc().stream().map(l ->
            new CheckInResponseDTO(l.getId(), l.getEstudante().getNomeCompleto(), l.getVeiculo().getPlaca(),
                l.getStatus().name(), l.getMetodo().name(), l.getTimestampValidacao())).toList();
    }

    private Veiculo bloquear(String placa) {
        if (placa == null || placa.isBlank()) throw erro(HttpStatus.BAD_REQUEST, "Informe a placa.");
        return veiculos.bloquearPorPlaca(placa).orElseThrow(() -> erro(HttpStatus.NOT_FOUND, "Veículo não encontrado."));
    }
    private PassageiroDTO dto(CicloDiario c) {
        return new PassageiroDTO(c.getId(), c.getEstudante().getId(), c.getEstudante().getNomeCompleto(),
            c.getEstudante().getMatricula(), c.getVeiculo().getPlaca(), c.getDia(), c.getIda(),
            c.getVolta(), c.getStatus(), c.getMetodo(), c.getIda().plusSeconds(cooldown));
    }
    private ResponseStatusException erro(HttpStatus status, String message) { return new ResponseStatusException(status, message); }
}

