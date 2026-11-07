package com.feelody;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class YoutubeSearch {
    private static final Pattern NON_ORIGINAL = Pattern.compile(
        "플레이리스트|플리|모음|메들리|커버|리믹스|노래방|이어듣기|연속[재듣]|반복재생|시간\\s*(반복|연속)|" +
        "\\b(playlist|mix|mixtape|medley|compilation|cover|remix|karaoke|mashup|loop|sped up|slowed|full album|greatest hits)\\b|" +
        "\\b\\d+\\s*(hours?|hrs?)\\b", Pattern.CASE_INSENSITIVE);
    private final String key;
    private final ObjectMapper json;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    public YoutubeSearch(@Value("${YOUTUBE_API_KEY:}") String key, ObjectMapper json) {
        this.key = key;
        this.json = json;
    }

    static boolean isOriginalTrack(String title, String channel, String description) {
        if (title.isBlank() || NON_ORIGINAL.matcher(title).find()) return false;
        String publisher = channel.toLowerCase(Locale.ROOT);
        return publisher.endsWith(" - topic") || publisher.endsWith("vevo")
            || description.startsWith("Provided to YouTube by ");
    }

    public List<Map<String,Object>> search(String mood, String atmosphere) {
        if (key.isBlank()) return List.of();
        String query = URLEncoder.encode(atmosphere + " official audio -playlist -플레이리스트 -모음 -cover -remix", StandardCharsets.UTF_8);
        var url = URI.create("https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&videoEmbeddable=true&videoSyndicated=true&regionCode=KR&relevanceLanguage=ko&maxResults=50&q=" + query);
        try {
            var req = HttpRequest.newBuilder(url).header("X-Goog-Api-Key", key).timeout(Duration.ofSeconds(8)).GET().build();
            var response = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) return List.of();
            List<Map<String,Object>> result = new ArrayList<>();
            for (var item : json.readTree(response.body()).path("items")) {
                String id = item.path("id").path("videoId").asText();
                if (!id.matches("[A-Za-z0-9_-]{11}")) continue;
                var snippet = item.path("snippet");
                String title = HtmlUtils.htmlUnescape(snippet.path("title").asText());
                String channel = HtmlUtils.htmlUnescape(snippet.path("channelTitle").asText());
                if (!isOriginalTrack(title, channel, snippet.path("description").asText())) continue;
                result.add(Map.of("id","yt-"+id,"videoId",id,"title",title,
                    "artist",channel,"thumbnail",snippet.path("thumbnails").path("medium").path("url").asText(),
                    "tone",atmosphere,"moods",List.of(mood),"color","#D8DDF8"));
                if (result.size() == 5) break;
            }
            return result;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return List.of();
        } catch (java.io.IOException e) { return List.of(); }
    }
}
