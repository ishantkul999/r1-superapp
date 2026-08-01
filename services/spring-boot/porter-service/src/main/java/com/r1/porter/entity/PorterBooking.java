package com.r1.porter.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "porter_bookings", schema = "porter_svc")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PorterBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "booking_reference", unique = true, nullable = false)
    private String bookingReference;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "porter_id")
    private UUID porterId;

    @Column(name = "service_type", nullable = false)
    private String serviceType;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING_ACCEPTANCE";

    // ── Journey fields ────────────────────────────────────────────────────────

    @Column(name = "train_number")
    private String trainNumber;

    @Column(name = "coach_number")
    private String coachNumber;

    private String platform;

    /** NEW — PNR number of the passenger's ticket */
    @Column(name = "pnr_number")
    private String pnrNumber;

    /** NEW — Seat or berth number (optional) */
    @Column(name = "seat_berth")
    private String seatBerth;

    // ── Location ──────────────────────────────────────────────────────────────

    @Column(name = "pickup_location")
    private String pickupLocation;

    private String destination;

    // ── Luggage / service details ─────────────────────────────────────────────

    @Column(name = "luggage_count")
    private Integer luggageCount;

    @Column(name = "luggage_weight_kg")
    private BigDecimal luggageWeightKg;

    @Column(name = "weight_tier")
    private String weightTier;

    @Column(name = "special_instructions")
    private String specialInstructions;

    @Column(name = "assistance_type")
    private String assistanceType;

    @Column(name = "passenger_name")
    private String passengerName;

    @Column(name = "passenger_mobile")
    private String passengerMobile;

    @Column(name = "passenger_email")
    private String passengerEmail;

    // ── Financials ────────────────────────────────────────────────────────────

    @Column(name = "base_amount", nullable = false)
    private BigDecimal baseAmount;

    @Column(name = "gst_amount", nullable = false)
    private BigDecimal gstAmount;

    @Column(name = "total_amount", nullable = false)
    private BigDecimal totalAmount;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(name = "service_pin", nullable = false)
    private String servicePin;

    // ── Timestamps ────────────────────────────────────────────────────────────

    @Column(name = "booking_time")
    @Builder.Default
    private Instant bookingTime = Instant.now();

    @Column(name = "acceptance_time")
    private Instant acceptanceTime;

    @Column(name = "start_time")
    private Instant startTime;

    @Column(name = "completion_time")
    private Instant completionTime;

    @Column(name = "station_id")
    private UUID stationId;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
