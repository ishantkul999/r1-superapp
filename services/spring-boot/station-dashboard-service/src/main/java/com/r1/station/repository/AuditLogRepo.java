package com.r1.station.repository;

import com.r1.station.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AuditLogRepo extends JpaRepository<AuditLog, UUID> {

    @Query("SELECT a.id, a.createdAt, a.service, a.actorId, a.actorName, " +
            "a.role, a.action, a.resource, a.outcome, a.ipAddress " +
            "FROM AuditLog a ORDER BY a.createdAt DESC")
    List<Object[]> findAllLogs(Pageable pageable);

    @Query("SELECT a.id, a.createdAt, a.service, a.actorId, a.actorName, " +
            "a.role, a.action, a.resource, a.outcome, a.ipAddress " +
            "FROM AuditLog a WHERE a.service = :service ORDER BY a.createdAt DESC")
    List<Object[]> findLogsByService(String service, Pageable pageable);
}
