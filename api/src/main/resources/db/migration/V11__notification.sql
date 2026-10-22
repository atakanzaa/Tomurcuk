-- Gönderilen ve gönderilecek bildirimler (mvp: notification_log). Satır önce `pending`
-- yazılır, sonra gönderilir; sağlayıcı hata verirse artan aralıklarla yeniden denenir ve
-- sipariş akışı hiç beklemez. `dedupe_key` (sipariş + tür + alıcı + olay sırası) tekildir:
-- aynı olay yeniden işlenirse aynı bildirim ikinci kez gitmez.
CREATE TABLE notification_log
(
    id                VARCHAR(32) PRIMARY KEY,
    shop_id           VARCHAR(32)  NOT NULL REFERENCES shop (id),
    order_id          VARCHAR(32),
    order_number      VARCHAR(16),
    kind              VARCHAR(32)  NOT NULL,
    channel           VARCHAR(8)   NOT NULL CHECK (channel IN ('sms', 'email')),
    recipient         VARCHAR(160) NOT NULL,
    subject           VARCHAR(200),
    text              TEXT         NOT NULL,
    status            VARCHAR(16)  NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    attempts          INT          NOT NULL DEFAULT 0,
    provider_response TEXT,
    next_attempt_at   TIMESTAMPTZ,
    sent_at           TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL,
    dedupe_key        VARCHAR(160) NOT NULL UNIQUE
);
CREATE INDEX notification_log_retry_idx ON notification_log (status, next_attempt_at);
CREATE INDEX notification_log_shop_idx ON notification_log (shop_id, created_at);
