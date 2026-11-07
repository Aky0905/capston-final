package com.feelody;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final AuthService auth; private final RequestLimiter limiter; private final OpenAiService ai;
    public ApiController(AuthService auth, RequestLimiter limiter, OpenAiService ai) { this.auth = auth; this.limiter = limiter; this.ai = ai; }
    public record AnalyzeRequest(@NotBlank @Size(max = 500) String text) {}
    @GetMapping("/health") public Map<String, String> health() { return Map.of("status", "ok", "service", "feelody-api"); }
    @PostMapping("/analyze") public Map<String, Object> analyze(@RequestHeader(value="Authorization", required=false) String token, @Valid @RequestBody AnalyzeRequest request) {
        limiter.check(auth.requireUser(token)); return ai.analyze(request.text().trim());
    }
    public record RecommendationRequest(@NotBlank @Size(max = 20) String mood, @NotBlank @Size(max = 100) String atmosphere,
                                        @jakarta.validation.constraints.NotNull @Size(max = 100) java.util.List<@NotBlank @Size(max = 400) String> excluded) {}
    @PostMapping("/recommendations")
    public java.util.List<Map<String, Object>> recommendations(@RequestHeader(value="Authorization", required=false) String token,
                                                               @Valid @RequestBody RecommendationRequest request) {
        limiter.check(auth.requireUser(token));
        return ai.recommend(request.mood(), request.atmosphere(), request.excluded());
    }
    @PostMapping(value="/transcribe", consumes="multipart/form-data") public Map<String, String> transcribe(@RequestHeader(value="Authorization", required=false) String token, @RequestPart("file") MultipartFile file) {
        limiter.check(auth.requireUser(token)); return ai.transcribe(file);
    }
}
