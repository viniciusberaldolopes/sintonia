import { neon } from '@neondatabase/serverless'

let initialized = false
let initializationPromise = null

export function database() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada')
  return neon(process.env.DATABASE_URL)
}

export async function ensureSchema() {
  if (initialized) return
  if (!initializationPromise) initializationPromise = initializeSchema()
  try {
    await initializationPromise
    initialized = true
  } catch (error) {
    initializationPromise = null
    throw error
  }
}

async function initializeSchema() {
  const sql = database()
  await sql`CREATE TABLE IF NOT EXISTS sintonia_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'user',
    plan VARCHAR(16) NOT NULL DEFAULT 'free',
    marketing_opt_in BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`ALTER TABLE sintonia_users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE`
  await sql`ALTER TABLE sintonia_users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE`
  await sql`ALTER TABLE sintonia_users ADD COLUMN IF NOT EXISTS billing_product VARCHAR(16)`
  await sql`ALTER TABLE sintonia_users ADD COLUMN IF NOT EXISTS paid_until TIMESTAMPTZ`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_stripe_events (
    event_id TEXT PRIMARY KEY,
    event_type VARCHAR(80) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  try {
    await sql`SELECT 1 FROM mesma_pista_rate_limits LIMIT 0`
    await sql`SELECT 1 FROM mesma_pista_custom_questions LIMIT 0`
    return
  } catch {
    // A instalação inicial continua abaixo; alterações são somente aditivas.
  }
  await sql`CREATE TABLE IF NOT EXISTS sintonia_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(32) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(16) NOT NULL DEFAULT 'user',
    plan VARCHAR(16) NOT NULL DEFAULT 'free',
    marketing_opt_in BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`CREATE TABLE IF NOT EXISTS sintonia_sessions (
    token_hash VARCHAR(64) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES sintonia_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`CREATE TABLE IF NOT EXISTS sintonia_events (
    id BIGSERIAL PRIMARY KEY,
    event_name VARCHAR(64) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_usage (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES sintonia_users(id) ON DELETE SET NULL,
    device_hash VARCHAR(64) NOT NULL,
    network_hash VARCHAR(64) NOT NULL,
    room_code VARCHAR(5),
    event_name VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`CREATE INDEX IF NOT EXISTS mesma_pista_usage_user_date_idx ON mesma_pista_usage(user_id, created_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS mesma_pista_usage_device_date_idx ON mesma_pista_usage(device_hash, created_at DESC)`
  await sql`CREATE INDEX IF NOT EXISTS mesma_pista_usage_network_date_idx ON mesma_pista_usage(network_hash, created_at DESC)`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), identity_hash VARCHAR(64) UNIQUE NOT NULL,
    converted_user_id UUID REFERENCES sintonia_users(id) ON DELETE SET NULL,
    origin JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID UNIQUE REFERENCES sintonia_users(id) ON DELETE SET NULL,
    guest_id UUID REFERENCES mesma_pista_guests(id) ON DELETE SET NULL, name VARCHAR(64) NOT NULL, email VARCHAR(254) NOT NULL,
    attribution JSONB NOT NULL DEFAULT '{}'::jsonb, score INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_rooms (
    code VARCHAR(5) PRIMARY KEY, host_user_id UUID REFERENCES sintonia_users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'lobby', player_count INTEGER NOT NULL DEFAULT 1,
    round_count INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ)`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), room_code VARCHAR(5) NOT NULL REFERENCES mesma_pista_rooms(code) ON DELETE CASCADE,
    participant_key VARCHAR(80) NOT NULL, user_id UUID REFERENCES sintonia_users(id) ON DELETE SET NULL,
    guest_id UUID REFERENCES mesma_pista_guests(id) ON DELETE SET NULL, nickname VARCHAR(32) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(room_code, participant_key))`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), room_code VARCHAR(5) NOT NULL REFERENCES mesma_pista_rooms(code) ON DELETE CASCADE,
    round_number INTEGER NOT NULL, chooser_index INTEGER NOT NULL, prompt TEXT NOT NULL,
    low_label VARCHAR(80) NOT NULL, high_label VARCHAR(80) NOT NULL, target SMALLINT NOT NULL CHECK(target BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(room_code, round_number))`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), round_id UUID NOT NULL REFERENCES mesma_pista_rounds(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES mesma_pista_participants(id) ON DELETE CASCADE,
    guess SMALLINT NOT NULL CHECK(guess BETWEEN 0 AND 100), points SMALLINT NOT NULL CHECK(points BETWEEN 0 AND 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(round_id, participant_id))`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), public_id VARCHAR(24) UNIQUE NOT NULL,
    room_code VARCHAR(5) NOT NULL REFERENCES mesma_pista_rooms(code) ON DELETE CASCADE,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_lead_events (
    id BIGSERIAL PRIMARY KEY, lead_id UUID REFERENCES mesma_pista_leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES sintonia_users(id) ON DELETE SET NULL, guest_id UUID REFERENCES mesma_pista_guests(id) ON DELETE SET NULL,
    event_name VARCHAR(64) NOT NULL, points INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_scoring_rules (
    event_name VARCHAR(64) PRIMARY KEY, points INTEGER NOT NULL, enabled BOOLEAN NOT NULL DEFAULT true, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  await sql`INSERT INTO mesma_pista_scoring_rules(event_name, points) VALUES
    ('host_lead_created', 5), ('room_created', 10), ('second_player_joined', 10), ('five_players_joined', 20),
    ('game_completed', 15), ('second_game_created', 20), ('results_shared', 15), ('pricing_viewed', 20), ('checkout_started', 50)
    ON CONFLICT(event_name) DO NOTHING`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_rate_limits (
    identity_hash VARCHAR(64) NOT NULL, action VARCHAR(32) NOT NULL, window_start TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(identity_hash, action, window_start))`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_custom_themes (
    room_code VARCHAR(5) PRIMARY KEY REFERENCES mesma_pista_rooms(code) ON DELETE CASCADE,
    name VARCHAR(48) NOT NULL, created_by UUID NOT NULL REFERENCES mesma_pista_participants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  await sql`CREATE TABLE IF NOT EXISTS mesma_pista_custom_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), room_code VARCHAR(5) NOT NULL REFERENCES mesma_pista_rooms(code) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES mesma_pista_participants(id) ON DELETE CASCADE,
    prompt VARCHAR(180) NOT NULL, low_label VARCHAR(60) NOT NULL DEFAULT 'Ruim', high_label VARCHAR(60) NOT NULL DEFAULT 'Bom',
    free_slot BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS mesma_pista_custom_questions_free_once_idx
    ON mesma_pista_custom_questions(room_code, participant_id) WHERE free_slot`
}
