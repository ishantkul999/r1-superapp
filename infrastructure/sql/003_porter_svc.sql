-- porter_svc DDL

CREATE TABLE porter_svc.porters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    badge_number VARCHAR(20) UNIQUE NOT NULL,
    license_id VARCHAR(50),
    service_type VARCHAR(30) NOT NULL,
    zone VARCHAR(50),
    platforms TEXT[],
    is_online BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    avg_rating DECIMAL(3,2) DEFAULT 5.00,
    total_services INT DEFAULT 0,
    station_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE porter_svc.porter_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    porter_id UUID REFERENCES porter_svc.porters(id),
    service_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    train_number VARCHAR(10),
    coach_number VARCHAR(10),
    platform VARCHAR(10),
    pickup_location TEXT,
    destination TEXT,
    luggage_count INT,
    luggage_weight_kg DECIMAL(5,2),
    weight_tier VARCHAR(20),
    special_instructions TEXT,
    assistance_type VARCHAR(30),
    base_amount DECIMAL(10,2) NOT NULL,
    gst_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(10) NOT NULL,
    payment_id UUID,
    service_pin VARCHAR(64) NOT NULL,
    booking_time TIMESTAMPTZ DEFAULT NOW(),
    acceptance_time TIMESTAMPTZ,
    start_time TIMESTAMPTZ,
    completion_time TIMESTAMPTZ,
    station_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE porter_svc.supervisor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES porter_svc.porter_bookings(id),
    supervisor_id UUID NOT NULL,
    porter_id UUID NOT NULL,
    assignment_reason TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE porter_svc.porter_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID UNIQUE NOT NULL REFERENCES porter_svc.porter_bookings(id),
    porter_id UUID NOT NULL,
    user_id UUID NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
