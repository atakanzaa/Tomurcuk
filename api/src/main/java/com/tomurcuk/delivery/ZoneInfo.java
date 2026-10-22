package com.tomurcuk.delivery;

/** Siparişe kopyalanan bölge bilgisi; ücret kuruş. Mahalle düzeyinde değilse `neighborhood` boştur. */
public record ZoneInfo(String id, String district, String neighborhood, long fee) {
}
