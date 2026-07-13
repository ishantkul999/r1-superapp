-- notif_svc DDL

CREATE TABLE notif_svc.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(30),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notif_svc.notifications(user_id);

CREATE TABLE notif_svc.sms_log (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20),
    provider VARCHAR(20) DEFAULT 'FAST2SMS',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);
