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

