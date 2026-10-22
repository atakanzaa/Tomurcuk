-- Kart ödemesi. Her ödeme denemesi ayrı satırdır. Sağlayıcının ödeme numarası
-- (provider_ref) tekildir: aynı callback ikinci kez gelirse etkisiz kalır.
-- Kart bilgisi hiç tutulmaz, sağlayıcıda kalır.
CREATE TABLE payment
(
    id           VARCHAR(32) PRIMARY KEY,
    order_id     VARCHAR(32) NOT NULL,
    shop_id      VARCHAR(32) NOT NULL,
    provider     VARCHAR(16) NOT NULL,
    token        VARCHAR(128) NOT NULL UNIQUE,
    provider_ref VARCHAR(64) UNIQUE,
    amount       BIGINT      NOT NULL,
    status       VARCHAR(16) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'abandoned')),
    raw_response JSONB,
    created_at   TIMESTAMPTZ NOT NULL,
    updated_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX payment_order_idx ON payment (order_id);
CREATE INDEX payment_pending_idx ON payment (status, created_at);
