package com.r1.auth.controller;

import com.r1.auth.entity.User;
import com.r1.auth.repository.UserRepository;
import com.r1.auth.service.AuthService;
import com.r1.auth.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * InternalAuthController — internal-only endpoints for inter-service calls.
 *
 * DROP AT:
 *   services/spring-boot/auth-service/src/main/java/com/r1/auth/controller/InternalAuthController.java
 *
 * These endpoints are called server-to-server only (not through the gateway).
 * Protected by X-Internal-Secret header.
 *
 * Endpoints:
 *   POST /internal/auth/create-staff       — create a new staff user (SCR/Supervisor/RPF)
 *   GET  /internal/auth/user-by-phone      — lookup user by phone number
 *   GET  /internal/auth/health             — liveness check
 */
@Slf4j
@RestController
@RequestMapping("/internal/auth")
@RequiredArgsConstructor
public class InternalAuthController {

    private final UserRepository userRepository;
    private final OtpService     otpService;
    private final AuthService    authService;

    @Value("${internal.secret:dev-internal-secret}")
    private String internalSecret;

    // ── Auth helper ───────────────────────────────────────────────────────────

    private boolean isAuthorized(String secret) {
        return internalSecret.equals(secret);
    }

    // ── POST /internal/auth/create-staff ─────────────────────────────────────

    /**
     * Creates a new user account with the given role.
     * Called by:
     *   - user-service station-control.routes.js (creates SUPERVISOR / RPF)
     *   - user-service superadmin.routes.js (creates STATION_CONTROL_ROOM)
     *
     * After creation, an OTP is sent to the phone number so the new staff
     * member can log in immediately on first use.
     *
     * Returns 409 Conflict if phone already registered.
     */
    @PostMapping("/create-staff")
    public ResponseEntity<?> createStaff(
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret,
            @RequestBody Map<String, Object> body) {

        if (!isAuthorized(secret)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized internal request"));
        }

        String phone = (String) body.get("phone");
        String name  = (String) body.get("name");
        String email = (String) body.get("email");
        String role  = (String) body.get("role");

        if (phone == null || role == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "phone and role are required"));
        }

        // Validate role
        if (!java.util.List.of("SUPERVISOR","RPF","STATION_CONTROL_ROOM","PORTER","SUPERADMIN").contains(role)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + role));
        }

        // Check if phone already registered
        if (userRepository.findByPhone(phone).isPresent()) {
            return ResponseEntity.status(409).body(Map.of(
                    "error", "Phone already registered",
                    "userId", userRepository.findByPhone(phone).get().getId().toString()
            ));
        }

        try {
            User user = User.builder()
                    .phone(phone)
                    .name(name)
                    .email(email)
                    .role(role)
                    .isActive(true)
                    .build();
            user = userRepository.save(user);

            // Send OTP so staff can log in on first use
            try {
                otpService.sendOtp(phone);
                log.info("[Internal] Staff account created: {} ({}) — OTP sent", phone, role);
            } catch (Exception otpErr) {
                log.warn("[Internal] Staff created but OTP send failed: {}", otpErr.getMessage());
            }

            return ResponseEntity.status(201).body(Map.of(
                    "userId", user.getId().toString(),
                    "phone",  phone,
                    "role",   role,
                    "message","Account created. OTP sent to " + phone
            ));

        } catch (Exception e) {
            log.error("[Internal] create-staff failed: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // ── GET /internal/auth/user-by-phone ─────────────────────────────────────

    /**
     * Returns user ID for a given phone number.
     * Used as fallback when create-staff returns 409 (user already exists).
     */
    @GetMapping("/user-by-phone")
    public ResponseEntity<?> getUserByPhone(
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret,
            @RequestParam String phone) {

        if (!isAuthorized(secret)) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized internal request"));
        }

        return userRepository.findByPhone(phone)
                .map(u -> ResponseEntity.ok(Map.of(
                        "userId", u.getId().toString(),
                        "phone",  u.getPhone(),
                        "role",   u.getRole(),
                        "name",   u.getName() != null ? u.getName() : ""
                )))
                .orElse(ResponseEntity.status(404).body(Map.of("error", "User not found")));
    }

    // ── GET /internal/auth/health ─────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "auth-service-internal"));
    }
}
