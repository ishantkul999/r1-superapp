-- audit_svc DDL (partitioned by month)

CREATE TABLE audit_svc.audit_logs (
    id BIGSERIAL,
    event_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    actor_user_id UUID,
    actor_role VARCHAR(30),
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(40),
    entity_id UUID,
    source_service VARCHAR(40) NOT NULL,
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(45),
    device_info TEXT,
    status VARCHAR(10) DEFAULT 'SUCCESS',
    station_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_svc.audit_logs_2026_06 PARTITION OF audit_svc.audit_logs
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE audit_svc.audit_logs_2026_07 PARTITION OF audit_svc.audit_logs
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE audit_svc.audit_logs_2026_08 PARTITION OF audit_svc.audit_logs
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE audit_svc.audit_logs_2026_09 PARTITION OF audit_svc.audit_logs
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE audit_svc.audit_logs_2026_10 PARTITION OF audit_svc.audit_logs
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE audit_svc.audit_logs_2026_11 PARTITION OF audit_svc.audit_logs
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE audit_svc.audit_logs_2026_12 PARTITION OF audit_svc.audit_logs
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');
