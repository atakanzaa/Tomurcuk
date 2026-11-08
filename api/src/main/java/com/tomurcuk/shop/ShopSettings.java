package com.tomurcuk.shop;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.regex.Pattern;

import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Phones;
import com.tomurcuk.shared.Texts;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.internal.Shop;
import com.tomurcuk.shop.internal.ShopRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Panelden dükkân bilgileri, sözleşmelerdeki satıcı bilgileri ve yeni sipariş bildirimi. Yetki
 * denetimini çağıran yapar (settings modülü); öne çıkan ürünün dükkâna ait olduğunu da o doğrular.
 */
@Service
@Transactional(readOnly = true)
public class ShopSettings {

	private static final Pattern EMAIL = Pattern.compile("[^@\\s]+@[^@\\s]+\\.[^@\\s]+");

	/** Vergi kimlik numarası 10, T.C. kimlik numarası (şahıs şirketi) 11 hane. */
	private static final Pattern TAX_NUMBER = Pattern.compile("\\d{10,11}");

	private final ShopRepository shops;

	private final Clock clock;

	ShopSettings(ShopRepository shops, Clock clock) {
		this.shops = shops;
		this.clock = clock;
	}

	/** Panelde düzenlenen hal: vitrindeki bilgiler ve yalnızca dükkânın gördüğü bildirim ayarı. */
	public record Profile(ShopView shop, String notifyPhone, boolean notifySms) {
	}

	public record ProfileInput(String name, String shortName, String phone, String address, String descriptionShort,
			String description, String openingHours, String legalName, String taxOffice, String taxNumber, String email,
			String notifyPhone, Boolean notifySms) {
	}

	/** Dükkânın sayfası; fotoğraf adresleri panelden yüklenenler ya da kayıtlı olanlardır. */
	public record PageInput(String logoUrl, String coverPhotoUrl, String story, Integer foundedYear,
			List<String> storyPhotos, String featuredProductId, String favoriteNote) {
	}

	static final int MAX_STORY_PHOTOS = 3;

	/** Vitrinin görünümü; panelde "Dükkânınızın görünümü". */
	public record AppearanceInput(String themeMode, String layout, String instagram, String whatsapp,
			String shareDescription) {
	}

	static final Set<String> THEME_MODES = Set.of("cover", "tomurcuk");

	static final Set<String> LAYOUTS = Set.of("cover", "story", "products");

	/** Instagram kullanıcı adı: harf, rakam, nokta ve alt çizgi; başındaki @ ve adres kısmı atılır. */
	private static final Pattern INSTAGRAM = Pattern.compile("[A-Za-z0-9._]{1,30}");

	public Profile profile(String shopId) {
		Shop shop = shops.findById(shopId).orElseThrow();
		return new Profile(ShopView.of(shop, clock.instant()), shop.getNotifyPhone(), shop.isNotifySms());
	}

	/** Alan alan doğrulanır; hata kodları web/lib/api/types.ts `CheckoutError`. */
	@Transactional
	public void updateProfile(String shopId, ProfileInput in) {
		Map<String, FieldError> errors = new LinkedHashMap<>();
		String name = Texts.check(errors, "name", in.name(), 120, true);
		String shortName = Texts.check(errors, "shortName", in.shortName(), 60, true);
		String phone = Texts.phone(errors, "phone", in.phone());
		String address = Texts.check(errors, "address", in.address(), 300, true);
		String descriptionShort = Texts.check(errors, "descriptionShort", in.descriptionShort(), 160, false);
		String description = Texts.check(errors, "description", in.description(), 1000, false);
		String openingHours = Texts.check(errors, "openingHours", in.openingHours(), 120, false);
		String legalName = Texts.check(errors, "legalName", in.legalName(), 160, false);
		String taxOffice = Texts.check(errors, "taxOffice", in.taxOffice(), 80, false);
		String taxNumber = in.taxNumber() == null ? "" : in.taxNumber().replaceAll("\\s", "");
		if (!taxNumber.isEmpty() && !TAX_NUMBER.matcher(taxNumber).matches()) {
			errors.put("taxNumber", FieldError.of("tax_number_invalid"));
		}
		String email = Texts.check(errors, "email", in.email(), 160, false);
		if (!email.isEmpty() && !EMAIL.matcher(email).matches()) {
			errors.put("email", FieldError.of("email_invalid"));
		}
		boolean notifySms = Boolean.TRUE.equals(in.notifySms());
		String notifyPhone = null;
		if (notifySms || (in.notifyPhone() != null && !in.notifyPhone().isBlank())) {
			notifyPhone = Texts.phone(errors, "notifyPhone", in.notifyPhone());
		}
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		Shop shop = shops.findById(shopId).orElseThrow();
		shop.updateProfile(name, shortName, phone, address, descriptionShort, description, openingHours, legalName,
				taxOffice, taxNumber, email, notifyPhone, notifySms);
	}

