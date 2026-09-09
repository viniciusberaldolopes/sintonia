-- Migration aditiva. Rollback seguro: remover apenas as tabelas mesma_pista_* abaixo.
CREATE TABLE IF NOT EXISTS mesma_pista_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_hash VARCHAR(64) UNIQUE NOT NULL,
  converted_user_id UUID REFERENCES sintonia_users(id) ON DELETE SET NULL,
  origin JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mesma_pista_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES sintonia_users(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES mesma_pista_guests(id) ON DELETE SET NULL,
  name VARCHAR(64) NOT NULL,
  email VARCHAR(254) NOT NULL,
  attribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mesma_pista_rooms (
  code VARCHAR(5) PRIMARY KEY,
  host_user_id UUID REFERENCES sintonia_users(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'lobby',
  player_count INTEGER NOT NULL DEFAULT 1,
  round_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS mesma_pista_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(5) NOT NULL REFERENCES mesma_pista_rooms(code) ON DELETE CASCADE,
  participant_key VARCHAR(80) NOT NULL,
  user_id UUID REFERENCES sintonia_users(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES mesma_pista_guests(id) ON DELETE SET NULL,
  nickname VARCHAR(32) NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_code, participant_key)
);

CREATE TABLE IF NOT EXISTS mesma_pista_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(5) NOT NULL REFERENCES mesma_pista_rooms(code) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  chooser_index INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  low_label VARCHAR(80) NOT NULL,
  high_label VARCHAR(80) NOT NULL,
  target SMALLINT NOT NULL CHECK(target BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_code, round_number)
);

CREATE TABLE IF NOT EXISTS mesma_pista_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES mesma_pista_rounds(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES mesma_pista_participants(id) ON DELETE CASCADE,
  guess SMALLINT NOT NULL CHECK(guess BETWEEN 0 AND 100),
  points SMALLINT NOT NULL CHECK(points BETWEEN 0 AND 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(round_id, participant_id)
);

CREATE TABLE IF NOT EXISTS mesma_pista_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id VARCHAR(24) UNIQUE NOT NULL,
  room_code VARCHAR(5) NOT NULL REFERENCES mesma_pista_rooms(code) ON DELETE CASCADE,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mesma_pista_lead_events (
  id BIGSERIAL PRIMARY KEY,
  lead_id UUID REFERENCES mesma_pista_leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES sintonia_users(id) ON DELETE SET NULL,
  guest_id UUID REFERENCES mesma_pista_guests(id) ON DELETE SET NULL,
  event_name VARCHAR(64) NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mesma_pista_scoring_rules (
  event_name VARCHAR(64) PRIMARY KEY,
  points INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO mesma_pista_scoring_rules(event_name, points) VALUES
  ('host_lead_created', 5), ('room_created', 10), ('second_player_joined', 10),
  ('five_players_joined', 20), ('game_completed', 15), ('second_game_created', 20),
  ('results_shared', 15), ('pricing_viewed', 20), ('checkout_started', 50)
ON CONFLICT(event_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS mesma_pista_rate_limits (
  identity_hash VARCHAR(64) NOT NULL,
  action VARCHAR(32) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(identity_hash, action, window_start)
);
