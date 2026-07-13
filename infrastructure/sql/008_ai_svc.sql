-- ai_svc DDL (requires pgvector extension from 000_init_schemas.sql)

CREATE TABLE ai_svc.knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    category VARCHAR(50),
    source VARCHAR(100),
    language VARCHAR(5) DEFAULT 'en',
    embedding vector(384),
    ingested_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON ai_svc.knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE TABLE ai_svc.itineraries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    budget_min INT,
    budget_max INT,
    duration_days INT,
    interests TEXT[],
    itinerary_json JSONB NOT NULL,
    language VARCHAR(5) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_svc.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_key VARCHAR(100) UNIQUE NOT NULL,
    language VARCHAR(5) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);
