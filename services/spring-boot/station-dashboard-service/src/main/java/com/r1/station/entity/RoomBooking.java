package com.r1.station.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "station_room_bookings", schema = "station_svc")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RoomBooking {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "booking_reference", unique = true, nullable = false) private String bookingReference;
    @Column(name = "cris_booking_ref") private String crisBookingRef;
    @Column(name = "room_id", nullable = false) private UUID roomId;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "check_in", nullable = false) private LocalDate checkIn;
    @Column(name = "check_out", nullable = false) private LocalDate checkOut;
    @Column(name = "beds_booked") @Builder.Default private Integer bedsBooked = 1;
    @Column(name = "total_amount", nullable = false) private BigDecimal totalAmount;
    @Column(name = "payment_id") private UUID paymentId;
    @Builder.Default private String status = "PENDING";
    @Column(columnDefinition = "text") private String qrCode;
    @Column(name = "special_requests") private String specialRequests;
    @Column(name = "created_at") @Builder.Default private Instant createdAt = Instant.now();
}