	/**
	 * Hatalar: `themeMode`, `layout` (`option_invalid`), `instagram` (`option_invalid`),
	 * `whatsapp` (`phone_invalid`), `shareDescription` (`too_long`).
	 */
	@Transactional
	public void updateAppearance(String shopId, AppearanceInput in) {
		Map<String, FieldError> errors = new LinkedHashMap<>();
		if (in.themeMode() == null || !THEME_MODES.contains(in.themeMode())) {
			errors.put("themeMode", FieldError.of("option_invalid"));
		}
		if (in.layout() == null || !LAYOUTS.contains(in.layout())) {
			errors.put("layout", FieldError.of("option_invalid"));
		}
		String instagram = instagramHandle(in.instagram());
		if (!instagram.isEmpty() && !INSTAGRAM.matcher(instagram).matches()) {
			errors.put("instagram", FieldError.of("option_invalid"));
		}
		String whatsapp = null;
		if (in.whatsapp() != null && !in.whatsapp().isBlank()) {
			whatsapp = Texts.phone(errors, "whatsapp", in.whatsapp());
		}
		String share = Texts.check(errors, "shareDescription", in.shareDescription(), 160, false);
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		shops.findById(shopId).orElseThrow().updateAppearance(in.themeMode(), in.layout(), instagram, whatsapp, share);
	}

	/** "@nergiscicek", "instagram.com/nergiscicek/" → "nergiscicek". */
	static String instagramHandle(String value) {
		if (value == null) {
			return "";
		}
		String handle = value.strip().replaceFirst("(?i)^(https?://)?(www\\.)?instagram\\.com/", "")
			.replaceFirst("^@", "");
		int end = handle.indexOf('/');
		return (end >= 0 ? handle.substring(0, end) : handle).split("\\?")[0];
	}

	/**
	 * Hatalar: `story`, `favoriteNote` (`too_long`), `foundedYear` (`option_invalid`: 1900 ile bu yıl
	 * arası), `storyPhotos` (`too_many`, `photo_invalid`), `coverPhotoUrl`, `logoUrl` (`photo_invalid`).
	 * `ownPhoto`: adres Tomurcuk'un deposundan mı; kayıtlı adres her zaman kabul edilir. Öne çıkan
	 * ürünün dükkâna ait olduğunu çağıran doğrular.
	 * `coverColor`: depodaki kapak adresinden baskın renk. Kapak değişmediyse kayıtlı renk kalır
	 * (örnek veride elle girilmiş renk de).
	 */
	@Transactional
	public void updatePage(String shopId, PageInput in, Predicate<String> ownPhoto,
			Function<String, Optional<String>> coverColor) {
		Shop shop = shops.findById(shopId).orElseThrow();
		Set<String> current = new HashSet<>(shop.getStoryPhotos());
		Optional.ofNullable(shop.getCoverPhotoUrl()).ifPresent(current::add);
		Optional.ofNullable(shop.getLogoUrl()).ifPresent(current::add);
		Predicate<String> allowed = url -> current.contains(url) || ownPhoto.test(url);
		Map<String, FieldError> errors = new LinkedHashMap<>();
		String story = Texts.check(errors, "story", in.story(), 1500, false);
		String note = Texts.check(errors, "favoriteNote", in.favoriteNote(), 200, false);
		Integer year = in.foundedYear();
		if (year != null && (year < 1900 || year > LocalDate.now(clock).getYear())) {
			errors.put("foundedYear", FieldError.of("option_invalid"));
		}
		List<String> photos = in.storyPhotos() == null ? List.of() : in.storyPhotos();
		if (photos.size() > MAX_STORY_PHOTOS) {
			errors.put("storyPhotos", FieldError.of("too_many", Map.of("max", MAX_STORY_PHOTOS)));
		}
		else if (photos.stream().anyMatch(url -> url == null || !allowed.test(url))) {
			errors.put("storyPhotos", FieldError.of("photo_invalid"));
		}
		String cover = blankToNull(in.coverPhotoUrl());
		if (cover != null && !allowed.test(cover)) {
			errors.put("coverPhotoUrl", FieldError.of("photo_invalid"));
		}
		String logo = blankToNull(in.logoUrl());
		if (logo != null && !allowed.test(logo)) {
			errors.put("logoUrl", FieldError.of("photo_invalid"));
		}
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		String color = cover == null ? null
				: cover.equals(shop.getCoverPhotoUrl()) && shop.getCoverColor() != null ? shop.getCoverColor()
						: coverColor.apply(cover).orElse(null);
		shop.updatePage(logo, cover, color, story, year, photos, blankToNull(in.featuredProductId()), note);
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

	/** "HH:mm"; geçersizse `sameDayCutoff` alanında `option_invalid`. */
	@Transactional
	public void updateSameDayCutoff(String shopId, String cutoff) {
		LocalTime time;
		try {
			time = LocalTime.parse(cutoff == null ? "" : cutoff.strip());
		}
		catch (DateTimeParseException ex) {
			throw ValidationException.of("sameDayCutoff", FieldError.of("option_invalid"));
		}
		shops.findById(shopId).orElseThrow().updateSameDayCutoff(time);
	}

	/** Bildirim telefonu yoksa SMS gönderilmez. */
	public java.util.Optional<String> newOrderSmsPhone(String shopId) {
		return shops.findById(shopId).filter(Shop::isNotifySms).map(Shop::getNotifyPhone).flatMap(Phones::normalize);
	}
}
