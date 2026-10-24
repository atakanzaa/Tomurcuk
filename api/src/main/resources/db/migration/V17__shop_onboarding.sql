-- Destek panelinden dükkân açma. Sahibin şifresi tek kullanımlık bağlantıyla belirlenir;
-- bağlantının kendisi saklanmaz, SHA-256 özeti saklanır.
CREATE TABLE password_token
(
    token_hash CHAR(64) PRIMARY KEY,
    user_id    VARCHAR(32) NOT NULL REFERENCES shop_user (id),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX password_token_user_idx ON password_token (user_id);

-- Başvurudan açılan dükkân; dolu olan başvuru sonuçlanmıştır.
ALTER TABLE pilot_application
    ADD COLUMN shop_id VARCHAR(32) REFERENCES shop (id);
