-- Panelden ürün yönetimi. Fotoğraflar sırayla tutulur, ilki kapaktır; photo_url kapağın
-- kopyasıdır ve vitrin, alıcı sayfası ve kartlar onu okur.
ALTER TABLE product
    ADD COLUMN photos     TEXT[]       NOT NULL DEFAULT '{}',
    ADD COLUMN updated_at TIMESTAMPTZ,
    ADD COLUMN updated_by VARCHAR(120),
    -- Silinen ürün panelden de kalkar; siparişlerde adı ve fiyatı kopyalandığı için kayıt durur.
    ADD COLUMN deleted_at TIMESTAMPTZ;

UPDATE product SET photos = ARRAY[photo_url] WHERE photo_url IS NOT NULL;
