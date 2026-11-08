-- Dükkânın görünümü. Renk kapak fotoğrafından gelir (yüklenirken bulunur, kapak kaydedilince
-- buraya yazılır); tema renkleri ondan kodda türetilir. `theme_mode`: cover (kapaktan) ya da
-- tomurcuk (varsayılan renkler). `layout`: cover (kapak önde), story (hikâye önde), products
-- (çiçekler önde). Instagram kullanıcı adı ve WhatsApp numarası vitrindeki iletişim bölümü için;
-- WhatsApp boşsa dükkân telefonu kullanılır. `share_description` bağlantı önizlemesinde ve
-- aramalarda görünür; boşsa kısa tanıtım.
ALTER TABLE shop
    ADD COLUMN cover_color       VARCHAR(7),
    ADD COLUMN theme_mode        VARCHAR(16)  NOT NULL DEFAULT 'cover' CHECK (theme_mode IN ('cover', 'tomurcuk')),
    ADD COLUMN layout            VARCHAR(16)  NOT NULL DEFAULT 'cover' CHECK (layout IN ('cover', 'story', 'products')),
    ADD COLUMN instagram         VARCHAR(30)  NOT NULL DEFAULT '',
    ADD COLUMN whatsapp          VARCHAR(20),
    ADD COLUMN share_description VARCHAR(160) NOT NULL DEFAULT '';
