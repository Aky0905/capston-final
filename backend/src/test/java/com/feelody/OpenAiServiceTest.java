package com.feelody;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.*;
import org.springframework.mock.web.MockMultipartFile;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.jupiter.api.Assertions.*;

class OpenAiServiceTest {
    HttpServer server; String base; ObjectMapper mapper = new ObjectMapper();
    AtomicReference<String> request = new AtomicReference<>();
    AtomicReference<String> response = new AtomicReference<>();
    AtomicReference<String> authorization = new AtomicReference<>();
    @BeforeEach void setup() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", exchange -> {
            request.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            byte[] data = response.get().getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, data.length); exchange.getResponseBody().write(data); exchange.close();
        });
        server.start(); base = "http://127.0.0.1:" + server.getAddress().getPort();
    }
    @AfterEach void teardown() { server.stop(0); }
    OpenAiService service(String key) throws Exception { return new OpenAiService(key, base, "test-model", "test-stt", mapper); }
    String completed(String emotion) throws Exception {
        var output = mapper.writeValueAsString(Map.of("primaryEmotion", emotion, "secondaryEmotions", new String[]{"평온", "평온"}, "message", "오늘도 수고했어요.", "musicMood", "차분함"));
        return mapper.writeValueAsString(Map.of("status", "completed", "output", new Object[]{Map.of("content", new Object[]{Map.of("type", "output_text", "text", output)})}));
    }
    @Test void schemaRequestAndCatalogRecommendations() throws Exception {
        response.set(completed("불안")); var result = service("test-key").analyze("오늘 걱정이 많아요");
        assertEquals("불안", result.get("primaryEmotion")); assertEquals("openai", result.get("source"));
        assertEquals("Bearer test-key", authorization.get());
        var sent = mapper.readTree(request.get()); assertFalse(sent.path("store").asBoolean());
        assertEquals("json_schema", sent.path("text").path("format").path("type").asText());
        assertTrue(result.get("tracks").toString().contains("videoId"));
        assertEquals(1, ((java.util.Set<?>) result.get("secondaryEmotions")).size());
    }
    @Test void rejectsUnknownEmotionRatherThanPersistingIt() throws Exception {
        response.set(completed("없는감정")); assertEquals(502, assertThrows(ApiException.class, () -> service("key").analyze("hi")).status);
    }
    @Test void handlesRefusal() throws Exception {
        response.set("{\"status\":\"completed\",\"output\":[{\"content\":[{\"type\":\"refusal\"}]}]}");
        assertEquals(422, assertThrows(ApiException.class, () -> service("key").analyze("test")).status);
    }
    @Test void missingKeyNeverReturnsFakeAnalysis() throws Exception {
        assertEquals(503, assertThrows(ApiException.class, () -> service("").analyze("test")).status); assertNull(request.get());
    }
    @Test void transcriptionForwardsAudioAndKoreanLanguage() throws Exception {
        response.set("{\"text\":\"오늘은 행복해요\"}");
        var file = new MockMultipartFile("file", "test.m4a", "audio/mp4", new byte[]{1,2,3});
        assertEquals("오늘은 행복해요", service("key").transcribe(file).get("text"));
        assertTrue(request.get().contains("name=\"language\"\r\n\r\nko")); assertTrue(request.get().contains("test-stt"));
    }
    @Test void rejectsUnsupportedUploadWithoutCallingUpstream() throws Exception {
        var file = new MockMultipartFile("file", "a.exe", "application/octet-stream", new byte[]{1});
        assertEquals(400, assertThrows(ApiException.class, () -> service("key").transcribe(file)).status); assertNull(request.get());
    }
}
