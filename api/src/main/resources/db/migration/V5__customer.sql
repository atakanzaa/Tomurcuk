-- Müşteri kartı göndereni tutar. Dükkân + telefon tekildir; aynı telefon farklı isimle
-- gelirse ilk isim kalır. Telefon tek biçimde tutulur ("0532 412 88 19"); biçim normalize
-- edilmiş numaradan üretildiği için tekillik numara üzerinden sağlanır.
CREATE TABLE customer
(
    id                VARCHAR(32) PRIMARY KEY,
    shop_id           VARCHAR(32)  NOT NULL REFERENCES shop (id),
    name              VARCHAR(120) NOT NULL,
    phone             VARCHAR(20)  NOT NULL,
    email             VARCHAR(160),
    note              TEXT,
    marketing_consent BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (shop_id, phone)
);
