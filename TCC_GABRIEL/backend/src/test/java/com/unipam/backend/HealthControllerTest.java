package com.unipam.backend;

import com.unipam.backend.controller.HealthController;
import org.junit.jupiter.api.Test;
import org.springframework.boot.availability.ApplicationAvailabilityBean;
import org.springframework.boot.availability.AvailabilityChangeEvent;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class HealthControllerTest {
    private final ApplicationAvailabilityBean availability = new ApplicationAvailabilityBean();
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new HealthController(availability)).build();

    @Test void naoLiberaTrafegoAntesDeConcluirAInicializacao() throws Exception {
        mvc.perform(get("/api/health"))
            .andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.status").value("NOT_READY"));
    }

    @Test void liberaAposInicializarERecusaDuranteEncerramento() throws Exception {
        availability.onApplicationEvent(new AvailabilityChangeEvent<>(this, ReadinessState.ACCEPTING_TRAFFIC));
        mvc.perform(get("/api/health"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
        availability.onApplicationEvent(new AvailabilityChangeEvent<>(this, ReadinessState.REFUSING_TRAFFIC));
        mvc.perform(get("/api/health")).andExpect(status().isServiceUnavailable());
    }
}
