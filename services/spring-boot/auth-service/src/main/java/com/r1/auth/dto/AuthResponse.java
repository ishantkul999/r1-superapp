package com.r1.auth.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String userId;
    private String phone;
    private String name;
    private String role;
    private boolean isNewUser;
}
