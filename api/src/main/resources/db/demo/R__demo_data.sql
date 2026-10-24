-- Demo verisi: tasarımlardaki örnek dükkânlar (design/screens). Yalnızca `demo` profiliyle yüklenir,
-- prod'a girmez. Tekrar çalıştırılabilir: kayıt varsa günceller. web/lib/mock/data.ts ile aynı id'leri
-- kullanır; geçiş süresince mock'ta kalan akışlar bu id'lerle API'deki veriye bağlanır.

INSERT INTO shop (id, slug, name, short_name, phone, address, logo_url, active, plan, same_day_cutoff, time_zone, description, description_short, opening_hours, featured_product_id)
VALUES
    ('shop_nergis', 'nergis', 'Nergis Çiçek Atölyesi', 'Nergis', '0216 338 00 00', 'Caferağa Mah. Moda Cad. No: 41, Kadıköy', NULL, TRUE, 'pro', '15:00', 'Europe/Istanbul', 'Moda''da 2009''dan beri. Buketleri her sabah halden gelen çiçeklerle hazırlıyor, Kadıköy, Üsküdar ve Ataşehir''e aynı gün teslim ediyoruz.', 'Moda''da 2009''dan beri. Kadıköy, Üsküdar ve Ataşehir''e aynı gün teslim ediyoruz.', 'Her gün 09:00–20:00', 'p_lale'),
    ('shop_lale', 'lale-bahcesi', 'Lale Bahçesi', 'Lale', '0212 000 00 00', 'Sinanpaşa Mah., Beşiktaş', NULL, TRUE, 'starter', '14:00', 'Europe/Istanbul', '', '', 'Her gün 09:00–19:00', NULL),
    ('shop_papatya', 'papatya-cicekcilik', 'Papatya Çiçekçilik', 'Papatya', '0212 000 00 00', 'Cevizli Mah., Kartal', NULL, TRUE, 'starter', '14:00', 'Europe/Istanbul', '', '', 'Her gün 09:00–19:00', NULL),
    ('shop_begonvil', 'begonvil-atolye', 'Begonvil Atölye', 'Begonvil', '0212 000 00 00', 'Atatürk Mah., Ataşehir', NULL, TRUE, 'starter', '14:00', 'Europe/Istanbul', '', '', 'Her gün 09:00–19:00', NULL),
    ('shop_orkide', 'orkide-evi', 'Orkide Evi', 'Orkide', '0212 000 00 00', 'Zeytinlik Mah., Bakırköy', NULL, FALSE, 'starter', '14:00', 'Europe/Istanbul', '', '', 'Her gün 09:00–19:00', NULL)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    short_name = EXCLUDED.short_name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    logo_url = EXCLUDED.logo_url,
    active = EXCLUDED.active,
    plan = EXCLUDED.plan,
    same_day_cutoff = EXCLUDED.same_day_cutoff,
    time_zone = EXCLUDED.time_zone,
    description = EXCLUDED.description,
    description_short = EXCLUDED.description_short,
    opening_hours = EXCLUDED.opening_hours,
    featured_product_id = EXCLUDED.featured_product_id;

INSERT INTO shop_slug_history (slug, shop_id)
VALUES
    ('nergis-cicek-atolyesi', 'shop_nergis')
ON CONFLICT (slug) DO UPDATE SET
    shop_id = EXCLUDED.shop_id;

INSERT INTO category (id, shop_id, slug, name, position)
VALUES
    ('c_buket', 'shop_nergis', 'buketler', 'Buketler', 1),
    ('c_orkide', 'shop_nergis', 'orkideler', 'Orkideler', 2),
    ('c_saksi', 'shop_nergis', 'saksi-cicekleri', 'Saksı çiçekleri', 3),
    ('c_celenk', 'shop_nergis', 'celenkler', 'Çelenkler', 4)
ON CONFLICT (id) DO UPDATE SET
    shop_id = EXCLUDED.shop_id,
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    position = EXCLUDED.position;

