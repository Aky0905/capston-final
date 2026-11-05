package com.feelody;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class YoutubeSearch {
    private final String key;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    public YoutubeSearch(@Value("${YOUTUBE_API_KEY:}") String key, ObjectMapper json) {
        this.key = key;
        this.json = json;
    }

    public List<Map<String,Object>> search(String mood, String atmosphere) {
        if (key.isBlank()) return List.of();
        String query = URLEncoder.encode(atmosphere + " 음악 official audio", StandardCharsets.UTF_8);
        var url = URI.create("https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&videoEmbeddable=true&videoSyndicated=true&regionCode=KR&relevanceLanguage=ko&maxResults=5&q=" + query);
        try {
            var req = HttpRequest.newBuilder(url).header("X-Goog-Api-Key", key).timeout(Duration.ofSeconds(8)).GET().build();
            var response = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return List.of();
            List<Map<String,Object>> result = new ArrayList<>();
            for (var item : json.readTree(response.body()).path("items")) {
                String id = item.path("id").path("videoId").asText();
                if (!id.matches("[A-Za-z0-9_-]{11}")) continue;
                var snippet = item.path("snippet");
                result.add(Map.of("id","yt-"+id,"videoId",id,"title",HtmlUtils.htmlUnescape(snippet.path("title").asText()),
                    "artist",HtmlUtils.htmlUnescape(snippet.path("channelTitle").asText()),"thumbnail",snippet.path("thumbnails").path("medium").path("url").asText(),
                    "tone",atmosphere,"moods",List.of(mood),"color","#D8DDF8"));
            }
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return List.of();
        } catch (java.io.IOException e) { return List.of(); }
    }
}
