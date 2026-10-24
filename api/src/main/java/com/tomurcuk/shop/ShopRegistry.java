package com.tomurcuk.shop;

import java.time.Clock;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Texts;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.internal.Shop;
import com.tomurcuk.shop.internal.ShopRepository;
import com.tomurcuk.shop.internal.ShopSlugHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Yeni dükkân kaydı (destek panelinden dükkân açma). Yetki denetimini çağıran yapar. */
@Service
public class ShopRegistry {

	private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");

	/** Kök düzeyde dükkân adresi olamayacak yollar; web/lib/routes.ts `RESERVED_SEGMENTS` ile aynı. */
	private static final Set<String> RESERVED = Set.of("_next", "api", "panel", "destek", "bilesenler", "giris",
			"cicekciler", "foto", "gizlilik", "kullanim-kosullari", "sifre");

	private static final LocalTime DEFAULT_CUTOFF = LocalTime.of(15, 0);

	private final ShopRepository shops;

	private final ShopSlugHistoryRepository slugHistory;

	private final Clock clock;

	ShopRegistry(ShopRepository shops, ShopSlugHistoryRepository slugHistory, Clock clock) {
		this.shops = shops;
		this.slugHistory = slugHistory;
		this.clock = clock;
	}

	/** `slug`: dükkânın adresi, alanadi.com/<slug>. */
	public record NewShop(String name, String shortName, String slug, String phone, String address) {
	}

	/**
	 * Pilot planında, aynı gün son saati 15:00 olarak açar. Hatalar alan alan; adres için
	 * `slug_invalid` (biçim ya da ayrılmış kelime) ve `slug_taken`.
	 */
	@Transactional
	public String create(NewShop in) {
		Map<String, FieldError> errors = new LinkedHashMap<>();
		String name = Texts.check(errors, "name", in.name(), 120, true);
		String shortName = Texts.check(errors, "shortName", in.shortName(), 60, true);
		String phone = Texts.phone(errors, "phone", in.phone());
		String address = Texts.check(errors, "address", in.address(), 300, true);
		String slug = in.slug() == null ? "" : in.slug().strip();
		if (slug.isEmpty()) {
			errors.put("slug", FieldError.of("required"));
		}
		else if (slug.length() < 3 || slug.length() > 40 || !SLUG.matcher(slug).matches() || RESERVED.contains(slug)) {
			errors.put("slug", FieldError.of("slug_invalid"));
		}
		else if (shops.existsBySlug(slug) || slugHistory.existsById(slug)) {
			errors.put("slug", FieldError.of("slug_taken"));
		}
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		String id = Ids.newId();
		// Sahibin hesabı JDBC ile yazıldığı için dükkân hemen veritabanına iner.
		shops.saveAndFlush(new Shop(id, slug, name, shortName, phone, address, ShopPlan.PILOT, DEFAULT_CUTOFF,
				"Europe/Istanbul", clock.instant()));
		return id;
	}
}
