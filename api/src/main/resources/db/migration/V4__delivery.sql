-- Bölge silinmez, pasife alınır; bölge adı ve ücreti siparişe kopyalanır.
CREATE TABLE delivery_zone
(
    id           VARCHAR(32) PRIMARY KEY,
    shop_id      VARCHAR(32) NOT NULL REFERENCES shop (id),
    district     VARCHAR(80) NOT NULL,
    neighborhood VARCHAR(80),
    fee          BIGINT      NOT NULL CHECK (fee >= 0),
    active       BOOLEAN     NOT NULL DEFAULT TRUE,
    position     INT         NOT NULL
);
CREATE INDEX delivery_zone_shop_idx ON delivery_zone (shop_id, position);

-- Haftalık saat aralığı şablonu; günlük doluluk sipariş aşamasında ayrı tabloda tutulur.
CREATE TABLE time_slot
(
    id         VARCHAR(32) PRIMARY KEY,
    shop_id    VARCHAR(32) NOT NULL REFERENCES shop (id),
    start_time TIME        NOT NULL,
    end_time   TIME        NOT NULL CHECK (end_time > start_time),
    capacity   INT         NOT NULL CHECK (capacity >= 0),
    UNIQUE (shop_id, start_time)
);
