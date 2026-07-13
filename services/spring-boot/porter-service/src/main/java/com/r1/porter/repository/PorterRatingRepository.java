package com.r1.porter.repository;

import com.r1.porter.entity.PorterRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PorterRatingRepository extends JpaRepository<PorterRating, UUID> {
    Optional<PorterRating> findByBookingId(UUID bookingId);

    @Query("SELECT AVG(r.rating) FROM PorterRating r WHERE r.porterId = :porterId")
    Double findAverageRatingByPorterId(UUID porterId);

    long countByPorterId(UUID porterId);
}
