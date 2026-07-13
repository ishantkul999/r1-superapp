package com.r1.auth.service;

import com.r1.auth.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserSyncService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${user-service.base-url}")
    private String userServiceBaseUrl;

    @Value("${internal.events.secret:dev-internal-secret}")
    private String internalSecret;

    public void createProfile(User user) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            // Must match INTERNAL_EVENTS_SECRET in user-service
            headers.set("X-Internal-Secret", internalSecret);

            Map<String, Object> body = Map.of(
                    "userId", user.getId().toString(),
                    "phone", user.getPhone(),
                    "role", user.getRole()
            );

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    userServiceBaseUrl + "/internal/users",
                    request,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully synced user {} to user-service", user.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to sync user {} to user-service: {}", user.getId(), e.getMessage());
            // Non-fatal — user profile can be created on first access
        }
    }
}
