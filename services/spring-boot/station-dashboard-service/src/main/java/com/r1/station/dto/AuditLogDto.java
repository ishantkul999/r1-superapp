package com.r1.station.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuditLogDto {
    private String id;
    private String timestamp;
    private String service;
    private String actorId;
    private String actorName;
    private String role;
    private String action;
    private String resource;
    private String outcome;     // "SUCCESS" | "FAILURE"
    private String ipAddress;
}
