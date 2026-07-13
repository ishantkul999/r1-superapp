-- sos_svc DDL

CREATE TABLE sos_svc.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_reference VARCHAR(20) UNIQUE,
    user_id UUID NOT NULL,
    alert_type VARCHAR(20) DEFAULT 'GENERAL',
    description TEXT,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    lat DECIMAL(10,7),
    lng DECIMAL(10,7),
    source VARCHAR(20) DEFAULT 'ONLINE',
    rpf_officer_id UUID,
    rpf_notes TEXT,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    station_id UUID
);

CREATE TABLE sos_svc.location_trail (
    id BIGSERIAL PRIMARY KEY,
    alert_id UUID NOT NULL REFERENCES sos_svc.alerts(id) ON DELETE CASCADE,
    lat DECIMAL(10,7) NOT NULL,
    lng DECIMAL(10,7) NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sos_alerts_status ON sos_svc.alerts(status);
CREATE INDEX idx_sos_alerts_user ON sos_svc.alerts(user_id);
