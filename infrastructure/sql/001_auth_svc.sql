-- auth_svc DDL

CREATE TABLE auth_svc.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    email VARCHAR(255),
    role VARCHAR(30) NOT NULL DEFAULT 'USER',
    google_sub VARCHAR(255),
    google_email VARCHAR(255),
    station_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth_svc.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth_svc.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth_svc.otp_audit (
    id BIGSERIAL PRIMARY KEY,
    phone VARCHAR(15) NOT NULL,
    status VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE consent_svc.consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth_svc.users(id) ON DELETE CASCADE,
    consent_type VARCHAR(40) NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT TRUE,
    version VARCHAR(10) NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    withdrawn_at TIMESTAMPTZ
);
