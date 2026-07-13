package com.r1.payment.repository;

import com.r1.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByCfOrderId(String cfOrderId);
    List<Payment> findByBookingIdAndBookingType(UUID bookingId, String bookingType);
    List<Payment> findByUserId(UUID userId);
}
