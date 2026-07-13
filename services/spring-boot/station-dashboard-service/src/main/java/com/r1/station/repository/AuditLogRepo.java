package com.r1.station.repository;

import com.r1.station.entity.AuditLog;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

// ─── AuditLog Entity ─────────────────────────────────────────────────────────
// DROP AT: services/spring-boot/station-dashboard-service/src/main/java/com/r1/station/entity/AuditLog.java

// ─── DDL for the audit_logs table ────────────────────────────────────────────
// Run this migration in your schema init SQL:
//
// CREATE TABLE IF NOT EXISTS station_svc.audit_logs (
//   id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   service     TEXT NOT NULL,
//   actor_id    TEXT,
//   actor_name  TEXT,
//   role        TEXT,
//   action      TEXT NOT NULL,
//   resource    TEXT,
//   outcome     TEXT NOT NULL DEFAULT 'SUCCESS',
//   ip_address  TEXT,
//   created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
// );
// CREATE INDEX idx_audit_service ON station_svc.audit_logs(service);
// CREATE INDEX idx_audit_created  ON station_svc.audit_logs(created_at DESC);


// ─── AuditLogRepo ─────────────────────────────────────────────────────────────
// DROP AT: services/spring-boot/station-dashboard-service/src/main/java/com/r1/station/repository/AuditLogRepo.java

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
