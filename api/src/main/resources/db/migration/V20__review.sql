-- Ürün yorumları. Yalnızca teslim edilen siparişin göndereni takip sayfasından yazar; her siparişe bir yorum.
-- Ad ve semt yazıldığı anda kopyalanır ("Elif Y.", "Kadıköy"). Destek gerekçeyle gizler; silinmez.
CREATE TABLE review
(
    id            VARCHAR(32) PRIMARY KEY,
    order_id      VARCHAR(32)  NOT NULL UNIQUE REFERENCES orders (id) ON DELETE CASCADE,
    shop_id       VARCHAR(32)  NOT NULL REFERENCES shop (id),
    order_number  VARCHAR(16)  NOT NULL,
    rating        SMALLINT     NOT NULL CHECK (rating BETWEEN 1 AND 5),
    text          VARCHAR(500) NOT NULL DEFAULT '',
    author_name   VARCHAR(80)  NOT NULL,
    district      VARCHAR(80)  NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ  NOT NULL,
    hidden_at     TIMESTAMPTZ,
    hidden_reason VARCHAR(500),
    hidden_by     VARCHAR(80)
);

CREATE INDEX review_shop_idx ON review (shop_id, created_at DESC);

-- Yorum siparişteki her ürünün sayfasında görünür. Ürün adı sipariş anındaki addır.
CREATE TABLE review_product
(
    review_id    VARCHAR(32)  NOT NULL REFERENCES review (id) ON DELETE CASCADE,
    product_id   VARCHAR(32)  NOT NULL,
    product_name VARCHAR(120) NOT NULL,
    PRIMARY KEY (review_id, product_id)
);

CREATE INDEX review_product_product_idx ON review_product (product_id);
