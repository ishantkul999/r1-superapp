package com.r1.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class FcmStubService {

    @Value("${firebase.service-account:stub}")
    private String serviceAccount;

    public void sendPush(String userId, String title, String body) {
        if ("stub".equals(serviceAccount)) {
            log.info("STUB FCM: Push to user {}: [{}] {}", userId, title, body);
            return;
        }
        log.info("Sending FCM push to {}: {}", userId, title);
    }
}
