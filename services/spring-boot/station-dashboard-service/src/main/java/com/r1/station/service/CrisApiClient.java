package com.r1.station.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
public class CrisApiClient {

    @Value("${cris.api-key:stub}")
    private String apiKey;

    @Value("${cris.base-url:https://api.cris.org.in/v1}")
    private String baseUrl;

    public Map<String, Object> bookRoom(String crisRoomId, String checkIn, String checkOut,
                                         int beds, String userId) {
        if ("stub".equals(apiKey)) {
            String ref = "CRIS-R-" + System.currentTimeMillis() % 1000000;
            log.info("STUB CRIS: Booking room {} ref={}", crisRoomId, ref);
            return Map.of("crisBookingRef", ref, "status", "CONFIRMED");
        }
        // Real: POST {baseUrl}/rooms/book
        throw new UnsupportedOperationException("CRIS API key not configured");
    }

    public Map<String, Object> cancelRoom(String crisBookingRef) {
        if ("stub".equals(apiKey)) {
            log.info("STUB CRIS: Cancelling room booking {}", crisBookingRef);
            return Map.of("status", "CANCELLED");
        }
        throw new UnsupportedOperationException("CRIS API key not configured");
    }

    public Map<String, Object> bookLocker(String crisLockerId, String startTime,
                                           String endTime, String userId) {
        if ("stub".equals(apiKey)) {
            String ref = "CRIS-L-" + System.currentTimeMillis() % 1000000;
            String pin = String.format("%04d", (int)(Math.random() * 10000));
            log.info("STUB CRIS: Booking locker {} ref={}", crisLockerId, ref);
            return Map.of("crisBookingRef", ref, "accessPin", pin, "status", "CONFIRMED");
        }
        throw new UnsupportedOperationException("CRIS API key not configured");
    }

    public Map<String, Object> cancelLocker(String crisBookingRef) {
        if ("stub".equals(apiKey)) {
            log.info("STUB CRIS: Cancelling locker booking {}", crisBookingRef);
            return Map.of("status", "CANCELLED");
        }
        throw new UnsupportedOperationException("CRIS API key not configured");
    }

    public Map<String, Object> checkRoomAvailability(String crisRoomId, String checkIn, String checkOut) {
        if ("stub".equals(apiKey)) {
            return Map.of("available", true, "crisRoomId", crisRoomId);
        }
        throw new UnsupportedOperationException("CRIS API key not configured");
    }

    public Map<String, Object> checkLockerAvailability(String crisLockerId) {
        if ("stub".equals(apiKey)) {
            return Map.of("available", true, "crisLockerId", crisLockerId);
        }
        throw new UnsupportedOperationException("CRIS API key not configured");
    }
}
