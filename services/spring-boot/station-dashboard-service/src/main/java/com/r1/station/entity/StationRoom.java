package com.r1.station.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "station_rooms", schema = "station_svc")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StationRoom {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "cris_room_id", unique = true) private String crisRoomId;
    @Column(name = "room_number", nullable = false) private String roomNumber;
    @Column(name = "room_type", nullable = false) private String roomType;
    @Column(name = "total_beds", nullable = false) private Integer totalBeds;
    @Column(name = "price_per_night", nullable = false) private BigDecimal pricePerNight;
    @Column(columnDefinition = "text[]") private String[] amenities;
    private String description;
    @Column(name = "image_urls", columnDefinition = "text[]") private String[] imageUrls;
    @Column(name = "is_accessible") @Builder.Default private Boolean isAccessible = false;
    @Column(name = "is_active") @Builder.Default private Boolean isActive = true;
    @Column(name = "station_id", nullable = false) private UUID stationId;
    @Column(name = "created_at") @Builder.Default private Instant createdAt = Instant.now();
}
