-- Create offers table
CREATE TABLE IF NOT EXISTS offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  discount text,
  badge text,
  image text,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for faster expiry queries
CREATE INDEX IF NOT EXISTS offers_expires_at_idx ON offers (expires_at);
