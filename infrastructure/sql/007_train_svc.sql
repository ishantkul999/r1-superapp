-- train_svc DDL
CREATE TABLE train_svc.pnr_cache (
    pnr_no VARCHAR(10) PRIMARY KEY,
    response_json JSONB NOT NULL,
    cached_at TIMESTAMPTZ DEFAULT NOW()
);
