package com.r1.notification.repository;

import com.r1.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * REPLACE the existing NotificationRepository.java.
 *
 * DROP AT:
 *   services/spring-boot/notification-service/src/main/java/com/r1/notification/repository/NotificationRepository.java
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndIsReadFalse(UUID userId);

    /**
     * Bulk mark-all-read for one user.
     * Called by PUT /api/notifications/mark-all-read
     * Returns number of rows updated.
     */
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    int markAllReadForUser(UUID userId);
}
