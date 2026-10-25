-- Dükkânın kendi sayfası: kapak fotoğrafı, hikâye, kuruluş yılı, en çok üç atölye fotoğrafı ve
-- favori ürünün yanındaki çiçekçi notu. Favori ürün var olan featured_product_id'dir.
ALTER TABLE shop
    ADD COLUMN cover_photo_url TEXT,
    ADD COLUMN story           VARCHAR(1500) NOT NULL DEFAULT '',
    ADD COLUMN founded_year    INT,
    ADD COLUMN story_photos    TEXT[]        NOT NULL DEFAULT '{}',
    ADD COLUMN favorite_note   VARCHAR(200)  NOT NULL DEFAULT '';
