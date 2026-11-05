package com.feelody;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class RequestLimiterTest {
    @Test void limitsPerUserAndAllowsOtherUsers() {
        var limiter = new RequestLimiter();
        for (int i=0; i<20; i++) limiter.check("user-a");
        assertEquals(429, assertThrows(ApiException.class, () -> limiter.check("user-a")).status);
        assertDoesNotThrow(() -> limiter.check("user-b"));
    }
}
