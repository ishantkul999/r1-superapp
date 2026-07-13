package com.r1.station.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "digital_lockers", schema = "station_svc")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DigitalLocker {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "cris_locker_id", unique = true) private String crisLockerId;
    @Column(name = "locker_number", nullable = false) private String lockerNumber;
    @Column(nullable = false) private String size;
    private String platform;
    @Column(name = "location_description") private String locationDescription;
    @Column(name = "price_per_6hr", nullable = false) private BigDecimal pricePer6hr;
    @Column(name = "price_per_day", nullable = false) private BigDecimal pricePerDay;
    @Column(name = "is_active") @Builder.Default private Boolean isActive = true;
    @Column(name = "station_id", nullable = false) private UUID stationId;
}
