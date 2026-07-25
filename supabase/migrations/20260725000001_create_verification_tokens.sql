CREATE TABLE IF NOT EXISTS verification_tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_verification_tokens_token_hash ON verification_tokens (token_hash);
CREATE INDEX idx_verification_tokens_email ON verification_tokens (email);
