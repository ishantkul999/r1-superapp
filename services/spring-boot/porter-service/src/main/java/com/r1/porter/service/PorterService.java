package com.r1.porter.service;

import com.r1.porter.dto.EarningsDto;
import com.r1.porter.dto.PorterBookingDetailDto;
import com.r1.porter.dto.PorterDashboardDto;
import com.r1.porter.dto.SupervisorDashboardDto;
import com.r1.porter.entity.Porter;
import com.r1.porter.entity.PorterBooking;
import com.r1.porter.entity.PorterRating;
import com.r1.porter.kafka.PorterEventProducer;
import com.r1.porter.repository.PorterBookingRepository;
import com.r1.porter.repository.PorterRatingRepository;
import com.r1.porter.repository.PorterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * REPLACE the existing PorterService.java entirely.
 *
 * DROP AT:
 *   services/spring-boot/porter-service/src/main/java/com/r1/porter/service/PorterService.java
 *
 * Changes from original:
 *   - createBooking() — now maps pnrNumber, seatBerth, passengerName,
 *     passengerMobile, passengerEmail from request into the booking entity
 *   - registerPorter() — now maps employeeId, fullName, email, phone,
 *     dateOfBirth, onboardedBy into the porter entity
 *   - calculateBaseAmount() — adds LUGGAGE_ONLY and WHEELCHAIR_ONLY as
 *     explicit cases (previously fell through to default)
 *   + getDashboard()           — NEW (from previous fix)
 *   + getActiveJob()           — NEW
 *   + getEarnings()            — NEW
 *   + getAllPorters()           — NEW
 *   + getUnassignedPendingBookings() — NEW
 *   + getSupervisorDashboard() — NEW
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PorterService {

    private final PorterRepository        porterRepository;
    private final PorterBookingRepository bookingRepository;
    private final PorterRatingRepository  ratingRepository;
    private final PorterEventProducer     eventProducer;
    private final StringRedisTemplate     redisTemplate;

    private static final String     SUPERVISOR_TIMER_KEY = "porter:supervisor_timer:%s";
    private static final UUID       DEFAULT_STATION_ID   = UUID.fromString("00000000-0000-0000-0000-100000000001");
    private static final ZoneId     IST                  = ZoneId.of("Asia/Kolkata");
    private static final BigDecimal PLATFORM_FEE_RATE    = new BigDecimal("0.10");

    // CRIS-regulated base tariffs (excl. GST)
    private static final BigDecimal BASE_LUGGAGE_ONLY        = new BigDecimal("85.00");
    private static final BigDecimal BASE_LUGGAGE_BARROW      = new BigDecimal("135.00");
    private static final BigDecimal BASE_WHEELCHAIR_ONLY     = new BigDecimal("135.00");
    private static final BigDecimal BASE_WHEELCHAIR_STRETCHER= new BigDecimal("205.00");
    private static final BigDecimal BASE_COMBINED            = new BigDecimal("220.00");
    private static final BigDecimal GST_RATE                 = new BigDecimal("0.18");

    // ═════════════════════════════════════════════════════════════════════════
    // BOOKING OPERATIONS
    // ═════════════════════════════════════════════════════════════════════════

    @Transactional
    public PorterBooking createBooking(UUID userId, Map<String, Object> request) {
        String serviceType   = (String) request.get("serviceType");
        String paymentMethod = (String) request.getOrDefault("paymentMethod", "ONLINE");

        BigDecimal base  = calculateBaseAmount(serviceType);
        BigDecimal gst   = base.multiply(GST_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = base.add(gst);

        PorterBooking booking = PorterBooking.builder()
                .bookingReference(generateBookingReference())
                .userId(userId)
                .serviceType(serviceType)
                .status("COD".equals(paymentMethod) ? "PENDING_ACCEPTANCE" : "AWAITING_PAYMENT")
                // Journey details
                .trainNumber((String) request.get("trainNumber"))
                .coachNumber((String) request.get("coachNumber"))
                .platform((String) request.get("platform"))
                .pnrNumber((String) request.get("pnrNumber"))           // NEW
                .seatBerth((String) request.get("seatBerth"))           // NEW
                // Locations (free text)
                .pickupLocation((String) request.get("pickupLocation"))
                .destination((String) request.get("destination"))
                // Luggage
                .luggageCount(request.get("luggageCount") != null
                        ? ((Number) request.get("luggageCount")).intValue() : null)
                .luggageWeightKg(request.get("luggageWeightKg") != null
                        ? new BigDecimal(request.get("luggageWeightKg").toString()) : null)
                .assistanceType((String) request.get("assistanceType"))
                .specialInstructions((String) request.get("specialInstructions"))
                // Passenger details (autofilled from profile, embedded in booking) NEW
                .passengerName((String) request.get("passengerName"))
                .passengerMobile((String) request.get("passengerMobile"))
                .passengerEmail((String) request.get("passengerEmail"))
                // Financials
                .baseAmount(base)
                .gstAmount(gst)
                .totalAmount(total)
                .paymentMethod(paymentMethod)
                .servicePin(generateServicePin())
                .stationId(DEFAULT_STATION_ID)
                .build();

        booking = bookingRepository.save(booking);

        if ("COD".equals(paymentMethod)) {
            startSupervisorTimer(booking.getId());
        }

        eventProducer.publishBookingCreated(booking);
        return booking;
    }

    @Transactional
    public PorterBooking onPaymentSuccess(UUID bookingId, UUID paymentId) {
        PorterBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found: " + bookingId));
        booking.setPaymentId(paymentId);
        booking.setStatus("PENDING_ACCEPTANCE");
        booking = bookingRepository.save(booking);
        startSupervisorTimer(bookingId);
        eventProducer.publishBookingCreated(booking);
        return booking;
    }

    @Transactional
    public PorterBooking acceptBooking(UUID bookingId, UUID porterId) {
        PorterBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!"PENDING_ACCEPTANCE".equals(booking.getStatus()))
            throw new RuntimeException("Booking is not in PENDING_ACCEPTANCE state");
        if (!bookingRepository.findActiveBookingsByPorter(porterId).isEmpty())
            throw new RuntimeException("Porter already has an active booking");

        booking.setPorterId(porterId);
        booking.setStatus("ACCEPTED");
        booking.setAcceptanceTime(Instant.now());
        booking = bookingRepository.save(booking);
        redisTemplate.delete(String.format(SUPERVISOR_TIMER_KEY, bookingId));
        eventProducer.publishBookingAssigned(booking);
        return booking;
    }

    @Transactional
    public PorterBooking startService(UUID bookingId, UUID porterId, String pinEntered) {
        PorterBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getPorterId().equals(porterId)) throw new RuntimeException("Unauthorized: porter mismatch");
        if (!"ACCEPTED".equals(booking.getStatus()))  throw new RuntimeException("Booking not in ACCEPTED state");
        if (!booking.getServicePin().equals(pinEntered)) throw new RuntimeException("Invalid service PIN");
        booking.setStatus("IN_PROGRESS");
        booking.setStartTime(Instant.now());
        return bookingRepository.save(booking);
    }

    @Transactional
    public PorterBooking completeService(UUID bookingId, UUID porterId) {
        PorterBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getPorterId().equals(porterId)) throw new RuntimeException("Unauthorized: porter mismatch");
        if (!"IN_PROGRESS".equals(booking.getStatus())) throw new RuntimeException("Booking not in IN_PROGRESS state");
        booking.setStatus("COMPLETED");
        booking.setCompletionTime(Instant.now());
        booking = bookingRepository.save(booking);
        porterRepository.findById(porterId).ifPresent(p -> {
            p.setTotalServices(p.getTotalServices() + 1);
            porterRepository.save(p);
        });
        eventProducer.publishBookingCompleted(booking);
        return booking;
    }

    @Transactional
    public PorterBooking cancelBooking(UUID bookingId, UUID requesterId, String requesterRole) {
        PorterBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        boolean isOwner = booking.getUserId().equals(requesterId);
        boolean isStaff = List.of("SUPERVISOR","STATION_CONTROL_ROOM","SUPERADMIN").contains(requesterRole);
        if (!isOwner && !isStaff) throw new RuntimeException("Unauthorized to cancel this booking");
        if (!List.of("PENDING_ACCEPTANCE","AWAITING_PAYMENT","ACCEPTED").contains(booking.getStatus()))
            throw new RuntimeException("Cannot cancel booking in status: " + booking.getStatus());
        booking.setStatus("CANCELLED");
        return bookingRepository.save(booking);
    }

    @Transactional
    public PorterRating rateBooking(UUID bookingId, UUID userId, int rating, String comment) {
        PorterBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getUserId().equals(userId)) throw new RuntimeException("Unauthorized");
        if (!"COMPLETED".equals(booking.getStatus())) throw new RuntimeException("Can only rate completed bookings");
        if (ratingRepository.findByBookingId(bookingId).isPresent()) throw new RuntimeException("Already rated");

        PorterRating pr = PorterRating.builder()
                .bookingId(bookingId).porterId(booking.getPorterId())
                .userId(userId).rating(rating).comment(comment).build();
        pr = ratingRepository.save(pr);

        Double avg = ratingRepository.findAverageRatingByPorterId(booking.getPorterId());
        if (avg != null) {
            porterRepository.findById(booking.getPorterId()).ifPresent(p -> {
                p.setAvgRating(new BigDecimal(avg).setScale(2, RoundingMode.HALF_UP));
                porterRepository.save(p);
            });
        }
        return pr;
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PORTER REGISTRATION (UPDATED — captures all onboarding fields)
    // ═════════════════════════════════════════════════════════════════════════

    @Transactional
    public Porter registerPorter(Map<String, Object> request) {
        UUID userId = UUID.fromString((String) request.get("userId"));
        String badge = (String) request.get("badgeNumber");

        if (porterRepository.existsByUserId(userId))
            throw new RuntimeException("Porter already registered for this user");
        if (porterRepository.existsByBadgeNumber(badge))
            throw new RuntimeException("Badge number already in use");

        // Parse optional dateOfBirth
        LocalDate dob = null;
        if (request.get("dateOfBirth") != null) {
            try { dob = LocalDate.parse(request.get("dateOfBirth").toString()); }
            catch (Exception e) { log.warn("Could not parse dateOfBirth: {}", request.get("dateOfBirth")); }
        }

        UUID onboardedBy = null;
        if (request.get("onboardedBy") != null) {
            try { onboardedBy = UUID.fromString((String) request.get("onboardedBy")); }
            catch (Exception ignored) {}
        }

        Porter porter = Porter.builder()
                .userId(userId)
                .badgeNumber(badge)
                .licenseId((String) request.get("licenseId"))
                .serviceType((String) request.getOrDefault("serviceType", "LUGGAGE_ONLY"))
                .zone((String) request.get("zone"))
                .stationId(DEFAULT_STATION_ID)
                // NEW profile fields
                .employeeId((String) request.get("employeeId"))
                .fullName((String) request.get("fullName"))
                .email((String) request.get("email"))
                .phone((String) request.get("phone"))
                .dateOfBirth(dob)
                .onboardedBy(onboardedBy)
                .build();

        return porterRepository.save(porter);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // STATUS / QUERIES
    // ═════════════════════════════════════════════════════════════════════════

    public void toggleOnlineStatus(UUID porterId, boolean online) {
        porterRepository.findById(porterId).ifPresent(p -> {
            p.setIsOnline(online); porterRepository.save(p);
        });
    }

    public List<PorterBooking> getBookingsByUser(UUID userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<PorterBooking> getBookingsByPorter(UUID porterId) {
        return bookingRepository.findByPorterIdOrderByCreatedAtDesc(porterId);
    }

    public List<PorterBooking> getPendingBookings() {
        return bookingRepository.findPendingBookings();
    }

    public List<PorterBooking> getUnassignedPendingBookings() {
        return bookingRepository.findUnassignedPendingBookings();
    }

    public List<Porter> getOnlinePorters() {
        return porterRepository.findByIsOnlineTrueAndIsActiveTrue();
    }

    // ── Offline porters for manual escalation dispatch ─────────────────────
    // Online porters already get a 15s auto-accept window before a booking
    // escalates to the supervisor queue — if they didn't take it there,
    // offering them again here is redundant. The manual-assign pool should
    // be the offline, active porters physically on duty without the app
    // open, who can only be dispatched by phone/radio.
    public List<Porter> getOfflinePorters() {
        return porterRepository.findByIsOnlineFalseAndIsActiveTrue();
    }

    public List<Porter> getAllPorters() {
        return porterRepository.findByIsActiveTrue();
    }

    /**
     * Active (ACCEPTED/IN_PROGRESS) bookings currently held by offline
     * porters, for the supervisor's "Manually Assigned Jobs" view.
     */
    public List<Map<String, Object>> getActiveOfflinePorterAssignments() {
        List<Object[]> rows = bookingRepository.findActiveBookingsForOfflinePortersRaw();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r[0]);
            m.put("bookingReference", r[1]);
            m.put("status", r[2]);
            m.put("serviceType", r[3]);
            m.put("pickupLocation", r[4]);
            m.put("destination", r[5]);
            m.put("passengerName", r[6]);
            m.put("passengerMobile", r[7]);
            m.put("totalAmount", r[8]);
            m.put("paymentMethod", r[9]);
            m.put("acceptanceTime", r[10]);
            m.put("startTime", r[11]);
            m.put("porterId", r[12]);
            m.put("porterName", r[13]);
            m.put("porterPhone", r[14]);
            m.put("porterBadge", r[15]);
            result.add(m);
        }
        return result;
    }

    /**
     * Supervisor marks a manually-dispatched job complete on behalf of a
     * porter who has no app access (that's the whole reason they were
     * manually dispatched in the first place — they can't call
     * /bookings/{id}/complete themselves).
     *
     * Unlike the porter's own completeService(), this doesn't require
     * IN_PROGRESS specifically — a supervisor confirming completion by
     * phone might be told the job finished even if the porter (with no
     * app) never had a way to trigger the ACCEPTED→IN_PROGRESS PIN step.
     * Either ACCEPTED or IN_PROGRESS is accepted as the starting state.
     */
    @Transactional
    public PorterBooking supervisorCompleteBooking(UUID bookingId, UUID supervisorId) {
        PorterBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!List.of("ACCEPTED", "IN_PROGRESS").contains(booking.getStatus())) {
            throw new RuntimeException("Booking is not active (status: " + booking.getStatus() + ")");
        }
        if (booking.getPorterId() == null) {
            throw new RuntimeException("Booking has no assigned porter");
        }

        Porter porter = porterRepository.findById(booking.getPorterId())
                .orElseThrow(() -> new RuntimeException("Assigned porter not found"));
        if (Boolean.TRUE.equals(porter.getIsOnline())) {
            // Online porters have app access — they should complete their
            // own jobs via the normal PIN-verified flow. This endpoint is
            // specifically the offline-porter fallback.
            throw new RuntimeException("Porter is online — ask them to complete the job from their app");
        }

        booking.setStatus("COMPLETED");
        booking.setCompletionTime(Instant.now());
        booking = bookingRepository.save(booking);

        porter.setTotalServices(porter.getTotalServices() + 1);
        porterRepository.save(porter);

        log.info("Supervisor {} marked booking {} complete on behalf of offline porter {}",
                supervisorId, bookingId, porter.getId());

        eventProducer.publishBookingCompleted(booking);
        return booking;
    }

    public Porter getPorterByUserId(UUID userId) {
        return porterRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Porter profile not found for user: " + userId));
    }

    // ═════════════════════════════════════════════════════════════════════════
    // DASHBOARD / EARNINGS (from previous fix)
    // ═════════════════════════════════════════════════════════════════════════

    public PorterDashboardDto getDashboard(UUID userId) {
        Porter porter = getPorterByUserId(userId);
        Instant startOfToday = LocalDate.now(IST).atStartOfDay(IST).toInstant();
        Instant startOfWeek  = LocalDate.now(IST).with(DayOfWeek.MONDAY).atStartOfDay(IST).toInstant();

        List<PorterBooking> todayJobs = bookingRepository.findCompletedByPorterSince(porter.getId(), startOfToday);
        List<PorterBooking> weekJobs  = bookingRepository.findCompletedByPorterSince(porter.getId(), startOfWeek);

        List<PorterBooking> activeList = bookingRepository.findActiveJobsByPorter(porter.getId());
        PorterBooking activeJob = activeList.isEmpty() ? null : activeList.get(0);

        return PorterDashboardDto.builder()
                .porterId(porter.getId().toString())
                .badgeNumber(porter.getBadgeNumber())
                .serviceType(porter.getServiceType())
                .zone(porter.getZone())
                .isOnline(Boolean.TRUE.equals(porter.getIsOnline()))
                .avgRating(porter.getAvgRating())
                .totalServices(porter.getTotalServices())
                .todayCompleted(todayJobs.size())
                .todayEarnings(sumTotalAmount(todayJobs))
                .weekCompleted(weekJobs.size())
                .weekEarnings(sumTotalAmount(weekJobs))
                .activeJob(activeJob)
                .pendingRequestsCount(bookingRepository.findPendingBookings().size())
                .build();
    }

    public Optional<PorterBooking> getActiveJob(UUID userId) {
        Porter porter = getPorterByUserId(userId);
        List<PorterBooking> active = bookingRepository.findActiveJobsByPorter(porter.getId());
        return active.isEmpty() ? Optional.empty() : Optional.of(active.get(0));
    }

    public EarningsDto getEarnings(UUID userId, String period) {
        Porter porter = getPorterByUserId(userId);
        Instant since = switch (period.toUpperCase()) {
            case "TODAY" -> LocalDate.now(IST).atStartOfDay(IST).toInstant();
            case "MONTH" -> LocalDate.now(IST).withDayOfMonth(1).atStartOfDay(IST).toInstant();
            default      -> LocalDate.now(IST).with(DayOfWeek.MONDAY).atStartOfDay(IST).toInstant();
        };
        List<PorterBooking> jobs = bookingRepository.findCompletedByPorterSince(porter.getId(), since);
        BigDecimal total = sumTotalAmount(jobs);
        long count = jobs.size();
        BigDecimal avg = count > 0 ? total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        BigDecimal cut = total.multiply(PLATFORM_FEE_RATE).setScale(2, RoundingMode.HALF_UP);
        return EarningsDto.builder()
                .period(period.toUpperCase()).completedJobs(count)
                .totalEarnings(total).avgPerJob(avg)
                .platformCut(cut).netEarnings(total.subtract(cut))
                .build();
    }

    public SupervisorDashboardDto getSupervisorDashboard() {
        Instant startOfToday = LocalDate.now(IST).atStartOfDay(IST).toInstant();
        return SupervisorDashboardDto.builder()
                .onlinePorters(porterRepository.countOnlineActive())
                .activePorters(porterRepository.countActive())
                .unassigned(bookingRepository.findUnassignedPendingBookings().size())
                .completed(bookingRepository.countAllCompletedSince(startOfToday))
                .pendingCod(bookingRepository.findPendingBookings().stream()
                        .filter(b -> "COD".equals(b.getPaymentMethod())).count())
                .build();
    }

    // ═════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═════════════════════════════════════════════════════════════════════════

    private void startSupervisorTimer(UUID bookingId) {
        redisTemplate.opsForValue().set(
                String.format(SUPERVISOR_TIMER_KEY, bookingId), "1", 15, TimeUnit.SECONDS);
    }

    /**
     * All 5 service types with accurate CRIS pricing.
     * Previously LUGGAGE_ONLY and WHEELCHAIR_ONLY fell through to the default.
     */
    private BigDecimal calculateBaseAmount(String serviceType) {
        return switch (serviceType) {
            case "LUGGAGE_ONLY"          -> BASE_LUGGAGE_ONLY;
            case "LUGGAGE_BARROW"        -> BASE_LUGGAGE_BARROW;
            case "WHEELCHAIR_ONLY"       -> BASE_WHEELCHAIR_ONLY;
            case "WHEELCHAIR_STRETCHER"  -> BASE_WHEELCHAIR_STRETCHER;
            case "COMBINED"              -> BASE_COMBINED;
            default                      -> BASE_LUGGAGE_ONLY;  // safe fallback
        };
    }

    private String generateBookingReference() {
        return "PB" + System.currentTimeMillis() % 100_000_000L
                + (char)('A' + new SecureRandom().nextInt(26));
    }

    private String generateServicePin() {
        return String.format("%04d", new SecureRandom().nextInt(10_000));
    }

    private BigDecimal sumTotalAmount(List<PorterBooking> bookings) {
        return bookings.stream()
                .map(PorterBooking::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    public List<PorterBookingDetailDto> getBookingsForUserWithPorterDetails(UUID userId) {
        List<Object[]> rows = bookingRepository.findByUserIdWithPorterDetailsRaw(userId);
        return rows.stream().map(r -> PorterBookingDetailDto.builder()
                .id(r[0]  != null ? UUID.fromString(r[0].toString()) : null)
                .bookingReference(str(r[1]))
                .userId(r[2]  != null ? UUID.fromString(r[2].toString()) : null)
                .porterId(r[3] != null ? UUID.fromString(r[3].toString()) : null)
                .serviceType(str(r[4]))
                .status(str(r[5]))
                .trainNumber(str(r[6]))
                .coachNumber(str(r[7]))
                .platform(str(r[8]))
                .pnrNumber(str(r[9]))
                .seatBerth(str(r[10]))
                .pickupLocation(str(r[11]))
                .destination(str(r[12]))
                .passengerName(str(r[13]))
                .passengerMobile(str(r[14]))
                .passengerEmail(str(r[15]))
                .specialInstructions(str(r[16]))
                .baseAmount(r[17] != null ? new java.math.BigDecimal(r[17].toString()) : null)
                .gstAmount(r[18]  != null ? new java.math.BigDecimal(r[18].toString()) : null)
                .totalAmount(r[19] != null ? new java.math.BigDecimal(r[19].toString()) : null)
                .paymentMethod(str(r[20]))
                .servicePin(str(r[22]))
                .bookingTime(toInstant(r[23]))
                .acceptanceTime(toInstant(r[24]))
                .startTime(toInstant(r[25]))
                .completionTime(toInstant(r[26]))
                .createdAt(toInstant(r[28]))
                // Porter contact — null until porter accepts (porterId is non-null)
                .porterName(str(r[29]))
                .porterPhone(str(r[30]))
                .porterBadge(str(r[31]))
                .porterZone(str(r[32]))
                .build()
        ).collect(Collectors.toList());
    }

    /**
     * Marks porter online/offline by their auth userId.
     * Called automatically from GET /api/porter/dashboard (app open = online).
     */
    public void setOnlineByUserId(UUID userId, boolean online) {
        porterRepository.findByUserId(userId).ifPresent(p -> {
            p.setIsOnline(online);
            porterRepository.save(p);
            log.info("Porter {} auto-marked {} (dashboard load)", p.getBadgeNumber(), online ? "ONLINE" : "OFFLINE");
        });
    }

    // ── Private mapping helpers ───────────────────────────────────────────────
    private static String str(Object o) { return o != null ? o.toString() : null; }

    private static java.time.Instant toInstant(Object o) {
        if (o == null) return null;
        if (o instanceof java.time.Instant) return (java.time.Instant) o;
        if (o instanceof java.sql.Timestamp) return ((java.sql.Timestamp) o).toInstant();
        try { return java.time.Instant.parse(o.toString()); } catch (Exception e) { return null; }
    }
}