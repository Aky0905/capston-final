package com.feelody;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ApiControllerTest {
    MockMvc mvc; FakeAI ai;
    static class FakeAuth extends AuthService {
        FakeAuth() { super("", "", new ObjectMapper()); }
        @Override public String requireUser(String token) {
            if (token == null) throw new ApiException(401, "로그인이 필요해요."); return "test-user";
        }
    }
    static class FakeAI extends OpenAiService {
        int calls = 0;
        FakeAI() throws Exception { super("", "http://localhost", "test", "test", new ObjectMapper()); }
        @Override public Map<String, Object> analyze(String text) { calls++; return Map.of("primaryEmotion", "기쁨"); }
    }
    @BeforeEach void setup() throws Exception {
        ai = new FakeAI();
        mvc = MockMvcBuilders.standaloneSetup(new ApiController(new FakeAuth(), new RequestLimiter(), ai)).setControllerAdvice(new ErrorHandler()).build();
    }
    @Test void blankAndOversizeInputsNeverCallAI() throws Exception {
        mvc.perform(post("/api/analyze").contentType("application/json").content("{\"text\":\"  \"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/analyze").contentType("application/json").content("{\"text\":\"" + "가".repeat(501) + "\"}")).andExpect(status().isBadRequest());
        assertEquals(0, ai.calls);
    }
    @Test void unauthenticatedRequestsNeverCallAI() throws Exception {
        mvc.perform(post("/api/analyze").contentType("application/json").content("{\"text\":\"오늘 행복해요\"}")).andExpect(status().isUnauthorized());
        assertEquals(0, ai.calls);
    }
    @Test void authenticatedRequestReachesAnalysis() throws Exception {
        mvc.perform(post("/api/analyze").header("Authorization", "Bearer test").contentType("application/json").content("{\"text\":\"오늘 행복해요\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.primaryEmotion").value("기쁨"));
        assertEquals(1, ai.calls);
    }
    @Test void healthDoesNotRevealSecrets() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ok"));
    }
}
