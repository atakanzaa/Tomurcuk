-- Panelden teslimat ayarları. Kaldırılan saat aralığı silinmez, pasife alınır: günlük doluluk
-- (slot_capacity) ve siparişler aralığa bağlıdır. Aynı başlangıç saati yalnızca aktif
-- aralıklarda tek olur.
ALTER TABLE time_slot
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE time_slot DROP CONSTRAINT time_slot_shop_id_start_time_key;
CREATE UNIQUE INDEX time_slot_active_start_idx ON time_slot (shop_id, start_time) WHERE active;
