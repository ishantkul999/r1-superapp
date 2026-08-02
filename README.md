# R1 SuperApp — Smart Passenger Assistance Platform
 
A microservices-based passenger assistance platform for Indian Railways stations, built as part of a backend development internship focused on Java/Spring Boot service design, event-driven architecture, and applied AI integration.
 
**Project status: Minimum Viable Product (MVP).** Core passenger and operations workflows are fully implemented and functional end to end. Third-party integrations beyond the AI layer (payment gateway, live railway data, SMS/push delivery, mapping, and station facility booking systems) are scoped for Phase 2 and are not yet connected to external providers — see Current MVP Scope and Phase 2 Roadmap below for the exact boundary.
 
---
 
## Table of Contents
 
- [Overview](#overview)
- [My Role and Contributions](#my-role-and-contributions)
- [Architecture](#architecture)
- [Spring Boot Microservices](#spring-boot-microservices)
- [Node.js Services](#nodejs-services)
- [Database Design](#database-design)
- [Event-Driven Architecture (Kafka)](#event-driven-architecture-kafka)
- [AI Architecture](#ai-architecture)
- [Technology Stack](#technology-stack)
- [MVP Features](#mvp-features)
- [Current MVP Scope](#current-mvp-scope)
- [Phase 2 Roadmap](#phase-2-roadmap)
- [API Documentation](#api-documentation)
- [Repository Structure](#repository-structure)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [License](#license)
---
 
## Overview
 
R1 SuperApp is a hybrid microservices platform designed to improve the end-to-end passenger experience at railway stations, using Ahmedabad Junction (ADI) as the reference deployment station. The platform combines Java/Spring Boot and Node.js/Express services behind a Spring Cloud Gateway, covering authentication, porter booking and dispatch, AI-assisted passenger support, station operations, emergency response, and asynchronous notification delivery.
 
The system is built around a clear separation of concerns: Spring Boot owns the transactional, business-critical domains (authentication, porter bookings, payments, notifications, AI, station administration), while Node.js services handle lighter-weight, I/O-bound concerns (real-time communication, mapping, tourism and travel data, vendor listings). Kafka connects both runtimes as a shared event bus, so a Spring Boot service and a Node.js service can react to the same domain event without being directly coupled to one another.
 
## My Role and Contributions
 
As the backend engineer on this project, I designed and implemented all eight Spring Boot microservices independently, including:
 
- Service boundaries and domain modeling across authentication, porter operations, payments, notifications, AI, and station administration.
- The porter booking lifecycle end to end: booking creation, a time-boxed automatic acceptance window for online porters, supervisor-driven manual escalation and dispatch to offline porters, PIN-verified service start, and completion.
- The API Gateway's routing and JWT-based authentication propagation to all downstream services.
- Kafka producer/consumer integration across every Spring Boot service, coordinating with the Node.js services on shared event contracts.
- The AI layer, built on Spring AI, integrating a locally-run Ollama embedding model with Groq-hosted LLM inference behind a single Retrieval-Augmented Generation (RAG) pipeline backed by PostgreSQL and pgvector.
- Database schema design across eight isolated PostgreSQL schemas, one per service domain, including indexing decisions for the highest-traffic query paths.
- Connection pool, thread pool, and caching tuning informed by load testing (k6) against realistic passenger-arrival burst traffic patterns rather than flat average-throughput assumptions.
## Architecture
 
```text
                                React (Vite)
                                     |
                                     v
                         Spring Cloud Gateway
                                     |
              +----------------------+----------------------+
              |                                             |
              v                                             v
       Spring Boot Services                         Node.js Services
 
       API Gateway                                  User Service
       Auth Service                                 SOS Service
       Porter Service                                Train Service
       Payment Service                               Map Service
       Notification Service                          Travel Service
       AI Planner                                    Tourism Service
       AI Assistant                                  Stay Service
       Station Dashboard                             Vendor Service
 
                              |
                              v
                      Apache Kafka Event Bus
                              |
                              v
             PostgreSQL (Multi-Schema) + Redis + pgvector
```
 
## Spring Boot Microservices
 
All eight Spring Boot services were designed and implemented as independent, individually deployable Maven modules, each owning its own database schema and communicating with other services exclusively through the API Gateway (synchronous) or Kafka (asynchronous).
 
| Service | Responsibility |
|---|---|
| API Gateway | Central request routing, JWT validation and identity propagation to downstream services, CORS policy, Swagger aggregation |
| Auth Service | OTP-based authentication, Google OAuth, JWT issuance, refresh token rotation, consent tracking |
| Porter Service | Full booking lifecycle management, automatic and supervisor-driven porter allocation, offline porter dispatch, service PIN verification, ratings |
| Payment Service | Payment workflow and transaction state management (cash-on-delivery operational in MVP; gateway integration scoped for Phase 2) |
| Notification Service | Kafka-driven notification generation and persistence, real-time delivery via Socket.IO bridge |
| AI Planner | Retrieval-Augmented Generation pipeline for personalized, budget- and interest-aware travel itinerary generation |
| AI Assistant | Spring AI conversational assistant grounded in the shared pgvector knowledge base, with session-based conversational memory |
| Station Dashboard | Station operations, staff onboarding, analytics, and administrative functions across roles (supervisor, RPF, station control room, super admin) |
 
## Node.js Services
 
Node.js/Express services handle real-time and I/O-bound concerns that do not require the transactional guarantees of the Spring Boot layer:
 
- **User Service** — passenger profile and preference management
- **SOS Service** — emergency alert handling and the Socket.IO bridge for real-time event delivery across the platform
- **Train Service** — PNR and train status lookups
- **Map Service** — station and city mapping support
- **Travel Service** — travel-related data aggregation
- **Tourism Service** — local attraction and points-of-interest data
- **Stay Service** — retiring room and station accommodation data
- **Vendor Service** — station vendor and facility listings
## Database Design
 
PostgreSQL is used with schema-based separation, giving each service domain an isolated namespace within a single database instance:
 
- `auth_svc` — users, refresh tokens, OTP audit trail, consent records
- `porter_svc` — porters, bookings, ratings, supervisor assignments
- `payment_svc` — payments, refunds, cash-on-delivery reconciliation
- `notif_svc` — notifications, SMS delivery log
- `station_svc` — stations, facilities, digital lockers, retiring rooms, staff onboarding, audit logs, announcements
- `ai_svc` — vector store (pgvector), generated itineraries, chat sessions
- `user_svc` — passenger profiles, emergency contacts
- `audit_svc` — cross-service alerting and location trail data for emergency response
Referential integrity between related tables is enforced at the database level via foreign key constraints, not solely at the application layer. Indexing was applied deliberately to the highest-traffic query paths identified through load testing — most notably porter/booking lookups by user, porter, and status, and notification queries filtered by user and read state.
 
## Event-Driven Architecture (Kafka)
 
The platform uses Apache Kafka for asynchronous communication between Spring Boot and Node.js services, decoupling event producers from consumers and allowing background processing without blocking client-facing requests.
 
```text
                        Service A
                            |
                     Publish Event
                            |
                            v
                     Apache Kafka Broker
                            |
          +-----------------+-----------------+
          v                 v                 v
     Notification       Payment            Porter
       Service          Service            Service
          |                 |                 |
          +----------> Other Consumers <------+
```
 
### Kafka Event Flows
 
**Authentication**
OTP Generated, OTP Verified, User Registered
 
**Porter Operations**
Booking Created, Porter Assigned, Booking Accepted, Booking Started, Booking Completed, Booking Cancelled, Supervisor Assignment
 
**Payments**
Payment Initiated, Payment Successful, Payment Failed, Refund Processed
 
**Notifications**
Notification Created, Booking Status Updates, Broadcast Messages, System Alerts
 
**Emergency Services**
SOS Triggered, Live Location Updates, Incident Resolved
 
**AI Services**
Knowledge Base Document Ingested
 
### Benefits Realized
 
- Loose coupling between the Spring Boot and Node.js runtimes
- Non-blocking, asynchronous notification delivery
- Independent scalability per service
- Consumer-level fault isolation — a failure in one consumer does not affect producers or other consumers
- Straightforward extensibility for new consumers of existing event types
## AI Architecture
 
The AI layer is built on **Spring AI**, combining local semantic vector search with Retrieval-Augmented Generation to ground both the conversational assistant and the trip planner in verified station and city data, rather than relying on unconstrained language model output.
 
```text
                       User Query
                            |
                            v
                Spring AI Embedding Model (Ollama)
                            |
                            v
                  Vector Embedding Generation
                            |
                            v
             pgvector Semantic Similarity Search
                            |
                  Relevant Knowledge Retrieved
                            |
                            v
           Retrieval-Augmented Generation (RAG)
                            |
                            v
                   Groq (Llama 3) Inference
                            |
                            v
              AI Response / Travel Itinerary
```
 
Chat inference and embedding generation are deliberately split across two providers through Spring AI's model-selection configuration: Groq (an OpenAI-compatible hosted API) handles language generation, while embeddings are generated locally via Ollama, avoiding both per-token embedding costs and any dependency on an external embedding provider. Both the AI Assistant and AI Planner services share a single pgvector-backed knowledge base, so a fact added once (station pricing, facility hours, local attractions) is immediately available to both services without duplicated ingestion.
 
### AI Technologies
 
- Spring AI
- Retrieval-Augmented Generation (RAG)
- Vector embeddings and cosine similarity search
- PostgreSQL with pgvector
- Groq (Llama 3) for chat inference
- Ollama for local embedding generation
- Multi-turn conversational memory (Redis-backed session state)
### AI Capabilities
 
- Context-aware conversational assistant grounded in a maintained knowledge base
- Railway and station information retrieval (facility pricing, hours, procedures)
- Semantic knowledge search across ingested documents
- Personalized, budget- and interest-aware travel itinerary generation
- Accessibility-aware recommendations
- Local and cloud LLM support in a single pipeline
## Technology Stack
 
### Backend
- Java 21
- Spring Boot
- Spring Security
- Spring Cloud Gateway
- Spring Data JPA / Hibernate
- Spring AI
- Apache Kafka
### Frontend
- React
- Vite
- React Router
- Axios
### Node.js
- Express.js
- Socket.IO
### Database
- PostgreSQL
- pgvector
- Redis
### DevOps
- Docker
- Docker Compose
- Git / GitHub
## MVP Features
 
### Passenger
- Google OAuth and OTP-based authentication
- Porter booking with real-time status tracking
- AI Assistant for station and travel queries
- AI-powered personalized trip planner
- Booking history
- Real-time notifications
- User profile management
- Train and PNR information lookup
### Operations
- Porter dashboard
- Supervisor dashboard, including manual dispatch to offline porters when no porter accepts within the automatic allocation window
- Station control room dashboard
- Station analytics
- Staff onboarding
- RPF (Railway Protection Force) dashboard
- Super Admin dashboard, including AI knowledge base management
## Current MVP Scope
 
**Implemented and functional:**
- Authentication (OTP and Google OAuth)
- Porter booking, allocation, and supervisor escalation workflow
- AI Assistant and AI Planner (Groq for inference, Ollama for embeddings — the only external/third-party integrations currently connected)
- Cash-on-delivery payment recording
- Kafka-based event integration across all services
- Real-time notification delivery
- Role-based dashboards for all operational roles
- Station administration and staff onboarding
**Explicitly out of scope for the current MVP:**
No third-party integrations beyond the AI providers above are connected at this stage. Payment gateway processing, live railway data, SMS and push notification delivery, and mapping all have working internal logic and defined integration points, but currently run in a stubbed/simulated mode pending Phase 2 provider integration. This is a deliberate MVP boundary, not an oversight — it allows the full business logic and event flow to be built, tested, and demonstrated independently of any third-party account setup or cost.
 
## Phase 2 Roadmap
 
The following integrations are scoped and architecturally accounted for, but not yet connected to a live external provider:
 
- Cashfree payment gateway integration
- Live train running status APIs
- PNR status via official railway data sources
- Google Maps services for indoor/outdoor navigation
- Vendor marketplace
- Expanded tourism recommendations
- Retiring room / station stay booking via external booking systems
- Digital locker integration
- Station room booking
- Indoor navigation
- QR-enabled passenger services
- SMS and push notification delivery via a live provider
## API Documentation
 
Each Spring Boot microservice exposes an OpenAPI specification. The API Gateway aggregates these into a single Swagger UI, allowing every service's API surface to be explored from one place without accessing each microservice individually.
 
When running locally:
 
```text
http://localhost:8080/swagger-ui.html
```
 
Available API groups:
- API Gateway
- Auth Service
- Porter Service
- Payment Service
- Notification Service
- AI Planner
- AI Assistant
- Station Dashboard
## Repository Structure
 
```text
services/
 |- spring-boot/
 |- node/
r1_web_final/
infrastructure/
README.md
HOW_TO_RUN.md
```
 
## Environment Variables
 
The following must be configured before running the platform:
 
- Database credentials (PostgreSQL)
- Redis connection details
- JWT signing secret
- Groq API key
- Google OAuth client credentials
- Kafka broker configuration
- Ollama base URL and embedding model name
Third-party service keys for Phase 2 integrations (Cashfree, SMS provider, Firebase, railway data providers) are read from environment configuration where already wired, and default to a safe stub/simulated mode when unset, so the platform runs fully without them during development and demonstration.
 
## Running the Project
 
See **HOW_TO_RUN.md** for full local setup instructions.
 
## License
 
This project is intended for educational, research, and demonstration purposes.
