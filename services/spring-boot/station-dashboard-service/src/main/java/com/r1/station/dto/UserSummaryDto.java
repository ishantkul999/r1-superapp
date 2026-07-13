package com.r1.station.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSummaryDto {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String registeredAt;
    private String lastActiveAt;
    private boolean isBlocked;
}
