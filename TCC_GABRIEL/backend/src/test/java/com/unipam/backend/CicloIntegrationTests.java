package com.unipam.backend;

import com.jayway.jsonpath.JsonPath;
import com.unipam.backend.config.DataInitializer;
import com.unipam.backend.domain.repository.*;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.List;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:integration;DB_CLOSE_DELAY=-1", "spring.datasource.username=sa",
    "spring.datasource.password=", "app.demo.enabled=true", "app.driver.password=motorista123", "app.checkin.cooldown-seconds=10"
})
class CicloIntegrationTests {
    @LocalServerPort int port;
    @Autowired MutableClock clock;
    @Autowired CicloDiarioRepository ciclos;
    @Autowired CheckInLogRepository logs;
    @Autowired UsuarioRepository usuarios;
    @Autowired EstudanteRepository estudantes;
    @Autowired DataInitializer initializer;
    final HttpClient client = HttpClient.newHttpClient();
    static final Instant BASE = Instant.parse("2026-10-14T21:00:00Z");
    String aluno, motorista;
    @BeforeEach void preparar() {
        ciclos.deleteAll(); logs.deleteAll(); clock.now = BASE;
        estudantes.findAll().forEach(e -> { e.setAtivo(true); estudantes.save(e); });
        aluno = login("22009264", "demo-hash-22009264"); motorista = login("motorista", "motorista123");
        chamar("DELETE", "/api/rastreio/ABC-1234", motorista, null, 200);
    }
    @Test void seedESenhas() {
        long total = usuarios.count(); initializer.run(); assertEquals(total, usuarios.count());
        assertNotEquals("motorista123", usuarios.findByLogin("motorista").orElseThrow().getSenhaHash());
        chamar("POST", "/api/auth/login", null, credenciais("22009264", "errada"), 401);
        chamar("POST", "/api/auth/login", null, "{}", 401);
    }
    @Test void protegePerfilEIdentidade() {
        chamar("GET", "/api/checkin/painel", null, null, 401);
        chamar("GET", "/api/checkin/painel", aluno, null, 403);
        chamar("DELETE", "/api/checkin/dia", aluno, null, 403);
        chamar("POST", "/api/checkin/dispensar/1", aluno, null, 403);
        chamar("POST", "/api/rastreio/ABC-1234", aluno, gps(), 403);
        chamar("POST", "/api/checkin/realizar", motorista, leitura("ABC-1234"), 403);
        chamar("POST", "/api/checkin/realizar", aluno, leitura("22009265"), 403);
        chamar("POST", "/api/checkin/realizar", aluno, "{}", 400);
    }
    @Test void idaVoltaCooldownETerceiroScan() {
        assertEquals("NA_FACULDADE", campo(scan(aluno, 200), "$.status")); scan(aluno, 409);
        assertEquals(1, numero(painel(), "$.faltamChegar")); clock.now = BASE.plusSeconds(11);
        assertEquals("EMBARCADO_VOLTA", campo(scan(aluno, 200), "$.status")); scan(aluno, 409);
        assertEquals(1, numero(painel(), "$.foramHoje")); assertEquals(1, numero(painel(), "$.jaVoltaram"));
        assertEquals(0, numero(painel(), "$.faltamChegar")); assertEquals(2, logs.count());
    }
    @Test void nfcValidaIdentidadeRegistraMetodoEProtegeContraRepeticao() {
        String nfc = leitura("22009264").replace("QR_CODE", "NFC");
        chamar("POST", "/api/checkin/realizar", aluno, leitura("22009265").replace("QR_CODE", "NFC"), 403);
        String ida = chamar("POST", "/api/checkin/realizar", aluno, nfc, 200);
        assertEquals("NA_FACULDADE", campo(ida, "$.status"));
        chamar("POST", "/api/checkin/realizar", aluno, nfc, 409);
        clock.now = BASE.plusSeconds(11);
        String volta = chamar("POST", "/api/checkin/realizar", aluno, nfc, 200);
        assertEquals("EMBARCADO_VOLTA", campo(volta, "$.status"));
        assertEquals(2, logs.count());
        assertTrue(logs.findAll().stream().allMatch(log -> log.getMetodo().name().equals("NFC")));
        chamar("POST", "/api/checkin/realizar", aluno, nfc, 409);
    }
    @Test void scansConcorrentesNaoGeramVolta() throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            var a = pool.submit(() -> req("POST", "/api/checkin/realizar", aluno, leitura("ABC-1234")).statusCode());
            var b = pool.submit(() -> req("POST", "/api/checkin/realizar", aluno, leitura("ABC-1234")).statusCode());
            assertEquals(List.of(200, 409), java.util.stream.Stream.of(a.get(), b.get()).sorted().toList());
            assertEquals(1, ciclos.count()); assertEquals(0, numero(painel(), "$.jaVoltaram"));
        } finally { pool.shutdownNow(); }
    }
    @Test void dispensaPeloAlunoEMotorista() {
        scan(aluno, 200); String ana = login("22009265", "demo-hash-22009265"); String ida = scan(ana, 200);
        chamar("POST", "/api/checkin/dispensar", aluno, null, 200);
        chamar("POST", "/api/checkin/dispensar/" + numero(ida, "$.estudanteId"), motorista, null, 200);
        assertEquals(2, numero(painel(), "$.dispensados")); assertEquals(0, numero(painel(), "$.faltamChegar"));
        clock.now = BASE.plusSeconds(11); scan(aluno, 409);
    }
    @Test void naoDispensaAntesDaIdaOuDepoisDaVolta() {
        chamar("POST", "/api/checkin/dispensar", aluno, null, 409);
        scan(aluno, 200); clock.now = BASE.plusSeconds(11); scan(aluno, 200);
        chamar("POST", "/api/checkin/dispensar", aluno, null, 409);
    }
    @Test void viradaDoDiaBrasilia() {
        clock.now = Instant.parse("2026-10-15T02:59:00Z");
        assertEquals("2026-10-14", campo(scan(aluno, 200), "$.dia"));
        clock.now = Instant.parse("2026-10-15T03:01:00Z");
        assertEquals("NA_FACULDADE", campo(scan(aluno, 200), "$.status"));
        assertEquals("2026-10-15", campo(painel(), "$.dia")); assertEquals(2, ciclos.count());
    }
    @Test void resetPreservaHistorico() {
        clock.now = BASE.minusSeconds(86400); scan(aluno, 200); clock.now = BASE; scan(aluno, 200);
        chamar("DELETE", "/api/checkin/dia", motorista, null, 200);
        assertEquals(0, numero(painel(), "$.foramHoje")); assertEquals(1, ciclos.count()); assertEquals(1, logs.count()); scan(aluno, 200);
    }
    @Test void gpsExpiraValidaCoordenadasEDesliga() {
        chamar("POST", "/api/rastreio/ABC-1234", motorista, gps(), 200);
        chamar("GET", "/api/rastreio/ABC-1234", aluno, null, 200);
        chamar("POST", "/api/rastreio/ABC-1234", motorista, "{\"latitude\":100,\"longitude\":-46}", 400);
        clock.now = BASE.plusSeconds(31); chamar("GET", "/api/rastreio/ABC-1234", aluno, null, 404);
        chamar("POST", "/api/rastreio/ABC-1234", motorista, gps(), 200);
        chamar("DELETE", "/api/rastreio/ABC-1234", motorista, null, 200);
        chamar("GET", "/api/rastreio/ABC-1234", aluno, null, 404);
    }
    @Test void logoutEExpiracao() {
        chamar("POST", "/api/auth/logout", aluno, null, 200);
        chamar("GET", "/api/checkin/dia", aluno, null, 401);
        clock.now = BASE.plusSeconds(43201); chamar("GET", "/api/checkin/painel", motorista, null, 401);
    }
    @Test void alunoInativo() {
        var e = estudantes.findByMatricula("22009264").orElseThrow(); e.setAtivo(false); estudantes.save(e);
        scan(aluno, 403); chamar("POST", "/api/auth/login", null, credenciais("22009264", "demo-hash-22009264"), 403);
    }
    @Test void corsExterno() throws Exception {
        var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/checkin/realizar"))
            .header("Origin", "https://exemplo.vercel.app").header("Access-Control-Request-Method", "POST")
            .header("Access-Control-Request-Headers", "authorization,content-type").method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build();
        var res = client.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, res.statusCode()); assertEquals("*", res.headers().firstValue("Access-Control-Allow-Origin").orElse(""));
    }
    String scan(String token, int status) { return chamar("POST", "/api/checkin/realizar", token, leitura("ABC-1234"), status); }
    String painel() { return chamar("GET", "/api/checkin/painel", motorista, null, 200); }
    String login(String user, String pass) { return campo(chamar("POST", "/api/auth/login", null, credenciais(user, pass), 200), "$.token"); }
    String credenciais(String u, String p) { return "{\"matricula\":\"" + u + "\",\"senha\":\"" + p + "\"}"; }
    String leitura(String token) { return "{\"tokenIdentificador\":\"" + token + "\",\"placaVeiculo\":\"ABC-1234\",\"metodo\":\"QR_CODE\"}"; }
    String gps() { return "{\"latitude\":-18.58,\"longitude\":-46.51}"; }
    String campo(String json, String path) { return JsonPath.read(json, path); }
    int numero(String json, String path) { return ((Number) JsonPath.read(json, path)).intValue(); }
    String chamar(String method, String path, String token, String body, int status) {
        var res = req(method, path, token, body); assertEquals(status, res.statusCode(), method + " " + path + ": " + res.body()); return res.body();
    }
    HttpResponse<String> req(String method, String path, String token, String body) {
        try {
            var request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
            if (token != null) request.header("Authorization", "Bearer " + token);
            return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) { throw new RuntimeException(e); }
    }
    @TestConfiguration static class Config { @Bean @Primary MutableClock testClock() { return new MutableClock(); } }
    static class MutableClock extends Clock {
        volatile Instant now = BASE;
        public ZoneId getZone() { return ZoneId.of("America/Sao_Paulo"); }
        public Clock withZone(ZoneId zone) { return Clock.fixed(now, zone); }
        public Instant instant() { return now; }
    }
}
