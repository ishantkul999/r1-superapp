# R1 Super App — Complete Setup & Run Guide

## Project Structure
```
r1-superapp/
├── infrastructure/
│   ├── docker/docker-compose.yml    ← PostgreSQL + Redis + Kafka
│   ├── sql/                         ← All DDL + seed data (run in order)
│   └── env/.env.example             ← Copy to .env and fill keys
├── services/
│   ├── spring-boot/                 ← 8 Java microservices
│   │   ├── api-gateway      :8080
│   │   ├── auth-service     :8081
│   │   ├── payment-service  :8090
│   │   ├── porter-service   :8092
│   │   ├── notification-service :8093
│   │   ├── station-dashboard-service :8094
│   │   ├── ai-planner       :8087
│   │   └── ai-assistant     :8088
│   └── node/                        ← 8 Node.js services
│       ├── user-service     :3001
│       ├── sos-service      :3006
│       ├── map-service      :3010
│       ├── train-service    :3011
│       └── (4 Phase 2 scaffolds)
├── r1_web_final/                    ← React + Vite frontend
└── r1_flutter_final/               ← Flutter mobile app
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Java | 21+ | https://adoptium.net |
| Maven | 3.9+ | https://maven.apache.org |
| Node.js | 20+ | https://nodejs.org |
| Docker Desktop | latest | https://docker.com |
| Flutter | 3.19+ | https://flutter.dev |
| PostgreSQL | 16 (or via Docker) | included in docker-compose |

---

## Step 1 — Infrastructure (PostgreSQL + Redis + Kafka)

```bash
cd infrastructure/docker
docker compose up -d

# Wait ~30s for all services to start, then verify:
docker ps
# You should see: r1_postgres, r1_redis, r1_kafka, r1_zookeeper, r1_kafka_ui
```

### Kafka UI (optional)
Visit http://localhost:8085 to browse Kafka topics.

---

## Step 2 — Database Setup

**Option A — If you used Docker PostgreSQL above:**
The SQL files are mounted and auto-run at startup.

**Option B — If you have local PostgreSQL:**
```bash
# Create database and user first:
psql -U postgres -c "CREATE USER r1user WITH PASSWORD 'r1password';"
psql -U postgres -c "CREATE DATABASE r1superapp OWNER r1user;"

# Run SQL files in order:
cd infrastructure/sql
psql -U r1user -d r1superapp -f 000_init_schemas.sql
psql -U r1user -d r1superapp -f 001_auth_svc.sql
psql -U r1user -d r1superapp -f 002_user_svc.sql
psql -U r1user -d r1superapp -f 003_porter_svc.sql
psql -U r1user -d r1superapp -f 004_payment_svc.sql
psql -U r1user -d r1superapp -f 005_sos_svc.sql
psql -U r1user -d r1superapp -f 006_station_svc.sql
psql -U r1user -d r1superapp -f 007_train_svc.sql
psql -U r1user -d r1superapp -f 008_ai_svc.sql
psql -U r1user -d r1superapp -f 009_notif_svc.sql
psql -U r1user -d r1superapp -f 010_audit_svc.sql
psql -U r1user -d r1superapp -f 011_seed_data.sql
```

---

## Step 3 — Environment Variables

```bash
cp infrastructure/env/.env.example .env
```

**Minimum required for local dev (everything else is stubbed):**
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=r1superapp
POSTGRES_USER=r1user
POSTGRES_PASSWORD=r1password
REDIS_HOST=localhost
REDIS_PASSWORD=r1redispass
KAFKA_BROKERS=localhost:9092
JWT_SECRET=dev-jwt-secret-change-in-production-must-be-256-bit
INTERNAL_EVENTS_SECRET=dev-internal-secret
OTP_DEV_MODE=true
DEV_OTP=123456
```

> **Note:** All API keys (CRIS, NTES, Cashfree, OpenAI, Firebase) are STUBBED.
> The app runs fully without them. Add real keys when available.

---

## Step 4 — Spring Boot Services

Start them in this order (gateway last is fine, but auth first):

```bash
# Terminal 1: Auth Service
cd services/spring-boot/auth-service
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-DPOSTGRES_HOST=localhost -DPOSTGRES_PASSWORD=r1password -DREDIS_PASSWORD=r1redispass -DKAFKA_BROKERS=localhost:9092 -DJWT_SECRET=dev-jwt-secret-change-in-production-must-be-256-bit"

# Terminal 2: User Service (Node — start before other Spring Boot services)
cd services/node/user-service && npm install && node src/index.js

# Terminal 3: Porter Service
cd services/spring-boot/porter-service
mvn spring-boot:run

# Terminal 4: Payment Service
cd services/spring-boot/payment-service
mvn spring-boot:run

# Terminal 5: Station Dashboard
cd services/spring-boot/station-dashboard-service
mvn spring-boot:run

# Terminal 6: Notification Service
cd services/spring-boot/notification-service
mvn spring-boot:run

# Terminal 7: AI Planner
cd services/spring-boot/ai-planner
mvn spring-boot:run

# Terminal 8: AI Assistant
cd services/spring-boot/ai-assistant
mvn spring-boot:run

# Terminal 9: API Gateway (start after all others)
cd services/spring-boot/api-gateway
mvn spring-boot:run
```

