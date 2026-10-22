-- Alıcının sipariş taslağı. Tarayıcı yalnızca id'yi (tahmin edilemez token) bilir.
-- Ürün adı ve fiyatı seçildiği andaki değerdir; ödemeden önce yeniden doğrulanır.
CREATE TABLE order_draft
(
    id           VARCHAR(32) PRIMARY KEY,
    shop_id      VARCHAR(32)  NOT NULL REFERENCES shop (id),
    product_id   VARCHAR(32)  NOT NULL,
    product_name VARCHAR(120) NOT NULL,
    unit_price   BIGINT       NOT NULL,
    options      JSONB        NOT NULL,
    line_total   BIGINT       NOT NULL,
    delivery     JSONB,
    card         JSONB,
    -- Sipariş oluştuktan sonra dolar; ödeme yarıda kalırsa alıcı aynı siparişi yeniden öder.
    order_id     VARCHAR(32),
    expires_at   TIMESTAMPTZ  NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX order_draft_expires_idx ON order_draft (expires_at);

-- Dükkâna özel artan sipariş numarası (T-4821).
CREATE TABLE shop_order_counter
(
    shop_id     VARCHAR(32) PRIMARY KEY REFERENCES shop (id),
    next_number INT NOT NULL
);

-- Ad, fiyat, bölge ve saat aralığı sipariş anında kopyalanır; katalog ve teslimat
-- ayarlarındaki değişiklik eski siparişi etkilemez. Para alanları kuruş.
CREATE TABLE orders
(
    id                 VARCHAR(32) PRIMARY KEY,
    shop_id            VARCHAR(32)  NOT NULL REFERENCES shop (id),
    number             VARCHAR(16)  NOT NULL,
    customer_id        VARCHAR(32)  NOT NULL REFERENCES customer (id),
    source             VARCHAR(16)  NOT NULL CHECK (source IN ('link', 'phone', 'whatsapp', 'instagram', 'store', 'ciceksepeti')),
    status             VARCHAR(16)  NOT NULL CHECK (status IN ('new', 'preparing', 'onway', 'delivered', 'failed', 'cancelled')),
    payment_status     VARCHAR(16)  NOT NULL CHECK (payment_status IN ('pending', 'paid', 'unpaid')),
    payment_method     VARCHAR(16)  NOT NULL CHECK (payment_method IN ('card', 'transfer', 'cash')),
    delivery_date      DATE         NOT NULL,
    time_slot_id       VARCHAR(32),
    slot_start         TIME         NOT NULL,
    slot_end           TIME         NOT NULL,
    delivery_time      TIME,
    exact_time         BOOLEAN      NOT NULL DEFAULT FALSE,
    delivery_zone_id   VARCHAR(32)  NOT NULL,
    zone_name          VARCHAR(160) NOT NULL,
    recipient_name     VARCHAR(120) NOT NULL,
    recipient_phone    VARCHAR(20)  NOT NULL,
    address            VARCHAR(400) NOT NULL,
    courier_note       VARCHAR(200),
    card_note          VARCHAR(250),
    sender_name        VARCHAR(120),
    anonymous          BOOLEAN      NOT NULL DEFAULT FALSE,
    sender_phone       VARCHAR(20)  NOT NULL,
    subtotal           BIGINT       NOT NULL,
    delivery_fee       BIGINT       NOT NULL,
    total              BIGINT       NOT NULL,
    delivery_photo_url TEXT,
    courier_name       VARCHAR(80),
    tracking_token     VARCHAR(32)  NOT NULL UNIQUE,
    idempotency_key    VARCHAR(64),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (shop_id, number),
    UNIQUE (shop_id, idempotency_key)
);
CREATE INDEX orders_shop_delivery_idx ON orders (shop_id, delivery_date);
CREATE INDEX orders_customer_idx ON orders (customer_id);

CREATE TABLE order_item
(
    id           VARCHAR(40) PRIMARY KEY,
    order_id     VARCHAR(32)  NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id   VARCHAR(32),
    product_name VARCHAR(120) NOT NULL,
    unit_price   BIGINT       NOT NULL,
    quantity     INT          NOT NULL DEFAULT 1,
    options      JSONB        NOT NULL DEFAULT '[]',
    position     INT          NOT NULL
);
CREATE INDEX order_item_order_idx ON order_item (order_id);

-- Durum geçmişi; yalnızca eklenir.
CREATE TABLE order_event
(
    id       BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(32) NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    status   VARCHAR(16) NOT NULL,
    at       TIMESTAMPTZ NOT NULL,
    actor    VARCHAR(120)
);
CREATE INDEX order_event_order_idx ON order_event (order_id, at);
