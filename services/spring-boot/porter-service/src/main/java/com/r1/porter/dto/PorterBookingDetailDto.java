package com.r1.porter.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * NEW FILE
 * DROP AT:
 *   services/spring-boot/porter-service/src/main/java/com/r1/porter/dto/PorterBookingDetailDto.java
 *
 * Returned by GET /api/porter/bookings/my
 * Includes porter contact details joined from porter_svc.porters so the
 * passenger's BookingsPage shows porter name, phone, badge without a 2nd call.
 * porterName/porterPhone/porterBadge/porterZone are null until porter accepts.
 */
@Data
@Builder
public class PorterBookingDetailDto {
    private UUID       id;
    private String     bookingReference;
    private UUID       userId;
    private UUID       porterId;
    private String     serviceType;
    private String     status;
    private String     trainNumber;
    private String     coachNumber;
    private String     platform;
    private String     pnrNumber;
    private String     seatBerth;
    private String     pickupLocation;
    private String     destination;
    private String     passengerName;
    private String     passengerMobile;
    private String     passengerEmail;
    private String     specialInstructions;
    private BigDecimal baseAmount;
    private BigDecimal gstAmount;
    private BigDecimal totalAmount;
    private String     paymentMethod;
    private String     servicePin;
    private Instant    bookingTime;
    private Instant    acceptanceTime;
    private Instant    startTime;
    private Instant    completionTime;
    private Instant    createdAt;
    // Porter contact — populated once porter accepts
    private String     porterName;
    private String     porterPhone;
    private String     porterBadge;
    private String     porterZone;
}