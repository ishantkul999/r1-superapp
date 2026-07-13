package com.r1.station.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "facilities", schema = "station_svc")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Facility {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false) private String name;
    @Column(nullable = false) private String type;
    private String platform;
    @Builder.Default private String status = "OPEN";
    private String reason;
    @Column(name = "estimated_resolution_mins") private Integer estimatedResolutionMins;
    @Column(name = "updated_by") private UUID updatedBy;
    @Column(name = "updated_at") @Builder.Default private Instant updatedAt = Instant.now();
    @Column(name = "station_id", nullable = false) private UUID stationId;
}
