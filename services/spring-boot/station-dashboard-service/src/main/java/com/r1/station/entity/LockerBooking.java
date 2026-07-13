package com.r1.station.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "locker_bookings", schema = "station_svc")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LockerBooking {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "booking_reference", unique = true, nullable = false) private String bookingReference;
    @Column(name = "cris_booking_ref") private String crisBookingRef;
    @Column(name = "locker_id", nullable = false) private UUID lockerId;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "start_time", nullable = false) private Instant startTime;
    @Column(name = "end_time", nullable = false) private Instant endTime;
    @Column(name = "duration_type", nullable = false) private String durationType;
    @Column(name = "total_amount", nullable = false) private BigDecimal totalAmount;
    @Column(name = "payment_id") private UUID paymentId;
    @Builder.Default private String status = "PENDING";
    @Column(name = "access_pin", nullable = false) private String accessPin;
    @Column(columnDefinition = "text") private String qrCode;
    @Column(name = "locker_opened_at") private Instant lockerOpenedAt;
    @Column(name = "created_at") @Builder.Default private Instant createdAt = Instant.now();
}
