package com.r1.porter.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class AuthBridgeService {

    @Value("${auth-service.url:http://localhost:8081}")
    private String authServiceUrl;

    @Value("${internal.secret:dev-internal-secret}")
    private String internalSecret;

    private final RestTemplate restTemplate = new RestTemplate();

    public UUID createOrGetStaffUser(String phone, String name, String email, String role) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Internal-Secret", internalSecret);

        Map<String, Object> body = Map.of(
                "phone", phone,
                "name",  name,
                "email", email != null ? email : "",
                "role",  role
        );

        try {
            ResponseEntity<Map> resp = restTemplate.exchange(
                    authServiceUrl + "/internal/auth/create-staff",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            String userId = (String) resp.getBody().get("userId");
            return UUID.fromString(userId);

        } catch (HttpClientErrorException.Conflict e) {
            log.info("Phone {} already registered, fetching existing userId", phone);
            return lookupExistingUser(phone);

        } catch (Exception e) {
            log.error("Failed to create staff user for phone {}: {}", phone, e.getMessage());
            throw new RuntimeException("Could not create porter account: " + e.getMessage());
        }
    }

    private UUID lookupExistingUser(String phone) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Secret", internalSecret);

        ResponseEntity<Map> resp = restTemplate.exchange(
                authServiceUrl + "/internal/auth/user-by-phone?phone=" + phone,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );
        String userId = (String) resp.getBody().get("userId");
        return UUID.fromString(userId);
    }
}
