-- station_svc DDL

CREATE TABLE station_svc.facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    platform VARCHAR(10),
    status VARCHAR(20) DEFAULT 'OPEN',
    reason TEXT,
    estimated_resolution_mins INT,
    updated_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    station_id UUID NOT NULL
);

CREATE TABLE station_svc.station_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cris_room_id VARCHAR(100) UNIQUE,
    room_number VARCHAR(20) NOT NULL,
    room_type VARCHAR(30) NOT NULL,
    total_beds INT NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,
    amenities TEXT[],
    description TEXT,
    image_urls TEXT[],
    is_accessible BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    station_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE station_svc.station_room_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    cris_booking_ref VARCHAR(100),
    room_id UUID NOT NULL REFERENCES station_svc.station_rooms(id),
    user_id UUID NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    beds_booked INT DEFAULT 1,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_id UUID,
    status VARCHAR(20) DEFAULT 'PENDING',
    qr_code TEXT,
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE station_svc.digital_lockers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cris_locker_id VARCHAR(100) UNIQUE,
    locker_number VARCHAR(20) NOT NULL,
    size VARCHAR(10) NOT NULL,
    platform VARCHAR(10),
    location_description TEXT,
    price_per_6hr DECIMAL(10,2) NOT NULL,
    price_per_day DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    station_id UUID NOT NULL
);

CREATE TABLE station_svc.locker_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    cris_booking_ref VARCHAR(100),
    locker_id UUID NOT NULL REFERENCES station_svc.digital_lockers(id),
    user_id UUID NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_type VARCHAR(10) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_id UUID,
    status VARCHAR(20) DEFAULT 'PENDING',
    access_pin VARCHAR(4) NOT NULL,
    qr_code TEXT,
    locker_opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE station_svc.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    created_by UUID NOT NULL,
    station_id UUID NOT NULL,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
