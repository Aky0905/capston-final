package com.feelody;

import org.springframework.stereotype.Component;
import java.time.Clock;
import java.util.HashMap;
import java.util.Map;

@Component
public class RequestLimiter {
    private final Map<String, Bucket> buckets = new HashMap<>();
    private final Clock clock;
    public RequestLimiter() { this(Clock.systemUTC()); }
    RequestLimiter(Clock clock) { this.clock = clock; }
    private record Bucket(long start, int count) {}
    public synchronized void check(String user) {
        long now = clock.millis();
        buckets.entrySet().removeIf(e -> now - e.getValue().start >= 3_600_000);
        var b = buckets.getOrDefault(user, new Bucket(now, 0));
        if (b.count >= 20 || (!buckets.containsKey(user) && buckets.size() >= 10_000))
            throw new ApiException(429, "요청이 많아요. 잠시 쉬었다가 다시 시도해주세요.");
        buckets.put(user, new Bucket(b.start, b.count + 1));
    }
}