**Quick health check:**
```bash
curl http://localhost:8080/actuator/health   # Gateway
curl http://localhost:8081/actuator/health   # Auth
curl http://localhost:8092/actuator/health   # Porter
```

---

## Step 5 — Node.js Services

```bash
# SOS Service (Socket.io)
cd services/node/sos-service && npm install && node src/index.js

# Train Service (NTES stub)
cd services/node/train-service && npm install && node src/index.js

# Map Service (GeoJSON)
cd services/node/map-service && npm install && node src/index.js

# Phase 2 scaffolds (optional, just return "coming_soon")
cd services/node/travel-service && npm install && node src/index.js
cd services/node/tourism-service && npm install && node src/index.js
```

---

## Step 6 — React Web App

```bash
cd r1_web_final
npm install

# Create .env.local
echo "VITE_API_BASE_URL=http://localhost:8080" > .env.local
echo "VITE_SOCKET_URL=http://localhost:3006" >> .env.local

npm run dev
# → Open http://localhost:5173
```

---

## Step 7 — Flutter App

```bash
cd r1_flutter_final
flutter pub get

# For Android emulator (maps to localhost automatically):
flutter run

# For physical device (replace with your computer's LAN IP):
flutter run --dart-define=API_BASE_URL=http://192.168.1.X:8080 --dart-define=SOCKET_URL=http://192.168.1.X:3006

# For iOS simulator:
flutter run --dart-define=API_BASE_URL=http://localhost:8080
```

---

## Demo Login

All accounts use OTP: **123456** (dev mode)

| Role | Phone | Dashboard |
|------|-------|-----------|
| Passenger | +919000000001 | `/user` |
| Porter | +919000000002 | `/porter` |
| Supervisor | +919000000003 | `/supervisor` |
| RPF Officer | +919000000004 | `/rpf` |
| Station Control | +919000000005 | `/station-control` |
| Super Admin | +919000000006 | `/superadmin` |

> These users need to be created first via the OTP flow — they auto-register on first login.

---

## API Keys — When You Have Them

Update `.env` or set as environment variables:

```env
# CRIS (Station Rooms & Lockers)
CRIS_API_KEY=your-key
CRIS_API_BASE_URL=https://api.cris.org.in/v1

# NTES (PNR & Train Status)
NTES_API_KEY=your-key
NTES_API_BASE_URL=https://api.railwayapi.site

# OpenAI (AI Planner + Assistant)
OPENAI_API_KEY=sk-your-key

# Cashfree (Payments)
CASHFREE_APP_ID=your-app-id
CASHFREE_SECRET=your-secret
CASHFREE_ENV=TEST

# Fast2SMS (OTP delivery)
FAST2SMS_API_KEY=your-key

# Firebase (Push notifications)
FIREBASE_SERVICE_ACCOUNT=base64-encoded-json
```

Set `OTP_DEV_MODE=false` to enable real OTP delivery.

---

## Kafka Topics Created Automatically

| Topic | Producer | Consumer |
|-------|----------|---------|
| `auth.registered` | auth-service | user-service |
| `payment.success` | payment-service | porter-service, station-dashboard, notification |
| `payment.failed` | payment-service | notification |
| `payment.refund` | payment-service | notification |
| `porter.booked` | porter-service | notification |
| `porter.assigned` | porter-service | notification |
| `porter.completed` | porter-service | notification |
| `sos.triggered` | sos-service (via gateway bridge) | notification |
| `audit.events` | all services | (future audit consumer) |
| `ai.knowledge.ingested` | ai-planner | (future) |

---

## Troubleshooting

**Port already in use:**
```bash
lsof -ti:8080 | xargs kill -9
```

**PostgreSQL connection refused:**
```bash
docker logs r1_postgres
# If not running: docker start r1_postgres
```

**Kafka not connecting:**
```bash
docker logs r1_kafka
# Wait 30s after docker compose up before starting Spring Boot services
```

**Flutter build errors:**
```bash
flutter clean && flutter pub get && flutter run
```

**Maven dependency errors:**
```bash
mvn dependency:resolve
mvn clean install -DskipTests
```
