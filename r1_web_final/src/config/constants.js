// ── Role constants ────────────────────────────────────────────────────────────
export const ROLES = {
  USER:                 'USER',
  PORTER:               'PORTER',
  SUPERVISOR:           'SUPERVISOR',
  RPF:                  'RPF',
  STATION_CONTROL_ROOM: 'STATION_CONTROL_ROOM',
  SUPERADMIN:           'SUPERADMIN',
};

// ── API base ──────────────────────────────────────────────────────────────────
// ── API ───────────────────────────────────────────────────────────────────────
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ── Socket.IO ─────────────────────────────────────────────────────────────────
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:3006';

// ── Porter pricing (CRIS fixed tariff incl. 18% GST) ─────────────────────────
export const PORTER_PRICING = {
  LUGGAGE_ONLY:        { base: 85,  gst: 15.30, total: 100.30, label: 'Luggage (up to 40 kg)' },
  LUGGAGE_BARROW:      { base: 135, gst: 24.30, total: 159.30, label: 'Luggage Barrow (40–160 kg)' },
  WHEELCHAIR_ONLY:     { base: 135, gst: 24.30, total: 159.30, label: 'Wheelchair (2-person)' },
  WHEELCHAIR_STRETCHER:{ base: 205, gst: 36.90, total: 241.90, label: 'Stretcher/Bed Chair (4-person)' },
  COMBINED:            { base: 220, gst: 39.60, total: 259.60, label: 'Combined (Luggage + Wheelchair)' },
};

// ── Groq AI config (replaces OpenAI for MVP) ──────────────────────────────────
// Phase 1 MVP uses Groq (faster inference, lower cost, government-pilot suitable).
// The AI service abstraction layer allows switching to OpenAI, Anthropic, or
// self-hosted models later without frontend changes.
export const AI_CONFIG = {
  provider:    'groq',
  model:       'llama3-8b-8192',      // fastest Groq model for chat
  embedModel:  'text-embedding-3-small', // still uses OpenAI for embeddings (pgvector)
  languages:   ['en', 'hi', 'gu'],
  maxTokens:   1024,
};

// ── Station defaults ──────────────────────────────────────────────────────────
export const DEFAULT_STATION = {
  id:   '00000000-0000-0000-0000-100000000001',
  name: 'Ahmedabad Junction',
  code: 'ADI',
  city: 'Ahmedabad',
  state:'Gujarat',
  timezone: 'Asia/Kolkata',
};

// ── SOS ───────────────────────────────────────────────────────────────────────
export const SOS_TYPES = [
  { value: 'GENERAL',   label: 'General Emergency' },
  { value: 'MEDICAL',   label: 'Medical Emergency' },
  { value: 'SECURITY',  label: 'Security Threat' },
  { value: 'FIRE',      label: 'Fire / Smoke' },
  { value: 'LOST_CHILD',label: 'Lost Child' },
];

// ── Pagination ────────────────────────────────────────────────────────────────
export const PAGE_SIZE = 20;

// ── Date / time ───────────────────────────────────────────────────────────────
export const DATE_FORMAT   = 'dd MMM yyyy';
export const TIME_FORMAT   = 'hh:mm a';
export const DT_FORMAT     = 'dd MMM yyyy, hh:mm a';
export const IST_TIMEZONE  = 'Asia/Kolkata';