INSERT INTO product (id, shop_id, category_id, name, description, summary, price, photo_url, active, position)
VALUES
    ('p_lale', 'shop_nergis', 'c_buket', 'Bu haftanın lalesi', 'Hollanda lalesi, kraft kâğıda sarılı ve rafyayla bağlı. Vazoda 5–7 gün dayanır.', 'Hollanda lalesi, 15 dal, kraft sarımlı. Haftada bir değişir.', 72000, 'mock:p_lale', TRUE, 1),
    ('p_mevsim', 'shop_nergis', 'c_buket', 'Mevsim buketi', 'Haftanın en taze çiçeklerinden, çiçekçinin seçimiyle hazırlanan buket.', 'Aynı gün', 85000, 'mock:p_mevsim', TRUE, 2),
    ('p_beyaz_gul', 'shop_nergis', 'c_buket', 'Beyaz güller', 'On iki dal beyaz gül, okaliptüs yapraklarıyla.', '12 dal', 98000, 'mock:p_beyaz_gul', TRUE, 3),
    ('p_orkide', 'shop_nergis', 'c_orkide', 'Mor orkide', 'İki dallı mor orkide, seramik saksıda.', 'Saksıda', 160000, 'mock:p_orkide', TRUE, 4),
    ('p_kir', 'shop_nergis', 'c_buket', 'Kır buketi', 'Kır çiçekleri ve otlarla serbest bağlanmış buket.', 'Aynı gün', 65000, 'mock:p_kir', TRUE, 5),
    ('p_sakayik', 'shop_nergis', 'c_buket', 'Pembe şakayık', 'Yedi dal pembe şakayık. Yalnızca mevsiminde.', '7 dal, mevsiminde', 135000, 'mock:p_sakayik', TRUE, 6),
    ('p_papatya', 'shop_nergis', 'c_buket', 'Papatya kutusu', 'Kraft kutuda papatya aranjmanı.', 'Aynı gün', 54000, 'mock:p_papatya', TRUE, 7),
    ('p_monstera', 'shop_nergis', 'c_saksi', 'Monstera', '60 cm boyunda monstera, toprak saksıda.', 'Saksıda, 60 cm', 110000, 'mock:p_monstera', TRUE, 8),
    ('p_celenk', 'shop_nergis', 'c_celenk', 'Ayaklı çelenk', 'Açılış ve tören için ayaklı çelenk. En az bir gün önceden sipariş verilir.', '1 gün önceden', 240000, 'mock:p_celenk', TRUE, 9)
ON CONFLICT (id) DO UPDATE SET
    shop_id = EXCLUDED.shop_id,
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    summary = EXCLUDED.summary,
    price = EXCLUDED.price,
    photo_url = EXCLUDED.photo_url,
    active = EXCLUDED.active,
    position = EXCLUDED.position;

INSERT INTO product_option (id, product_id, name, detail, kind, extra_price, position)
VALUES
    ('p_lale_o1', 'p_lale', 'Küçük', '15 dal', 'size', 0, 1),
    ('p_lale_o2', 'p_lale', 'Orta', '25 dal', 'size', 33000, 2),
    ('p_lale_o3', 'p_lale', 'Büyük', '40 dal', 'size', 76000, 3),
    ('p_lale_o4', 'p_lale', 'Cam vazo', NULL, 'vase', 18000, 4),
    ('p_lale_o5', 'p_lale', 'El yapımı çikolata, 12 adet', NULL, 'addon', 24000, 5),
    ('p_mevsim_o1', 'p_mevsim', 'Küçük', '9 dal', 'size', 0, 1),
    ('p_mevsim_o2', 'p_mevsim', 'Orta', '15 dal', 'size', 25000, 2),
    ('p_mevsim_o3', 'p_mevsim', 'Büyük', '25 dal', 'size', 55000, 3),
    ('p_mevsim_o4', 'p_mevsim', 'Cam vazo', NULL, 'vase', 18000, 4),
    ('p_mevsim_o5', 'p_mevsim', 'El yapımı çikolata, 12 adet', NULL, 'addon', 24000, 5),
    ('p_beyaz_gul_o1', 'p_beyaz_gul', 'Cam vazo', NULL, 'vase', 18000, 1),
    ('p_beyaz_gul_o2', 'p_beyaz_gul', 'El yapımı çikolata, 12 adet', NULL, 'addon', 24000, 2),
    ('p_kir_o1', 'p_kir', 'Küçük', 'Tek sarım', 'size', 0, 1),
    ('p_kir_o2', 'p_kir', 'Orta', 'Dolgun', 'size', 20000, 2),
    ('p_kir_o3', 'p_kir', 'Büyük', 'Kucak dolusu', 'size', 45000, 3),
    ('p_kir_o4', 'p_kir', 'Cam vazo', NULL, 'vase', 18000, 4),
    ('p_sakayik_o1', 'p_sakayik', 'Cam vazo', NULL, 'vase', 18000, 1)
