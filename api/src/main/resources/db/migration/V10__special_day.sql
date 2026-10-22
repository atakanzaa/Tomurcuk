-- Müşterinin özel günleri. Yıl tutulmaz, her yıl tekrar eder; 29 Şubat artık yıl olmayan
-- yıllarda 28 Şubat'ta hatırlatılır (hesap uygulamada).
CREATE TABLE special_day
(
    id             VARCHAR(32) PRIMARY KEY,
    customer_id    VARCHAR(32)  NOT NULL REFERENCES customer (id) ON DELETE CASCADE,
    title          VARCHAR(160) NOT NULL,
    day            INT          NOT NULL CHECK (day BETWEEN 1 AND 31),
    month          INT          NOT NULL CHECK (month BETWEEN 1 AND 12),
    recipient_name VARCHAR(120),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX special_day_customer_idx ON special_day (customer_id);
