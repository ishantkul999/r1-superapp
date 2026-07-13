package com.r1.aiassistant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAssistantService {

    private final StringRedisTemplate redisTemplate;
    private final AiAssistantOpenAiClient openAiClient;

    @Value("${chat.session-ttl-minutes:30}")
    private int sessionTtlMinutes;

    @Value("${chat.max-history-messages:20}")
    private int maxHistoryMessages;

    private static final String SESSION_KEY = "chat:session:%s";

    public Map<String, Object> chat(UUID userId, String message, String language) {
        String sessionKey = String.format(SESSION_KEY, userId);

        // Detect intent
        String intent = detectIntent(message);
        if (intent != null) {
            String faqResponse = getFaqResponse(intent, language);
            if (faqResponse != null) {
                appendToHistory(sessionKey, "user", message);
                appendToHistory(sessionKey, "assistant", faqResponse);
                return Map.of("response", faqResponse, "intent", intent, "source", "FAQ");
            }
        }

        // Build conversation history
        List<Map<String, String>> history = getHistory(sessionKey);
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", buildSystemPrompt(language)));
        messages.addAll(history);
        messages.add(Map.of("role", "user", "content", message));

        String response = openAiClient.chat(messages);

        // Persist history
        appendToHistory(sessionKey, "user", message);
        appendToHistory(sessionKey, "assistant", response);
        redisTemplate.expire(sessionKey, Duration.ofMinutes(sessionTtlMinutes));

        return Map.of("response", response, "intent", intent != null ? intent : "GENERAL", "source", "AI");
    }

    public void clearSession(UUID userId) {
        redisTemplate.delete(String.format(SESSION_KEY, userId));
    }

    // ─── Intent Detection ─────────────────────────────────────────────

    private String detectIntent(String message) {
        String lower = message.toLowerCase();

        if (containsAny(lower, "sos", "help me", "emergency", "danger", "accident", "मदद", "ਮਦਦ")) return "SOS";
        if (containsAny(lower, "porter", "coolie", "luggage", "bag", "सामान", "कुली")) return "PORTER";
        if (containsAny(lower, "locker", "lock", "store bag", "लॉकर")) return "LOCKER";
        if (containsAny(lower, "room", "retire", "sleep", "stay", "कमरा", "retiring")) return "ROOM";
        if (containsAny(lower, "toilet", "washroom", "restroom", "bathroom", "शौचालय")) return "RESTROOM";
        if (containsAny(lower, "pnr", "train status", "platform", "arrival", "departure")) return "TRAIN";
        if (containsAny(lower, "atm", "bank", "money", "cash")) return "ATM";
        if (containsAny(lower, "food", "eat", "restaurant", "canteen", "खाना", "भोजन")) return "FOOD";
        if (containsAny(lower, "wifi", "internet", "wi-fi")) return "WIFI";
        if (containsAny(lower, "wheelchair", "disabled", "handicap", "दिव्यांग")) return "WHEELCHAIR";
        return null;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    // ─── Rule-based FAQ ───────────────────────────────────────────────

    private String getFaqResponse(String intent, String language) {
        Map<String, Map<String, String>> faqs = Map.of(
            "SOS", Map.of(
                "en", "🚨 For emergencies, press and hold the red SOS button in the app for 3 seconds. RPF will be notified immediately. If you cannot use the app, call 182 (Railway helpline).",
                "hi", "🚨 आपातकाल में, ऐप में लाल SOS बटन को 3 सेकंड दबाएं। RPF को तुरंत सूचित किया जाएगा। हेल्पलाइन: 182",
                "gu", "🚨 કટોકટી માટે, એપ્પમાં લાલ SOS બટન 3 સેકન્ડ દબાવો. RPFને તરત જ સૂચિત કરવામાં આવશે. હેલ્પલાઇન: 182"
            ),
            "PORTER", Map.of(
                "en", "🧳 Porter service at ADI: ₹100.30 for luggage up to 40kg, ₹159.30 for barrow (40-160kg), ₹159.30 for wheelchair. Book via the Porter section in the app. Cash (COD) payment available.",
                "hi", "🧳 ADI पर पोर्टर सेवा: 40kg तक ₹100.30, बैरो ₹159.30, व्हीलचेयर ₹159.30। ऐप के Porter सेक्शन से बुक करें।",
                "gu", "🧳 ADI ખાતે પોર્ટર: 40kg સુધી ₹100.30, બૅરો ₹159.30, વ્હીલચૅર ₹159.30. ઍપ્પ પોર્ટર સેક્શનથી બૂક કરો."
            ),
            "LOCKER", Map.of(
                "en", "🔒 Digital lockers available at Platform 1 & 4. Small: ₹30 for 6hrs / ₹50/day. Medium: ₹50 / ₹80. Large: ₹80 / ₹120. Book via Lockers section in the app.",
                "hi", "🔒 डिजिटल लॉकर प्लेटफॉर्म 1 और 4 पर उपलब्ध हैं। छोटा: ₹30/6घंटे, ₹50/दिन। मध्यम: ₹50/₹80। बड़ा: ₹80/₹120।",
                "gu", "🔒 ડિજિટલ લૉકર Platform 1 અને 4 પર ઉપલબ્ધ. Small: ₹30/6કલાક, ₹50/દિવસ. Medium: ₹50/₹80. Large: ₹80/₹120."
            ),
            "ROOM", Map.of(
                "en", "🛏 Retiring rooms at ADI: AC rooms ₹600/night, Non-AC ₹350/night, Dormitory ₹120/bed. Book via Rooms section in the app. Free cancellation 48 hours before check-in.",
                "hi", "🛏 ADI पर रिटायरिंग रूम: AC ₹600/रात, नॉन-AC ₹350/रात, डॉर्मिटरी ₹120/बेड।",
                "gu", "🛏 ADI ખાતે Retiring Rooms: AC ₹600/રાત, Non-AC ₹350/રાત, Dormitory ₹120/bed."
            ),
            "RESTROOM", Map.of(
                "en", "🚻 Restrooms are available at Platform 1 (Male, Female, PwD) and Platform 3 (Male, Female). All restrooms are free. Tap Facilities in the app for live status.",
                "hi", "🚻 शौचालय प्लेटफॉर्म 1 और 3 पर उपलब्ध हैं। निःशुल्क। ऐप में Facilities देखें।",
                "gu", "🚻 Restroom Platform 1 અને 3 પર ઉપલબ્ધ. મફત. ઍપ્પ Facilities સ્ક્રીન."
            )
        );

        Map<String, String> langMap = faqs.get(intent);
        if (langMap == null) return null;
        return langMap.getOrDefault(language, langMap.get("en"));
    }

    // ─── Session History ──────────────────────────────────────────────

    private List<Map<String, String>> getHistory(String sessionKey) {
        List<String> raw = redisTemplate.opsForList().range(sessionKey, 0, -1);
        if (raw == null) return new ArrayList<>();

        List<Map<String, String>> history = new ArrayList<>();
        for (String entry : raw) {
            String[] parts = entry.split("\\|\\|", 2);
            if (parts.length == 2) {
                history.add(Map.of("role", parts[0], "content", parts[1]));
            }
        }

        // Keep only last N messages
        if (history.size() > maxHistoryMessages) {
            history = history.subList(history.size() - maxHistoryMessages, history.size());
        }
        return history;
    }

    private void appendToHistory(String sessionKey, String role, String content) {
        redisTemplate.opsForList().rightPush(sessionKey, role + "||" + content);
        // Trim to max size
        redisTemplate.opsForList().trim(sessionKey, -maxHistoryMessages * 2L, -1);
    }

    private String buildSystemPrompt(String language) {
        String langName = switch (language) {
            case "hi" -> "Hindi";
            case "gu" -> "Gujarati";
            default -> "English";
        };
        return "You are R1 AI Assistant at Ahmedabad Junction (ADI) railway station. " +
               "Help passengers with porter booking, rooms, lockers, restrooms, train info, and general queries. " +
               "Always respond in " + langName + ". Be concise, helpful, and friendly. " +
               "For SOS/emergency, always direct to the SOS button or call 182. " +
               "Do not discuss topics unrelated to railway travel or Ahmedabad tourism.";
    }
}