ON CONFLICT (id) DO UPDATE SET
    product_id = EXCLUDED.product_id,
    name = EXCLUDED.name,
    detail = EXCLUDED.detail,
    kind = EXCLUDED.kind,
    extra_price = EXCLUDED.extra_price,
    position = EXCLUDED.position;

INSERT INTO delivery_zone (id, shop_id, district, neighborhood, fee, active, position)
VALUES
    ('z_osmanaga', 'shop_nergis', 'Kadıköy', 'Osmanağa', 6000, TRUE, 1),
    ('z_caferaga', 'shop_nergis', 'Kadıköy', 'Caferağa', 9000, TRUE, 2),
    ('z_fenerbahce', 'shop_nergis', 'Kadıköy', 'Fenerbahçe', 9000, TRUE, 3),
    ('z_kosuyolu', 'shop_nergis', 'Kadıköy', 'Koşuyolu', 9000, TRUE, 4),
    ('z_goztepe', 'shop_nergis', 'Kadıköy', 'Göztepe', 9000, TRUE, 5),
    ('z_acibadem', 'shop_nergis', 'Üsküdar', 'Acıbadem', 10000, TRUE, 6),
    ('z_kuzguncuk', 'shop_nergis', 'Üsküdar', 'Kuzguncuk', 12000, TRUE, 7),
    ('z_atasehir', 'shop_nergis', 'Ataşehir', NULL, 12000, TRUE, 8)
ON CONFLICT (id) DO UPDATE SET
    shop_id = EXCLUDED.shop_id,
    district = EXCLUDED.district,
    neighborhood = EXCLUDED.neighborhood,
    fee = EXCLUDED.fee,
    active = EXCLUDED.active,
    position = EXCLUDED.position;

INSERT INTO time_slot (id, shop_id, start_time, end_time, capacity)
VALUES
    ('s_sabah', 'shop_nergis', '10:00', '13:00', 6),
    ('s_ogle', 'shop_nergis', '13:00', '16:00', 8),
    ('s_aksam', 'shop_nergis', '16:00', '19:00', 8)
ON CONFLICT (id) DO UPDATE SET
    shop_id = EXCLUDED.shop_id,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    capacity = EXCLUDED.capacity;


