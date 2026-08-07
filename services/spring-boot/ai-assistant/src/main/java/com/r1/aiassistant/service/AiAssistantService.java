package com.r1.aiassistant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAssistantService {

    private final StringRedisTemplate redisTemplate;
    private final ChatClient  chatClient;
    private final VectorStore vectorStore;

    @Value("${chat.rag-top-k:3}")
    private int ragTopK;

    public Map<String, Object> chat(UUID userId, String message, String language) {
        String conversationId = userId.toString();

        String intent = detectIntent(message);
        if (intent != null) {
            String faqResponse = getFaqResponse(intent, language);
            if (faqResponse != null) {
                return Map.of("response", faqResponse, "intent", intent, "source", "FAQ");
            }
        }

        String context = retrieveContext(message, ragTopK);

        String response;
        try {
            response = chatClient.prompt()
                    .system(buildSystemPrompt(language, context))
                    .user(message)
                    .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("[AiAssistant] Chat call failed: {}", e.getMessage());
            response = "I'm having trouble connecting right now. Please try again or call 182 for railway help.";
        }

        return Map.of(
                "response", response,
                "intent", intent != null ? intent : "GENERAL",
                "source", context.isBlank() ? "AI" : "RAG"
        );
    }

    public void clearSession(UUID userId) {
        redisTemplate.delete("chatmem:" + userId);
    }

    // --- RAG context retrieval ------------------------------------------
    private String retrieveContext(String query, int limit) {
        try {
            List<Document> results = vectorStore.similaritySearch(
                    SearchRequest.builder()
                            .query(query)
                            .topK(limit)
                            .build()
            );
            return results.stream()
                    .map(Document::getText)
                    .collect(Collectors.joining("\n---\n"));
        } catch (Exception e) {
            log.warn("[AiAssistant] Vector search failed (continuing without RAG context): {}", e.getMessage());
            return "";
        }
    }

    // Intent Detection
    private String detectIntent(String message) {
        String lower = message.toLowerCase();

        if (containsAny(lower, "sos", "help me", "emergency", "danger", "accident", "\u092e\u0926\u0926", "\u0a2e\u0a26\u0a26")) return "SOS";
        if (containsAny(lower, "porter", "coolie", "luggage", "bag", "\u0938\u093e\u092e\u093e\u0928", "\u0915\u0941\u0932\u0940")) return "PORTER";
        if (containsAny(lower, "locker", "lock", "store bag", "\u0932\u0949\u0915\u0930")) return "LOCKER";
        if (containsAny(lower, "room", "retire", "sleep", "stay", "\u0915\u092e\u0930\u093e", "retiring")) return "ROOM";
        if (containsAny(lower, "toilet", "washroom", "restroom", "bathroom", "\u0936\u094c\u091a\u093e\u0932\u092f")) return "RESTROOM";
        if (containsAny(lower, "pnr", "train status", "platform", "arrival", "departure")) return "TRAIN";
        if (containsAny(lower, "atm", "bank", "money", "cash")) return "ATM";
        if (containsAny(lower, "food", "eat", "restaurant", "canteen", "\u0916\u093e\u0928\u093e", "\u092d\u094b\u091c\u0928")) return "FOOD";
        if (containsAny(lower, "wifi", "internet", "wi-fi")) return "WIFI";
        if (containsAny(lower, "wheelchair", "disabled", "handicap", "\u0926\u093f\u0935\u094d\u092f\u093e\u0902\u0917")) return "WHEELCHAIR";
        return null;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    //  Rule-based FAQ
    private String getFaqResponse(String intent, String language) {
        Map<String, Map<String, String>> faqs = Map.of(
                "SOS", Map.of(
                        "en", "For emergencies, press and hold the red SOS button in the app for 3 seconds. RPF will be notified immediately. If you cannot use the app, call 182 (Railway helpline).",
                        "hi", "\u0906\u092a\u093e\u0924\u0915\u093e\u0932 \u092e\u0947\u0902, \u0910\u092a \u092e\u0947\u0902 \u0932\u093e\u0932 SOS \u092c\u091f\u0928 \u0915\u094b 3 \u0938\u0947\u0915\u0902\u0921 \u0926\u092c\u093e\u090f\u0902\u0964 RPF \u0915\u094b \u0924\u0941\u0930\u0902\u0924 \u0938\u0942\u091a\u093f\u0924 \u0915\u093f\u092f\u093e \u091c\u093e\u090f\u0917\u093e\u0964 \u0939\u0947\u0932\u094d\u092a\u0932\u093e\u0907\u0928: 182",
                        "gu", "\u0a95\u0a9f\u0acb\u0a95\u0a9f\u0ac0 \u0aae\u0abe\u0aa8\u0abe \u0aae\u0abe\u0a9f\u0ac7, \u0a8f\u0aaa\u0aaa\u0aae\u0abe\u0a82 \u0a95\u0a9f\u0acb\u0a95\u0a9f\u0abf\u0aa8\u0acb \u0a95\u0aa4\u0acd\u0aa4\u0abe\u0a95: 182"
                ),
                "PORTER", Map.of(
                        "en", "Porter service at ADI: Rs.100.30 for luggage up to 40kg, Rs.159.30 for barrow (40-160kg), Rs.159.30 for wheelchair. Book via the Porter section in the app. Cash (COD) payment available.",
                        "hi", "ADI \u092a\u0930 \u092a\u094b\u0930\u094d\u091f\u0930 \u0938\u0947\u0935\u093e: 40kg \u0924\u0915 Rs.100.30, \u092c\u0948\u0930\u094b Rs.159.30, \u0935\u094d\u0939\u0940\u0932\u091a\u0947\u092f\u0930 Rs.159.30\u0964",
                        "gu", "ADI \u0aae\u0abe\u0a82 \u0aaa\u0acb\u0a9f\u0ab0: 40kg \u0a38\u0ac1\u0aa7\u0ac0 Rs.100.30, \u0ab8\u0acb\u0aad\u0ac0\u0aa4 Rs.159.30, \u0ab5\u0acd\u0ab9\u0ac0\u0ab2\u0a9a\u0ac7\u0ab0 Rs.159.30."
                ),
                "LOCKER", Map.of(
                        "en", "Digital lockers available at Platform 1 & 4. Small: Rs.30 for 6hrs / Rs.50/day. Medium: Rs.50 / Rs.80. Large: Rs.80 / Rs.120. Book via Lockers section in the app.",
                        "hi", "\u0921\u093f\u091c\u093f\u091f\u0932 \u0932\u0949\u0915\u0930 \u092a\u094d\u0932\u0947\u091f\u092b\u0949\u0930\u094d\u092e 1 \u0914\u0930 4 \u092a\u0930 \u0909\u092a\u0932\u092c\u094d\u0927 \u0939\u0948\u0902\u0964",
                        "gu", "\u0aa1\u0abf\u0a9c\u0abf\u0a9f\u0ab2 \u0ab2\u0acb\u0a95\u0ab0 Platform 1 \u0a05\u0aa8\u0ac7 4 \u0aaa\u0ab0 \u0a89\u0aaa\u0ab2\u0aac\u0acd\u0aa7."
                ),
                "ROOM", Map.of(
                        "en", "Retiring rooms at ADI: AC rooms Rs.600/night, Non-AC Rs.350/night, Dormitory Rs.120/bed. Book via Rooms section in the app. Free cancellation 48 hours before check-in.",
                        "hi", "ADI \u092a\u0930 \u0930\u093f\u091f\u093e\u092f\u0930\u093f\u0902\u0917 \u0930\u0942\u092e: AC Rs.600/\u0930\u093e\u0924, \u0928\u0949\u0928-AC Rs.350/\u0930\u093e\u0924\u0964",
                        "gu", "ADI \u0a96\u0abe\u0aa4\u0ac7 Retiring Rooms: AC Rs.600/\u0ab0\u0abe\u0aa4, Non-AC Rs.350/\u0ab0\u0abe\u0aa4."
                ),
                "RESTROOM", Map.of(
                        "en", "Restrooms are available at Platform 1 (Male, Female, PwD) and Platform 3 (Male, Female). All restrooms are free. Tap Facilities in the app for live status.",
                        "hi", "\u0936\u094c\u091a\u093e\u0932\u092f \u092a\u094d\u0932\u0947\u091f\u092b\u0949\u0930\u094d\u092e 1 \u0914\u0930 3 \u092a\u0930 \u0909\u092a\u0932\u092c\u094d\u0927 \u0939\u0948\u0902\u0964 \u0928\u093f\u0903\u0936\u0941\u0932\u094d\u0915\u0964",
                        "gu", "Restroom Platform 1 \u0a05\u0aa8\u0ac7 3 \u0aaa\u0ab0 \u0a89\u0aaa\u0ab2\u0aac\u0acd\u0aa7. \u0aae\u0aab\u0aa4."
                )
        );

        Map<String, String> langMap = faqs.get(intent);
        if (langMap == null) return null;
        return langMap.getOrDefault(language, langMap.get("en"));
    }

    private String buildSystemPrompt(String language, String ragContext) {
        String langName = switch (language) {
            case "hi" -> "Hindi";
            case "gu" -> "Gujarati";
            default -> "English";
        };
        String base = "You are R1 AI Assistant at Ahmedabad Junction (ADI) railway station. " +
                "Help passengers with porter booking, rooms, lockers, restrooms, train info, and general queries. " +
                "Always respond in " + langName + ". Be concise, helpful, and friendly. " +
                "For SOS/emergency, always direct to the SOS button or call 182. " +
                "Do not discuss topics unrelated to railway travel or Ahmedabad tourism. " +
                "Use the conversation history to understand follow-up questions in context.";

        if (ragContext == null || ragContext.isBlank()) {
            return base + " If you don't have verified facts (exact prices, hours, locations) for a " +
                    "station-related question, say so honestly and suggest checking the relevant section " +
                    "of the app rather than guessing.";
        }

        return base + "\n\nUse the following verified station facts to answer factual questions " +
                "(pricing, hours, locations, procedures). If the answer isn't in these facts, say you're " +
                "not certain rather than guessing:\n" + ragContext;
    }
}
