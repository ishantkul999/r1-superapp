-- Seed data for R1 Super App

-- Default station: Ahmedabad Junction (ADI)
INSERT INTO auth_svc.users (id, phone, name, email, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '+910000000000',
    'Super Admin',
    'superadmin@r1app.in',
    'SUPERADMIN',
    true
) ON CONFLICT DO NOTHING;

-- Facilities at ADI (Ahmedabad Junction)
DO $$
DECLARE
    station_id UUID := '00000000-0000-0000-0000-100000000001';
BEGIN
    INSERT INTO station_svc.facilities (name, type, platform, status, station_id) VALUES
    ('Restroom P1 Male', 'RESTROOM', '1', 'OPEN', station_id),
    ('Restroom P1 Female', 'RESTROOM', '1', 'OPEN', station_id),
    ('Restroom P1 PwD', 'RESTROOM_PWD', '1', 'OPEN', station_id),
    ('Restroom P3 Male', 'RESTROOM', '3', 'OPEN', station_id),
    ('Restroom P3 Female', 'RESTROOM', '3', 'OPEN', station_id),
    ('Digital Locker Zone A', 'LOCKER', '1', 'OPEN', station_id),
    ('Digital Locker Zone B', 'LOCKER', '4', 'OPEN', station_id),
    ('First Aid Center', 'FIRST_AID', 'Main', 'OPEN', station_id),
    ('ATM - SBI', 'ATM', 'Main', 'WORKING', station_id),
    ('ATM - ICICI', 'ATM', '1', 'WORKING', station_id),
    ('Canteen - IRCTC', 'FOOD_STALL', 'Main', 'OPEN', station_id),
    ('Food Stall P3', 'FOOD_STALL', '3', 'OPEN', station_id),
    ('Water Kiosk P1', 'WATER_KIOSK', '1', 'WORKING', station_id),
    ('Water Kiosk P3', 'WATER_KIOSK', '3', 'WORKING', station_id),
    ('Cloak Room', 'LOCKER', 'Main', 'OPEN', station_id)
    ON CONFLICT DO NOTHING;

    -- Sample station rooms
    INSERT INTO station_svc.station_rooms (cris_room_id, room_number, room_type, total_beds, price_per_night, amenities, station_id) VALUES
    ('CRIS-ADI-R001', 'R-001', 'RETIRING_ROOM_AC', 1, 600.00, ARRAY['AC', 'TV', 'Attached Bathroom', 'WiFi'], station_id),
    ('CRIS-ADI-R002', 'R-002', 'RETIRING_ROOM_AC', 1, 600.00, ARRAY['AC', 'TV', 'Attached Bathroom', 'WiFi'], station_id),
    ('CRIS-ADI-R003', 'R-003', 'RETIRING_ROOM_NONAC', 1, 350.00, ARRAY['Fan', 'TV', 'Attached Bathroom'], station_id),
    ('CRIS-ADI-R004', 'R-004', 'RETIRING_ROOM_NONAC', 1, 350.00, ARRAY['Fan', 'TV', 'Attached Bathroom'], station_id),
    ('CRIS-ADI-D001', 'DORM-M-1', 'DORMITORY_MALE', 8, 120.00, ARRAY['Fan', 'Locker', 'Common Bathroom'], station_id),
    ('CRIS-ADI-D002', 'DORM-F-1', 'DORMITORY_FEMALE', 8, 120.00, ARRAY['Fan', 'Locker', 'Common Bathroom'], station_id)
    ON CONFLICT DO NOTHING;

    -- Sample digital lockers
    INSERT INTO station_svc.digital_lockers (cris_locker_id, locker_number, size, platform, location_description, price_per_6hr, price_per_day, station_id) VALUES
    ('CRIS-ADI-L001', 'L-001', 'SMALL', '1', 'Near Platform 1 Exit', 30.00, 50.00, station_id),
    ('CRIS-ADI-L002', 'L-002', 'SMALL', '1', 'Near Platform 1 Exit', 30.00, 50.00, station_id),
    ('CRIS-ADI-L003', 'L-003', 'MEDIUM', '1', 'Near Platform 1 Exit', 50.00, 80.00, station_id),
    ('CRIS-ADI-L004', 'L-004', 'LARGE', '1', 'Near Platform 1 Exit', 80.00, 120.00, station_id),
    ('CRIS-ADI-L005', 'L-005', 'SMALL', '4', 'Near Platform 4 Waiting Room', 30.00, 50.00, station_id),
    ('CRIS-ADI-L006', 'L-006', 'MEDIUM', '4', 'Near Platform 4 Waiting Room', 50.00, 80.00, station_id),
    ('CRIS-ADI-L007', 'L-007', 'LARGE', 'Main', 'Main Entrance Cloak Room', 80.00, 120.00, station_id)
    ON CONFLICT DO NOTHING;
END $$;

-- Knowledge base entries for AI assistant
INSERT INTO ai_svc.knowledge_base (content, category, source, language) VALUES
('Porter service at Ahmedabad Junction (ADI) costs Rs 100.30 for luggage up to 40kg (base Rs 85 + 18% GST). Barrow service for 40-160kg costs Rs 159.30. Wheelchair assistance (2-person) costs Rs 159.30. Combined luggage + wheelchair costs Rs 259.60.', 'PORTER', 'R1 Internal', 'en'),
('To book a porter at ADI, open the R1 app, tap Porter, select your service type (Luggage/Wheelchair/Combined), enter your train number and platform, and choose payment (online or cash on delivery).', 'PORTER', 'R1 Internal', 'en'),
('Station retiring rooms at Ahmedabad Junction: AC rooms Rs 500-700/night, Non-AC rooms Rs 300-400/night, Dormitory Rs 100-150/bed. Cancellation: 100% refund 48+ hours before, 75% for 24-48 hours, 50% for 12-24 hours, 0% within 12 hours.', 'ROOMS', 'R1 Internal', 'en'),
('Digital lockers at ADI: Small (30x30x50cm) Rs 30 for 6hrs / Rs 50/day. Medium (45x45x60cm) Rs 50 for 6hrs / Rs 80/day. Large (60x60x80cm) Rs 80 for 6hrs / Rs 120/day. No refund after locker is opened.', 'LOCKERS', 'R1 Internal', 'en'),
('For emergency at Ahmedabad Junction, press the red SOS button in the R1 app for 3 seconds. RPF (Railway Protection Force) will be notified within 5 seconds. Your emergency contacts will also receive SMS alerts.', 'SOS', 'R1 Internal', 'en'),
('Ahmedabad Junction (ADI) is a major railway station in Gujarat, India. It connects to Mumbai, Delhi, Jaipur, Kolkata and other major cities. The station has 10 platforms.', 'GENERAL', 'R1 Internal', 'en'),
('ADI पर पोर्टर सेवा: 40kg तक के सामान के लिए Rs 100.30 (85 + 18% GST). बुक करने के लिए R1 ऐप खोलें और पोर्टर बुक करें। नकद भुगतान (COD) का विकल्प भी उपलब्ध है।', 'PORTER', 'R1 Internal', 'hi'),
('ADI ખાતે પોર્ટર સેવા: 40kg સુધીના સામાન માટે Rs 100.30 (85 + 18% GST). R1 એપ ખોલો અને પોર્ટર બૂક કરો. રોકડ ચૂકવણી (COD)નો વિકલ્પ પણ ઉપલબ્ધ છે.', 'PORTER', 'R1 Internal', 'gu')
ON CONFLICT DO NOTHING;
