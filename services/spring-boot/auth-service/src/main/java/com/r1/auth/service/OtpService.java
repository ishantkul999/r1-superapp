package com.r1.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final StringRedisTemplate redisTemplate;
    private final Fast2SmsService fast2SmsService;

    @Value("${otp.dev-mode:true}")
    private boolean devMode;

    @Value("${otp.dev-otp:123456}")
    private String devOtp;

    @Value("${otp.ttl-seconds:300}")
    private long otpTtlSeconds;

    @Value("${otp.rate-limit-seconds:60}")
    private long rateLimitSeconds;

    @Value("${otp.lockout-seconds:1800}")
    private long lockoutSeconds;

    @Value("${otp.max-wrong-attempts:3}")
    private int maxWrongAttempts;

    private static final String OTP_KEY = "otp:%s";
    private static final String RATE_KEY = "otp_rate:%s";
    private static final String LOCK_KEY = "otp_lock:%s";
    private static final String ATTEMPTS_KEY = "otp_attempts:%s";

    public void sendOtp(String phone) {
        // Check lockout
        String lockKey = String.format(LOCK_KEY, phone);
        if (Boolean.TRUE.equals(redisTemplate.hasKey(lockKey))) {
            throw new RuntimeException("Account temporarily locked due to too many failed attempts. Try after 30 minutes.");
        }

        // Check rate limit
        String rateKey = String.format(RATE_KEY, phone);
        if (Boolean.TRUE.equals(redisTemplate.hasKey(rateKey))) {
            throw new RuntimeException("OTP already sent. Please wait 60 seconds before requesting again.");
        }

        String otp = devMode ? devOtp : generateOtp();

        // Store OTP in Redis
        redisTemplate.opsForValue().set(
                String.format(OTP_KEY, phone),
                otp,
                Duration.ofSeconds(otpTtlSeconds)
        );

        // Set rate limit
        redisTemplate.opsForValue().set(rateKey, "1", Duration.ofSeconds(rateLimitSeconds));

        if (!devMode) {
            fast2SmsService.sendOtp(phone, otp);
        } else {
            log.info("DEV MODE - OTP for {}: {}", phone, otp);
        }
    }

    public boolean verifyOtp(String phone, String otp) {
        // Check lockout
        String lockKey = String.format(LOCK_KEY, phone);
        if (Boolean.TRUE.equals(redisTemplate.hasKey(lockKey))) {
            throw new RuntimeException("Account temporarily locked.");
        }

        String otpKey = String.format(OTP_KEY, phone);
        String storedOtp = redisTemplate.opsForValue().get(otpKey);

        if (storedOtp == null) {
            throw new RuntimeException("OTP expired or not found. Please request a new OTP.");
        }

        if (!storedOtp.equals(otp)) {
            // Increment wrong attempts
            String attemptsKey = String.format(ATTEMPTS_KEY, phone);
            Long attempts = redisTemplate.opsForValue().increment(attemptsKey);
            redisTemplate.expire(attemptsKey, Duration.ofSeconds(otpTtlSeconds));

            if (attempts != null && attempts >= maxWrongAttempts) {
                // Lockout
                redisTemplate.opsForValue().set(lockKey, "1", Duration.ofSeconds(lockoutSeconds));
                redisTemplate.delete(otpKey);
                redisTemplate.delete(attemptsKey);
                throw new RuntimeException("Too many wrong attempts. Account locked for 30 minutes.");
            }
            return false;
        }

        // OTP verified — cleanup Redis
        redisTemplate.delete(otpKey);
        redisTemplate.delete(String.format(ATTEMPTS_KEY, phone));
        return true;
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}
