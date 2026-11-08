-- Vitrin ziyaretleri kanala göre günlük sayılır; kişi, IP ya da tarayıcı bilgisi tutulmaz.
-- Ziyaret tarayıcı oturumu başına bir kez sayılır (web/lib/channel.ts).
CREATE TABLE shop_visit
(
    shop_id VARCHAR(32) NOT NULL REFERENCES shop (id),
    day     DATE        NOT NULL,
    channel VARCHAR(16) NOT NULL CHECK (channel IN ('instagram', 'whatsapp', 'google', 'facebook', 'qr', 'tomurcuk', 'other', 'direct')),
    visits  INT         NOT NULL,
    PRIMARY KEY (shop_id, day, channel)
);

-- Alıcının siparişten önce geldiği kanal; panelden girilen siparişte yok.
ALTER TABLE order_draft
    ADD COLUMN channel VARCHAR(16);
ALTER TABLE orders
    ADD COLUMN channel VARCHAR(16) CHECK (channel IN ('instagram', 'whatsapp', 'google', 'facebook', 'qr', 'tomurcuk', 'other', 'direct'));
CREATE INDEX orders_shop_created_idx ON orders (shop_id, created_at);
