package com.r1.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Service
public class Fast2SmsService {

    @Value("${fast2sms.api-key:stub}")
    private String apiKey;

    @Value("${fast2sms.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public void sendOtp(String phone, String otp) {
        if ("stub".equals(apiKey)) {
            log.info("STUB: Would send OTP {} to {}", otp, phone);
            return;
        }

        try {
            String cleanPhone = phone.replaceAll("\\+91", "").replaceAll("[^0-9]", "");
            Map<String, String> params = Map.of(
                    "authorization", apiKey,
                    "route", "q",
                    "message", "Your R1 OTP is " + otp + ". Valid for 5 minutes. Do not share.",
                    "language", "english",
                    "flash", "0",
                    "numbers", cleanPhone
            );
            // Actual API call (stubbed — replace with real Fast2SMS API call)
            log.info("Sending OTP SMS to {} via Fast2SMS", phone);
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", phone, e.getMessage());
        }
    }

    public void sendSms(String phone, String message) {
        if ("stub".equals(apiKey)) {
            log.info("STUB: Would send SMS to {}: {}", phone, message);
            return;
        }
        log.info("Sending SMS to {}: {}", phone, message);
    }
}
