package com.unipam.backend;

import com.jayway.jsonpath.JsonPath;
import com.unipam.backend.config.DataInitializer;
import com.unipam.backend.domain.repository.*;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.util.List;
import org.junit.jupiter.api.*;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:frota;DB_CLOSE_DELAY=-1", "spring.datasource.username=sa",
    "spring.datasource.password=", "app.demo.enabled=true", "app.driver.password=motorista123",
    "app.fleet.code=FROTA-UNIPAM", "app.checkin.cooldown-seconds=10"
})
class FrotaIntegrationTests {
    @LocalServerPort int port;
    @Autowired MutableClock clock;
    @Autowired CicloDiarioRepository ciclos;
    @Autowired CheckInLogRepository logs;
    @Autowired UsuarioRepository usuarios;
    @Autowired EstudanteRepository estudantes;
    @Autowired VeiculoRepository veiculos;
    @Autowired RotaRepository rotas;
    @Autowired DataInitializer initializer;
    final HttpClient client = HttpClient.newHttpClient();
    static final Instant BASE = Instant.parse("2026-10-15T21:00:00Z");
    String aluno, motorista; long veiculo;
    @BeforeEach void preparar() {
        ciclos.deleteAll(); logs.deleteAll(); usuarios.deleteAll(); estudantes.deleteAll(); veiculos.deleteAll(); rotas.deleteAll();
        clock.now = BASE; initializer.run();
        aluno = login("22009264", "demo-hash-22009264"); motorista = login("motorista", "motorista123");
        veiculo = numero(perfil(motorista), "$.linha.veiculoId");
        chamar("DELETE", "/api/rastreio/ABC-1234", motorista, null, 200);
    }
    @Test void cadastroAlunoAutenticaEVinculaSemExporSenha() {
        String res = chamar("POST", "/api/auth/cadastro", null, estudante("novo001", veiculo), 200);
        assertEquals("ESTUDANTE", campo(res, "$.role")); assertFalse(res.contains("senha-segura"));
        String token = campo(res, "$.token"); String p = perfil(token);
        assertEquals("Engenharia / 5", campo(p, "$.curso")); assertEquals("ABC-1234", campo(p, "$.linha.placa"));
        assertEquals("novo001", campo(p, "$.matricula")); assertNotNull(login("novo001", "senha-segura"));
        assertNotEquals("senha-segura", usuarios.findByLogin("novo001").orElseThrow().getSenhaHash());
        chamar("POST", "/api/auth/cadastro", null, estudante("novo001", veiculo), 409);
        assertEquals(3, estudantes.count());
    }
    @Test void cadastroRejeitaFrotaInvalidaPlacaRepetidaECamposSemGravarParcial() {
        long total = usuarios.count(), totalRotas = rotas.count();
        chamar("POST", "/api/auth/cadastro", null, motorista("driver002", "XYZ-5678", "errado", null), 403);
        chamar("POST", "/api/auth/cadastro", null, motorista("driver002", "abc1234", "FROTA-UNIPAM", null), 409);
        chamar("POST", "/api/auth/cadastro", null, estudante("curto", veiculo).replace("senha-segura", "123"), 400);
        chamar("POST", "/api/auth/cadastro", null, estudante("inexistente", 999999), 400);
        chamar("POST", "/api/auth/cadastro", null, "{\"role\":\"ADMIN\"}", 400);
        assertEquals(total, usuarios.count()); assertEquals(totalRotas, rotas.count());
    }
    @Test void duasLinhasIsolamChamadaGpsAvisosEHistorico() {
        String driver2 = cadastrarMotorista("driver002", "XYZ-5678", null);
        long v2 = numero(perfil(driver2), "$.linha.veiculoId");
        String aluno2 = campo(chamar("POST", "/api/auth/cadastro", null, estudante("linha002", v2), 200), "$.token");
        assertEquals("XYZ-5678", campo(perfil(aluno2), "$.linha.placa"));
        scan(aluno, "ABC-1234", 200); scan(aluno2, "XYZ-5678", 200);
        assertEquals(1, numero(chamar("GET", "/api/checkin/painel", driver2, null, 200), "$.foramHoje"));
        chamar("GET", "/api/checkin/painel?placa=ABC-1234", driver2, null, 403);
        chamar("DELETE", "/api/checkin/dia?placa=ABC-1234", driver2, null, 403);
        scan(aluno2, "ABC-1234", 403);
        chamar("GET", "/api/rastreio/ABC-1234", aluno2, null, 403);
        chamar("POST", "/api/rastreio/ABC-1234", driver2, "{\"latitude\":-18,\"longitude\":-46}", 403);
        chamar("POST", "/api/frota/aviso", driver2, "{\"mensagem\":\"Aviso exclusivo\"}", 200);
        assertNull(JsonPath.read(perfil(aluno), "$.linha.aviso"));
        assertEquals("Aviso exclusivo", campo(perfil(aluno2), "$.linha.aviso.mensagem"));
        String historico = chamar("GET", "/api/checkin/meu-historico", aluno2, null, 200);
        assertEquals(List.of("linha002"), JsonPath.read(historico, "$[*].matricula"));
        String roster = chamar("GET", "/api/frota/passageiros", driver2, null, 200);
        assertEquals(List.of("linha002"), JsonPath.read(roster, "$[*].matricula"));
        int idAluno2 = numero(historico, "$[0].estudanteId");
        chamar("POST", "/api/checkin/dispensar/" + idAluno2, motorista, null, 409);
        chamar("DELETE", "/api/checkin/dia", driver2, null, 200);
        assertEquals(1, numero(chamar("GET", "/api/checkin/painel", motorista, null, 200), "$.foramHoje"));
        assertEquals("[]", chamar("GET", "/api/checkin/meu-historico", aluno2, null, 200));
    }
    @Test void cadastroManualExigeMotoristaEProprioVeiculo() {
        chamar("POST", "/api/frota/passageiros", aluno, estudante("manual001", veiculo), 403);
        String driver2 = cadastrarMotorista("driver002", "XYZ-5678", null);
        long v2 = numero(perfil(driver2), "$.linha.veiculoId");
        chamar("POST", "/api/frota/passageiros", motorista, estudante("manual001", v2), 403);
        chamar("POST", "/api/frota/passageiros", motorista, estudante("manual001", veiculo), 200);
        assertEquals("ABC-1234", campo(perfil(login("manual001", "senha-segura")), "$.linha.placa"));
        assertEquals("MOTORISTA", campo(chamar("POST", "/api/auth/login", null, "{\"matricula\":\"motorista\",\"senha\":\"motorista123\"}", 200), "$.role"));
    }
    @Test void rotasMantemOrdemResetamMarcadoresERejeitamEdicaoPorAluno() {
        long rota = numero(perfil(motorista), "$.linha.id");
        String driver2 = cadastrarMotorista("driver002", "XYZ-5678", rota);
        chamar("POST", "/api/frota/parada", driver2, "{\"indice\":1}", 200);
        chamar("POST", "/api/frota/parada", motorista, "{\"indice\":2}", 200);
        String body = "{\"nome\":\"Centro Noturno\",\"paradas\":[\"Praça Central\",\"UNIPAM\"],\"suporte\":\"\"}";
        chamar("PUT", "/api/frota/rota", aluno, body, 403);
        String nova = chamar("PUT", "/api/frota/rota", motorista, body, 200);
        assertEquals(List.of("Praça Central", "UNIPAM"), JsonPath.read(nova, "$.paradas"));
        assertEquals(-1, numero(perfil(driver2), "$.linha.paradaAtual"));
        assertEquals(-1, numero(perfil(motorista), "$.linha.paradaAtual"));
        chamar("POST", "/api/frota/parada", motorista, "{\"indice\":2}", 400);
        chamar("POST", "/api/frota/parada", aluno, "{\"indice\":0}", 403);
        chamar("POST", "/api/frota/parada", motorista, "{\"indice\":1}", 200);
        assertEquals(1, numero(perfil(aluno), "$.linha.paradaAtual"));
        chamar("PUT", "/api/frota/rota", motorista, body.replace("Praça Central", "UNIPAM"), 400);
        clock.now = BASE.plusSeconds(86400); aluno = login("22009264", "demo-hash-22009264");
        assertEquals(-1, numero(perfil(aluno), "$.linha.paradaAtual"));
    }
    @Test void avisoCompartilhadoNaRotaExpiraEPodeSerRemovido() {
        long rota = numero(perfil(motorista), "$.linha.id");
        String driver2 = cadastrarMotorista("driver002", "XYZ-5678", rota);
        long v2 = numero(perfil(driver2), "$.linha.veiculoId");
        chamar("POST", "/api/auth/cadastro", null, estudante("mesmarota002", v2), 200);
        List<String> matriculas = JsonPath.read(chamar("GET", "/api/frota/passageiros", motorista, null, 200), "$[*].matricula");
        assertTrue(matriculas.containsAll(List.of("mesmarota002", "22009264", "22009265")));
        chamar("POST", "/api/frota/aviso", aluno, "{\"mensagem\":\"Não permitido\"}", 403);
        chamar("POST", "/api/frota/aviso", driver2, "{\"mensagem\":\"Atraso de dez minutos\"}", 200);
        assertEquals("Atraso de dez minutos", campo(perfil(aluno), "$.linha.aviso.mensagem"));
        assertEquals("Motorista Novo", campo(perfil(aluno), "$.linha.aviso.motorista"));
        String publico = chamar("GET", "/api/rotas", null, null, 200);
        assertFalse(publico.contains("Atraso de dez minutos"));
        chamar("POST", "/api/frota/aviso", motorista, "{\"mensagem\":\"\"}", 200);
        assertNull(JsonPath.read(perfil(aluno), "$.linha.aviso"));
        chamar("POST", "/api/frota/aviso", motorista, "{\"mensagem\":\"Novo aviso\"}", 200);
        clock.now = BASE.plusSeconds(43201); aluno = login("22009264", "demo-hash-22009264");
        assertNull(JsonPath.read(perfil(aluno), "$.linha.aviso"));
    }
    @Test void gpsValidaVelocidadePrecisaoEUsaParadaAutorizada() {
        chamar("POST", "/api/frota/parada", motorista, "{\"indice\":1}", 200);
        String gps = "{\"latitude\":-18.58,\"longitude\":-46.51,\"velocidadeKmh\":36,\"precisaoMetros\":8,\"paradaAtual\":99}";
        chamar("POST", "/api/rastreio/ABC-1234", motorista, gps, 200);
        String res = chamar("GET", "/api/rastreio/ABC-1234", aluno, null, 200);
        assertEquals(36, numero(res, "$.velocidadeKmh")); assertEquals(1, numero(res, "$.paradaAtual"));
        chamar("POST", "/api/rastreio/ABC-1234", motorista, gps.replace(":36", ":181"), 400);
        chamar("POST", "/api/rastreio/ABC-1234", motorista, gps.replace(":8", ":101"), 400);
        assertEquals(36, numero(chamar("GET", "/api/rastreio/ABC-1234", aluno, null, 200), "$.velocidadeKmh"));
    }
    String estudante(String login, long v) {
        return """
            {"role":"ESTUDANTE","nome":"Estudante Novo","matricula":"%s","curso":"Engenharia / 5","senha":"senha-segura","veiculoId":%d}
            """.formatted(login, v);
    }
    String motorista(String login, String placa, String codigo, Long rota) {
        return """
            {"role":"MOTORISTA","nome":"Motorista Novo","matricula":"%s","placa":"%s","senha":"senha-segura","codigoFrota":"%s","novaRota":"Linha Bairros / Diurno","rotaId":%s}
            """.formatted(login, placa, codigo, rota);
    }
    String cadastrarMotorista(String login, String placa, Long rota) {
        return campo(chamar("POST", "/api/auth/cadastro", null, motorista(login, placa, "FROTA-UNIPAM", rota), 200), "$.token");
    }
    String perfil(String token) { return chamar("GET", "/api/perfil", token, null, 200); }
    void scan(String token, String placa, int status) {
        chamar("POST", "/api/checkin/realizar", token, "{\"tokenIdentificador\":\"" + placa + "\",\"placaVeiculo\":\"" + placa + "\",\"metodo\":\"QR_CODE\"}", status);
    }
    String login(String user, String pass) { return campo(chamar("POST", "/api/auth/login", null, "{\"matricula\":\"" + user + "\",\"senha\":\"" + pass + "\"}", 200), "$.token"); }
    String campo(String json, String path) { return JsonPath.read(json, path); }
    int numero(String json, String path) { return ((Number) JsonPath.read(json, path)).intValue(); }
    String chamar(String method, String path, String token, String body, int status) {
        try {
            var req = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path)).header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
            if (token != null) req.header("Authorization", "Bearer " + token);
            var res = client.send(req.build(), HttpResponse.BodyHandlers.ofString());
            assertEquals(status, res.statusCode(), method + " " + path + ": " + res.body()); return res.body();
        } catch (java.io.IOException | InterruptedException e) { throw new RuntimeException(e); }
    }
    @TestConfiguration static class Config { @Bean @Primary MutableClock frotaClock() { return new MutableClock(); } }
    static class MutableClock extends Clock {
        volatile Instant now = BASE;
        public ZoneId getZone() { return ZoneId.of("America/Sao_Paulo"); }
        public Clock withZone(ZoneId zone) { return Clock.fixed(now, zone); }
        public Instant instant() { return now; }
    }
}
