-- Sözleşmelerdeki satıcı bilgileri ve yeni sipariş bildirimi. Satıcı dükkândır; Tomurcuk aracı
-- hizmet sağlayıcıdır. Boş alanlar dükkân ayarlarından doldurulur.
ALTER TABLE shop
    ADD COLUMN legal_name   VARCHAR(160) NOT NULL DEFAULT '',
    ADD COLUMN tax_office   VARCHAR(80)  NOT NULL DEFAULT '',
    ADD COLUMN tax_number   VARCHAR(20)  NOT NULL DEFAULT '',
    ADD COLUMN email        VARCHAR(160) NOT NULL DEFAULT '',
    -- Yeni siparişte çiçekçiye SMS: açıksa bu cep telefonuna gider.
    ADD COLUMN notify_phone VARCHAR(20),
    ADD COLUMN notify_sms   BOOLEAN      NOT NULL DEFAULT FALSE;

-- Alıcının onayladığı ön bilgilendirme formu ve mesafeli satış sözleşmesinin sürümü
-- (web/lib/legal/version.ts). Panelden girilen siparişte boştur.
ALTER TABLE orders
    ADD COLUMN terms_version VARCHAR(20);
