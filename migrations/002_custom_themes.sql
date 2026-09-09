-- Temas colaborativos por sala. Migração somente aditiva.
CREATE TABLE IF NOT EXISTS mesma_pista_custom_themes (
  room_code VARCHAR(5) PRIMARY KEY REFERENCES mesma_pista_rooms(code) ON DELETE CASCADE,
  name VARCHAR(48) NOT NULL,
  created_by UUID NOT NULL REFERENCES mesma_pista_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mesma_pista_custom_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(5) NOT NULL REFERENCES mesma_pista_rooms(code) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES mesma_pista_participants(id) ON DELETE CASCADE,
  prompt VARCHAR(180) NOT NULL,
  low_label VARCHAR(60) NOT NULL DEFAULT 'Ruim',
  high_label VARCHAR(60) NOT NULL DEFAULT 'Bom',
  free_slot BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Em salas gratuitas, a restrição garante atomicamente uma contribuição por participante.
CREATE UNIQUE INDEX IF NOT EXISTS mesma_pista_custom_questions_free_once_idx
  ON mesma_pista_custom_questions(room_code, participant_id) WHERE free_slot;

-- Rollback: DROP TABLE mesma_pista_custom_questions; DROP TABLE mesma_pista_custom_themes;
