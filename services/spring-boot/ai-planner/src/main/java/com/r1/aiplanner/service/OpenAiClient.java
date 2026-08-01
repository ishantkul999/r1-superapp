package com.r1.aiplanner.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class OpenAiClient {

    private final GroqChatClient groqChatClient;

    public String chat(List<Map<String, String>> messages) {
        return groqChatClient.chat(messages);
    }

    public float[] embed(String text) {
        return groqChatClient.embed(text);
    }
}
