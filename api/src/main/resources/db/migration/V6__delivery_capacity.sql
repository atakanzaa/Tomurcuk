CREATE TABLE closed_day
(
    shop_id VARCHAR(32) NOT NULL REFERENCES shop (id),
    date    DATE        NOT NULL,
    PRIMARY KEY (shop_id, date)
);

-- Gün ve aralık başına doluluk. `taken` verilen siparişlerle geçerli rezervasyonların
-- toplamıdır; artış `taken < capacity` koşuluyla tek UPDATE'te yapılır, böylece aynı
-- aralığa eşzamanlı iki istek kapasiteyi aşamaz. Satır ilk ihtiyaçta şablondan açılır.
CREATE TABLE slot_capacity
(
    shop_id  VARCHAR(32) NOT NULL REFERENCES shop (id),
    date     DATE        NOT NULL,
    slot_id  VARCHAR(32) NOT NULL REFERENCES time_slot (id),
    capacity INT         NOT NULL CHECK (capacity >= 0),
    taken    INT         NOT NULL DEFAULT 0 CHECK (taken >= 0),
    PRIMARY KEY (shop_id, date, slot_id)
);

-- Alıcı ödeme sayfasındayken aralık 10 dakika onun için ayrılır. Süresi dolan kayıt
-- zamanlanmış işle silinir ve `taken` bir azaltılır; sipariş oluşurken kayıt silinip
-- yer siparişe geçer. Bir taslağın tek rezervasyonu olur.
CREATE TABLE slot_hold
(
    draft_id   VARCHAR(32) PRIMARY KEY,
    shop_id    VARCHAR(32) NOT NULL,
    date       DATE        NOT NULL,
    slot_id    VARCHAR(32) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (shop_id, date, slot_id) REFERENCES slot_capacity (shop_id, date, slot_id)
);
CREATE INDEX slot_hold_expires_idx ON slot_hold (expires_at);
