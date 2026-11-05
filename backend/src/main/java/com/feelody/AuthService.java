package com.feelody;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.UUID;

@Service
public class AuthService {
    private final String url, key;
    private final ObjectMapper mapper;
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    public AuthService(@Value("${feelody.supabase-url}") String url, @Value("${feelody.supabase-key}") String key, ObjectMapper mapper) {
        this.url = url.replaceAll("/$", ""); this.key = key; this.mapper = mapper;
    }
    public String requireUser(String authorization) {
        if (url.isBlank() || key.isBlank()) throw new ApiException(503, "서버 인증 설정이 필요해요.");
        if (authorization == null || !authorization.startsWith("Bearer ") || authorization.length() > 8192)
            throw new ApiException(401, "로그인이 필요해요.");
        try {
            var req = HttpRequest.newBuilder(URI.create(url + "/auth/v1/user")).timeout(Duration.ofSeconds(10))
                    .header("apikey", key).header("Authorization", authorization).GET().build();
            var res = client.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() == 401 || res.statusCode() == 403) throw new ApiException(401, "로그인이 만료됐어요. 다시 로그인해주세요.");
            if (res.statusCode() != 200) throw new ApiException(503, "인증 서버에 연결하지 못했어요.");
            return UUID.fromString(mapper.readTree(res.body()).path("id").asText()).toString();
        } catch (ApiException e) { throw e; }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new ApiException(503, "요청이 중단됐어요."); }
        catch (Exception e) { throw new ApiException(503, "인증 서버에 연결하지 못했어요."); }
    }
}
