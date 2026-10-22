-- Dükkânın ödeme hesabı (iyzico pazaryeri alt üye işyeri). Yalnızca dükkân sahibi değiştirir;
-- destek ekibi dahil kimse dükkân adına değiştiremez (docs/mvp.md "Yetki matrisi").
CREATE TABLE shop_payment_account
(
    shop_id                 VARCHAR(32) PRIMARY KEY REFERENCES shop (id),
    iyzico_sub_merchant_key VARCHAR(100),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
