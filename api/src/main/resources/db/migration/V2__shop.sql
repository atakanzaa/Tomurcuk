-- Dükkân. id'ler dışa açık ve tahmin edilemez (yeni kayıtlar ULID); örnek verideki
-- okunur id'ler de aynı sütuna sığar.
CREATE TABLE shop
(
    id                  VARCHAR(32) PRIMARY KEY,
    slug                VARCHAR(80)  NOT NULL UNIQUE,
    name                VARCHAR(120) NOT NULL,
    short_name          VARCHAR(60)  NOT NULL,
    phone               VARCHAR(20)  NOT NULL,
    address             VARCHAR(300) NOT NULL,
    logo_url            TEXT,
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    plan                VARCHAR(16)  NOT NULL CHECK (plan IN ('pilot', 'starter', 'pro')),
    same_day_cutoff     TIME         NOT NULL,
    time_zone           VARCHAR(64)  NOT NULL DEFAULT 'Europe/Istanbul',
    description         TEXT         NOT NULL DEFAULT '',
    description_short   TEXT         NOT NULL DEFAULT '',
    opening_hours       VARCHAR(120) NOT NULL DEFAULT '',
    featured_product_id VARCHAR(32),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Eski adresler kalıcı olarak (301) güncel slug'a yönlenir. Bir slug ya güncel ya eski olabilir;
-- çakışmayı uygulama, adres değiştirirken kontrol eder.
CREATE TABLE shop_slug_history
(
    slug       VARCHAR(80) PRIMARY KEY,
    shop_id    VARCHAR(32) NOT NULL REFERENCES shop (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX shop_slug_history_shop_idx ON shop_slug_history (shop_id);
