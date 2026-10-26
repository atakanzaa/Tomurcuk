-- E-postaların HTML sürümü; düz metin `text`'te kalır. Yeniden denemede aynı HTML gider. SMS'te boş.
ALTER TABLE notification_log ADD COLUMN html TEXT;
