package com.eva.crm.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    // Simple in-memory rate limit store: Map<ClientIP, TokenBucket>
    private final Map<String, TokenBucket> limitStore = new ConcurrentHashMap<>();
    
    // Limits: Max 10 requests per minute
    private static final int MAX_REQUESTS = 10;
    private static final long TIME_WINDOW_MS = 60_000; // 1 minute

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Only apply to POST /auth/login and POST /auth/quick-login routes
        String uri = request.getRequestURI();
        String method = request.getMethod();
        
        if ("POST".equalsIgnoreCase(method) && (uri.contains("/auth/login") || uri.contains("/auth/quick-login"))) {
            String clientIp = getClientIp(request);
            TokenBucket bucket = limitStore.computeIfAbsent(clientIp, k -> new TokenBucket());
            
            if (!bucket.tryConsume()) {
                sendErrorResponse(response);
                return false;
            }
        }
        
        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private void sendErrorResponse(HttpServletResponse response) throws IOException {
        response.setStatus(429); // HTTP 429 Too Many Requests
        response.setContentType("application/json");
        
        Map<String, Object> errorMap = new HashMap<>();
        errorMap.put("success", false);
        errorMap.put("message", "Too many requests. Please wait a minute before trying to login again.");
        errorMap.put("data", null);

        ObjectMapper mapper = new ObjectMapper();
        response.getWriter().write(mapper.writeValueAsString(errorMap));
    }

    private static class TokenBucket {
        private final AtomicInteger tokens = new AtomicInteger(MAX_REQUESTS);
        private long lastRefillTime = System.currentTimeMillis();

        public synchronized boolean tryConsume() {
            refill();
            if (tokens.get() > 0) {
                tokens.decrementAndGet();
                return true;
            }
            return false;
        }

        private void refill() {
            long now = System.currentTimeMillis();
            if (now - lastRefillTime > TIME_WINDOW_MS) {
                tokens.set(MAX_REQUESTS);
                lastRefillTime = now;
            }
        }
    }
}
