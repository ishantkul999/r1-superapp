-- user_svc DDL

CREATE TABLE user_svc.profiles (
    user_id UUID PRIMARY KEY,
    full_name VARCHAR(100),
    avatar_url TEXT,
    email VARCHAR(255),
    gender VARCHAR(10),
    preferred_language VARCHAR(5) DEFAULT 'en',
    fcm_token TEXT,
    disability_type VARCHAR(50),
    mobility_aid VARCHAR(50),
    requires_wheelchair BOOLEAN DEFAULT FALSE,
    medical_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_svc.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_svc.profiles(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    relation VARCHAR(30) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_one_primary_contact ON user_svc.emergency_contacts(user_id) WHERE is_primary = TRUE;
