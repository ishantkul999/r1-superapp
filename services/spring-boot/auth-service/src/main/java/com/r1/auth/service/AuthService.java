package com.r1.auth.service;

import com.r1.auth.dto.AuthResponse;
import com.r1.auth.entity.RefreshToken;
import com.r1.auth.entity.User;
import com.r1.auth.kafka.AuthEventProducer;
import com.r1.auth.repository.RefreshTokenRepository;
import com.r1.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final AuthEventProducer eventProducer;
    private final UserSyncService userSyncService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public void sendOtp(String phone) {
        otpService.sendOtp(phone);
    }

    @Transactional
    public AuthResponse verifyOtp(String phone, String otp) {
        boolean valid = otpService.verifyOtp(phone, otp);
        if (!valid) {
            throw new RuntimeException("Invalid OTP");
        }

        boolean isNewUser = false;
        User user = userRepository.findByPhone(phone).orElse(null);

        if (user == null) {
            // New user registration
            user = User.builder()
                    .phone(phone)
                    .role("USER")
                    .isActive(true)
                    .build();
            user = userRepository.save(user);
            isNewUser = true;

            // Sync profile to user-service
            try {
                userSyncService.createProfile(user);
            } catch (Exception e) {
                log.warn("Failed to sync user profile to user-service: {}", e.getMessage());
            }

            // Publish auth.registered event
            eventProducer.publishAuthRegistered(user);
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated. Please contact support.");
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshTokenValue = jwtService.generateRefreshToken();
        String tokenHash = passwordEncoder.encode(refreshTokenValue);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(jwtService.getRefreshTokenExpiry())
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .userId(user.getId().toString())
                .phone(user.getPhone())
                .name(user.getName())
                .role(user.getRole())
                .isNewUser(isNewUser)
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenValue) {
        // Find token by hash (brute-force search — in production use indexed token ID)
        var allTokens = refreshTokenRepository.findAll();
        RefreshToken found = allTokens.stream()
                .filter(t -> passwordEncoder.matches(refreshTokenValue, t.getTokenHash()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Invalid or expired refresh token"));

        if (found.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(found);
            throw new RuntimeException("Refresh token expired");
        }

        User user = found.getUser();
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshTokenValue = jwtService.generateRefreshToken();
        String newTokenHash = passwordEncoder.encode(newRefreshTokenValue);

        // Rotate refresh token
        refreshTokenRepository.delete(found);
        RefreshToken newRefreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(newTokenHash)
                .expiresAt(jwtService.getRefreshTokenExpiry())
                .build();
        refreshTokenRepository.save(newRefreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenValue)
                .userId(user.getId().toString())
                .phone(user.getPhone())
                .name(user.getName())
                .role(user.getRole())
                .isNewUser(false)
                .build();
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        var allTokens = refreshTokenRepository.findAll();
        allTokens.stream()
                .filter(t -> passwordEncoder.matches(refreshTokenValue, t.getTokenHash()))
                .findFirst()
                .ifPresent(refreshTokenRepository::delete);
    }

    public User getCurrentUser(String userId) {
        return userRepository.findById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Transactional
    public void updateRole(String userId, String newRole) {
        User user = userRepository.findById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(newRole);
        userRepository.save(user);
    }
}
