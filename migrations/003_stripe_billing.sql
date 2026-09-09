ALTER TABLE sintonia_users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE sintonia_users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;
ALTER TABLE sintonia_users ADD COLUMN IF NOT EXISTS billing_product VARCHAR(16);
ALTER TABLE sintonia_users ADD COLUMN IF NOT EXISTS paid_until TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS mesma_pista_stripe_events (
  event_id TEXT PRIMARY KEY,
  event_type VARCHAR(80) NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
