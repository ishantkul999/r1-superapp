# 🚆 R1 SuperApp – Smart Passenger Assistance Platform

R1 SuperApp is a microservices-based railway passenger assistance platform designed to enhance the travel experience at railway stations by providing digital access to porter booking, AI assistance, station facilities, SOS emergency support, notifications, and payment services.

The platform follows a hybrid microservices architecture using **Spring Boot** and **Node.js**, with **React** as the frontend.

> **Status:** MVP (Phase 1) – Under Active Development

---

# Features

### 👤 User
- OTP-based authentication
- Porter booking
- AI travel assistant (RAG powered)
- AI travel planner
- Profile management
- Booking history
- Notifications
- Station room booking
- Digital locker support (UI)
- PNR & Train information

### 🎒 Porter
- Receive booking requests
- Accept/Reject bookings
- Active trip management
- Earnings dashboard
- Profile management

### 👨‍💼 Supervisor
- Live porter monitoring
- Manual porter assignment
- Unassigned booking queue
- Porter directory
- Facility management

### 🚓 RPF
- SOS alerts
- Emergency incident management
- Live SOS map
- Incident history

### 🏢 Station Control
- Dashboard & analytics
- Broadcast notifications
- Staff onboarding
- Staff management
- Audit logs
- Facility management

### 🌐 Super Admin
- Station onboarding
- Global user management
- AI knowledge base
- System configuration
- Platform analytics

---

# System Architecture

```
                        React (Vite)
                              │
                              ▼
                  Spring Cloud Gateway
                              │
        ┌─────────────────────────────────────┐
        │                                     │
        ▼                                     ▼
 Spring Boot Services                 Node.js Services

• Auth Service                    • User Service
• API Gateway                     • SOS Service
• AI Assistant                    • Train Service
• AI Planner                      • Map Service
• Porter Service                  • Travel Service
• Payment Service                 • Tourism Service
• Notification Service            • Stay Service
• Station Dashboard               • Vendor Service
```

Communication:

- REST APIs
- Apache Kafka (Event-driven)
- Redis (Caching & OTP)
- PostgreSQL + pgvector
- JWT Authentication

---

# Tech Stack

## Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Cloud Gateway
- Spring Data JPA
- Hibernate
- Apache Kafka
- PostgreSQL
- Redis
- Maven

## AI

- Groq (Llama 3)
- Ollama
- pgvector (Vector Search)
- Retrieval Augmented Generation (RAG)

## Frontend

- React
- Vite
- React Router
- Axios
- Socket.IO Client

## Node.js Services

- Express.js
- Socket.IO
- PostgreSQL
- Kafka

## DevOps

- Docker
- Docker Compose
- Git
- GitHub

---

# Repository Structure

```
r1-superapp/

├── infrastructure/
│   ├── docker/
│   ├── env/
│   └── sql/
│
├── services/
│   ├── spring-boot/
│   │   ├── api-gateway/
│   │   ├── auth-service/
│   │   ├── porter-service/
│   │   ├── payment-service/
│   │   ├── notification-service/
│   │   ├── ai-assistant/
│   │   ├── ai-planner/
│   │   └── station-dashboard-service/
│   │
│   └── node/
│       ├── user-service/
│       ├── sos-service/
│       ├── train-service/
│       ├── map-service/
│       ├── travel-service/
│       ├── tourism-service/
│       ├── stay-service/
│       └── vendor-service/
│
├── r1_web_final/
├── HOW_TO_RUN.md
└── README.md
```

---

# Services

## Spring Boot

| Service | Port |
|----------|------|
| API Gateway | 8080 |
| Auth Service | 8081 |
| AI Planner | 8087 |
| AI Assistant | 8088 |
| Payment Service | 8090 |
| Porter Service | 8092 |
| Notification Service | 8093 |
| Station Dashboard | 8094 |

## Node.js

| Service | Port |
|----------|------|
| User Service | 3001 |
| Travel Service | 3003 |
| Tourism Service | 3004 |
| Stay Service | 3005 |
| SOS Service | 3006 |
| Map Service | 3010 |
| Train Service | 3011 |
| Vendor Service | 3012 |

---

# Infrastructure

- PostgreSQL
- Redis
- Apache Kafka
- Zookeeper
- Docker Compose

---

# Event-Driven Communication

Kafka is used for asynchronous communication between services.

Examples:

- User Registered
- OTP Events
- Porter Assigned
- Porter Completed
- Payment Success
- Notification Events
- SOS Triggered

---

# Authentication

- OTP Login
- JWT Authentication
- Refresh Tokens
- Role-Based Access Control (RBAC)

Supported Roles:

- USER
- PORTER
- SUPERVISOR
- RPF
- STATION_CONTROL
- SUPER_ADMIN

---

# AI Features

### AI Assistant

- Railway FAQs
- Station information
- RAG-powered responses
- Multi-language support

### AI Planner

- Personalized travel planning
- Station recommendations
- Context-aware itinerary generation

---

# Database

Database: PostgreSQL

Schemas:

- auth_svc
- user_svc
- porter_svc
- payment_svc
- station_svc
- notif_svc
- ai_svc
- audit_svc

---

# Configuration

The project uses environment variables for all sensitive information.

Examples:

- Database credentials
- Redis password
- JWT Secret
- Groq API Key
- Fast2SMS API Key
- Cashfree credentials
- Firebase credentials

Refer to:

```
infrastructure/env/.env.example
```

---

# Running the Project

Detailed setup instructions are available in:

```
HOW_TO_RUN.md
```

---

# Future Enhancements

- Indoor navigation
- Live train tracking
- Digital locker integration
- Cloak room booking
- Vendor marketplace
- Smart parking
- QR-based station services
- Voice-enabled AI assistant

---

# License

This project is intended for educational, research, and demonstration purposes.

---
