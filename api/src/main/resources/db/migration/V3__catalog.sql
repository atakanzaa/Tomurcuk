CREATE TABLE category
(
    id       VARCHAR(32) PRIMARY KEY,
    shop_id  VARCHAR(32) NOT NULL REFERENCES shop (id),
    slug     VARCHAR(80) NOT NULL,
    name     VARCHAR(80) NOT NULL,
    position INT         NOT NULL,
    UNIQUE (shop_id, slug)
);

-- Fiyatlar kuruş cinsinden. Sipariş anında ad ve fiyat siparişe kopyalanır; burada
-- yapılan değişiklik eski siparişleri etkilemez.
CREATE TABLE product
(
    id          VARCHAR(32) PRIMARY KEY,
    shop_id     VARCHAR(32)  NOT NULL REFERENCES shop (id),
    category_id VARCHAR(32)  NOT NULL REFERENCES category (id),
    name        VARCHAR(120) NOT NULL,
    description TEXT         NOT NULL DEFAULT '',
    summary     VARCHAR(160) NOT NULL DEFAULT '',
    price       BIGINT       NOT NULL CHECK (price >= 0),
    photo_url   TEXT,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    position    INT          NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX product_shop_idx ON product (shop_id, position);

CREATE TABLE product_option
(
    id          VARCHAR(40) PRIMARY KEY,
    product_id  VARCHAR(32)  NOT NULL REFERENCES product (id) ON DELETE CASCADE,
    name        VARCHAR(120) NOT NULL,
    detail      VARCHAR(80),
    kind        VARCHAR(16)  NOT NULL CHECK (kind IN ('size', 'vase', 'addon')),
    extra_price BIGINT       NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
    position    INT          NOT NULL
);
CREATE INDEX product_option_product_idx ON product_option (product_id, position);