INSERT INTO customer (id, shop_id, name, phone, email, note, marketing_consent)
VALUES
    ('cu_ayse', 'shop_nergis', 'Ayşe Demir', '0533 207 41 65', NULL, NULL, TRUE),
    ('cu_kerem', 'shop_nergis', 'Kerem Öztürk', '0541 220 31 03', NULL, NULL, TRUE),
    ('cu_deniz', 'shop_nergis', 'Deniz Arslan', '0505 310 22 47', NULL, NULL, FALSE),
    ('cu_ali', 'shop_nergis', 'Ali Aksoy', '0532 555 18 40', NULL, NULL, TRUE),
    ('cu_gizem', 'shop_nergis', 'Gizem Kaya', '0544 318 09 12', NULL, NULL, TRUE),
    ('cu_hakan', 'shop_nergis', 'Hakan Şahin', '0535 761 44 20', NULL, NULL, FALSE),
    ('cu_burak', 'shop_nergis', 'Burak Çelik', '0532 640 77 15', NULL, NULL, TRUE),
    ('cu_zeynep', 'shop_nergis', 'Zeynep Aksoy', '0536 402 11 58', NULL, NULL, TRUE),
    ('cu_okan', 'shop_nergis', 'Okan Yıldız', '0533 980 12 64', NULL, NULL, TRUE),
    ('cu_nilay', 'shop_nergis', 'Nilay Koç', '0532 111 22 33', NULL, NULL, FALSE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    note = EXCLUDED.note,
    marketing_consent = EXCLUDED.marketing_consent;

-- Demo panel kullanıcıları; şifre "tomurcuk-demo".
INSERT INTO shop_user (id, shop_id, name, email, password_hash, role)
VALUES
    ('su_ayla', 'shop_nergis', 'Ayla Er', 'ayla@nergiscicek.com', '{bcrypt}$2a$10$37i3/8ZTj8VoEmVe8Md.rOT.NH9z1rkPsc3ouAUJUHa0mC4ga7vS2', 'owner'),
    ('su_kemal', 'shop_nergis', 'Kemal Er', 'kemal@nergiscicek.com', '{bcrypt}$2a$10$37i3/8ZTj8VoEmVe8Md.rOT.NH9z1rkPsc3ouAUJUHa0mC4ga7vS2', 'staff'),
    ('su_lale', 'shop_lale', 'Leyla Bahçe', 'leyla@lalebahcesi.com', '{bcrypt}$2a$10$37i3/8ZTj8VoEmVe8Md.rOT.NH9z1rkPsc3ouAUJUHa0mC4ga7vS2', 'owner')
ON CONFLICT (id) DO UPDATE SET
    shop_id = EXCLUDED.shop_id,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role;

-- Demo destek ekibi; şifre "tomurcuk-demo", iki adımlı doğrulama anahtarı JBSWY3DPEHPK3PXP (herhangi bir doğrulayıcı uygulamaya eklenir).
INSERT INTO platform_user (id, name, email, password_hash, totp_secret, role)
VALUES
    ('pu_selin', 'Selin Karaca', 'selin@tomurcuk.app', '{bcrypt}$2a$10$37i3/8ZTj8VoEmVe8Md.rOT.NH9z1rkPsc3ouAUJUHa0mC4ga7vS2', 'JBSWY3DPEHPK3PXP', 'agent'),
    ('pu_mert', 'Mert Arslan', 'mert@tomurcuk.app', '{bcrypt}$2a$10$37i3/8ZTj8VoEmVe8Md.rOT.NH9z1rkPsc3ouAUJUHa0mC4ga7vS2', 'JBSWY3DPEHPK3PXP', 'agent'),
    ('pu_derya', 'Derya Kılıç', 'derya@tomurcuk.app', '{bcrypt}$2a$10$37i3/8ZTj8VoEmVe8Md.rOT.NH9z1rkPsc3ouAUJUHa0mC4ga7vS2', 'JBSWY3DPEHPK3PXP', 'lead')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash,
    totp_secret = EXCLUDED.totp_secret, role = EXCLUDED.role;

INSERT INTO canned_reply (id, title, text, category)
VALUES
    ('cr_1', 'Adres teyidi', 'Merhaba, gönderenle iletişime geçip adresi teyit ediyoruz. 5 dakika içinde size dönüyoruz; kurye bu arada bölgede beklesin.', 'delivery'),
    ('cr_2', 'Ödeme sorgulanıyor', 'Merhaba, ödemeyi sağlayıcının kayıtlarından sorguluyoruz. Ödeme alındıysa sipariş birkaç dakika içinde panelinize düşer; size ayrıca haber vereceğiz.', 'payment'),
    ('cr_3', 'Kısmi iade', 'Sipariş detayında "İade başlat" ile iade edilecek tutarı girebilirsiniz. İade toplamı ödenen tutarı aşamaz; her iade ayrı kaydedilir.', 'payment'),
    ('cr_4', 'Teslimat bölgesi ekleme', 'Ayarlar, Teslimat bölgeleri bölümünden ilçeyi seçip teslim ettiğiniz mahalleleri ve ücreti girebilirsiniz.', 'account')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, text = EXCLUDED.text, category = EXCLUDED.category;

-- Ödeme hesabı onaylı dükkânlar (demo alt üye işyeri anahtarları).
INSERT INTO shop_payment_account (shop_id, iyzico_sub_merchant_key)
VALUES
    ('shop_nergis', 'demo-shop_nergis'),
    ('shop_lale', 'demo-shop_lale'),
    ('shop_begonvil', 'demo-shop_begonvil'),
    ('shop_orkide', 'demo-shop_orkide')
ON CONFLICT (shop_id) DO UPDATE SET iyzico_sub_merchant_key = EXCLUDED.iyzico_sub_merchant_key;

-- Dükkânların Tomurcuk'a katıldığı gün.
UPDATE shop SET created_at = '2025-08-04T09:00:00+03:00' WHERE id = 'shop_nergis';
UPDATE shop SET created_at = '2025-09-12T09:00:00+03:00' WHERE id = 'shop_lale';
UPDATE shop SET created_at = '2026-01-20T09:00:00+03:00' WHERE id = 'shop_papatya';
UPDATE shop SET created_at = '2026-03-02T09:00:00+03:00' WHERE id = 'shop_begonvil';
UPDATE shop SET created_at = '2025-11-15T09:00:00+03:00' WHERE id = 'shop_orkide';

-- Alıcı ana sayfasında Nergis'in yanında görünen iki dükkân: Kadıköy'e de teslim ederler.
-- Begonvil aynı gün akşam aralığına, Lale Bahçesi karşı yakaya ertesi günden itibaren.
UPDATE shop SET
    description = 'Ataşehir''de saksı bitkileri ve kuru çiçek aranjmanları. Kadıköy ve Ataşehir''e aynı gün teslim ediyoruz.',
    description_short = 'Saksı bitkileri ve kuru çiçek aranjmanları.',
    featured_product_id = 'p_bg_monstera'
WHERE id = 'shop_begonvil';
UPDATE shop SET
    description = 'Beşiktaş''ta mevsim lalesi ve kır buketleri. Anadolu yakasına ertesi gün teslim ediyoruz.',
    description_short = 'Mevsim lalesi ve kır buketleri; Anadolu yakasına ertesi gün.',
    featured_product_id = 'p_lb_lale'
WHERE id = 'shop_lale';

INSERT INTO category (id, shop_id, slug, name, position)
VALUES
    ('c_bg_saksi', 'shop_begonvil', 'saksi-bitkileri', 'Saksı bitkileri', 1),
    ('c_bg_kuru', 'shop_begonvil', 'kuru-cicek', 'Kuru çiçek', 2),
    ('c_lb_buket', 'shop_lale', 'buketler', 'Buketler', 1)
ON CONFLICT (id) DO UPDATE SET
    shop_id = EXCLUDED.shop_id,
    slug = EXCLUDED.slug,
    name = EXCLUDED.name,
    position = EXCLUDED.position;

INSERT INTO product (id, shop_id, category_id, name, description, summary, price, photo_url, active, position)
VALUES
    ('p_bg_monstera', 'shop_begonvil', 'c_bg_saksi', 'Monstera', 'Seramik saksıda, 60 cm. Bakım kartıyla gelir.', 'Saksıda, 60 cm', 110000, NULL, TRUE, 1),
    ('p_bg_kuru', 'shop_begonvil', 'c_bg_kuru', 'Kuru çiçek kutusu', 'Lavanta, pampas ve kuru güller; kutuda aylarca durur.', 'Kutuda, aylarca durur', 76000, NULL, TRUE, 2),
    ('p_bg_kir', 'shop_begonvil', 'c_bg_kuru', 'Kır buketi', 'Mevsimin kır çiçekleri, kraft sarımlı.', 'Aynı gün', 65000, NULL, TRUE, 3),
    ('p_lb_lale', 'shop_lale', 'c_lb_buket', 'Beyaz lale', 'Hollanda beyaz lalesi, 20 dal.', '20 dal', 69000, NULL, TRUE, 1),
    ('p_lb_papatya', 'shop_lale', 'c_lb_buket', 'Papatya kutusu', 'Papatya ve okaliptüs, kutuda.', 'Kutuda', 54000, NULL, TRUE, 2),
    ('p_lb_kir', 'shop_lale', 'c_lb_buket', 'Kır buketi', 'Mevsimin kır çiçekleri.', 'Mevsiminde', 62000, NULL, TRUE, 3)
ON CONFLICT (id) DO UPDATE SET
    shop_id = EXCLUDED.shop_id,
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    summary = EXCLUDED.summary,
    price = EXCLUDED.price,
    photo_url = EXCLUDED.photo_url,
    active = EXCLUDED.active,
    position = EXCLUDED.position;

INSERT INTO delivery_zone (id, shop_id, district, neighborhood, fee, active, position)
VALUES
    ('z_bg_atasehir', 'shop_begonvil', 'Ataşehir', NULL, 6000, TRUE, 1),
    ('z_bg_kadikoy', 'shop_begonvil', 'Kadıköy', NULL, 12000, TRUE, 2),
    ('z_lb_besiktas', 'shop_lale', 'Beşiktaş', NULL, 5000, TRUE, 1),
    ('z_lb_caferaga', 'shop_lale', 'Kadıköy', 'Caferağa', 15000, TRUE, 2),
    ('z_lb_moda', 'shop_lale', 'Kadıköy', 'Moda', 15000, TRUE, 3)
ON CONFLICT (id) DO UPDATE SET
    shop_id = EXCLUDED.shop_id,
    district = EXCLUDED.district,
    neighborhood = EXCLUDED.neighborhood,
    fee = EXCLUDED.fee,
    active = EXCLUDED.active,
    position = EXCLUDED.position;

-- Lale Bahçesi'nin aynı gün son saati 08:00: Anadolu yakasına bugün teslim etmez.
UPDATE shop SET same_day_cutoff = '08:00' WHERE id = 'shop_lale';

INSERT INTO time_slot (id, shop_id, start_time, end_time, capacity)
VALUES
    ('s_bg_aksam', 'shop_begonvil', '16:00', '19:00', 6),
    ('s_lb_sabah', 'shop_lale', '10:00', '13:00', 4),
    ('s_lb_ogle', 'shop_lale', '13:00', '16:00', 4)
ON CONFLICT (id) DO UPDATE SET
    shop_id = EXCLUDED.shop_id,
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    capacity = EXCLUDED.capacity;

-- Ürün fotoğraflarının listesi; ilki kapak (V14). Örnek ürünlerin tek fotoğrafı var.
UPDATE product SET photos = ARRAY[photo_url] WHERE photo_url IS NOT NULL AND photos = '{}';

-- Sözleşmelerdeki satıcı bilgileri (V15). Örnek değerlerdir.
UPDATE shop SET legal_name = 'Nergis Çiçekçilik - Ayla Er', tax_office = 'Kadıköy', tax_number = '1234567890',
    email = 'merhaba@nergiscicek.com'
WHERE id = 'shop_nergis' AND legal_name = '';
UPDATE shop SET legal_name = 'Lale Bahçesi Çiçekçilik - Leyla Bahçe', tax_office = 'Beşiktaş', tax_number = '9876543210',
    email = 'merhaba@lalebahcesi.com'
WHERE id = 'shop_lale' AND legal_name = '';
UPDATE shop SET legal_name = 'Begonvil Atölye - Deniz Kaya', tax_office = 'Kozyatağı', tax_number = '5554443332',
    email = 'merhaba@begonvilatolye.com'
WHERE id = 'shop_begonvil' AND legal_name = '';
