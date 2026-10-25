-- Dükkânın durumu destek ekibinden değişir (docs/backend.md "Dükkân durumu"):
-- open: açık; paused: siparişe geçici kapalı (paused_until gelince kendiliğinden açık sayılır);
-- suspended: askıda, vitrinde yalnızca adı; closed: kalıcı kapalı, vitrin 404, panel girişi yok.
ALTER TABLE shop
    ADD COLUMN status            VARCHAR(16)  NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'paused', 'suspended', 'closed')),
    ADD COLUMN status_reason     VARCHAR(500) NOT NULL DEFAULT '',
    ADD COLUMN paused_until      TIMESTAMPTZ,
    ADD COLUMN status_changed_at TIMESTAMPTZ,
    ADD COLUMN status_changed_by VARCHAR(120);

UPDATE shop SET status = 'suspended' WHERE NOT active;

ALTER TABLE shop DROP COLUMN active;
