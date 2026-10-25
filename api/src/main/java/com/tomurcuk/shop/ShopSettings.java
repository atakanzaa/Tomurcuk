package com.tomurcuk.shop;

import java.time.Clock;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Map;
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
			String description, String openingHours, String featuredProductId, String legalName, String taxOffice,
			String taxNumber, String email, String notifyPhone, Boolean notifySms) {
	}

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
		String featured = in.featuredProductId() == null || in.featuredProductId().isBlank() ? null
				: in.featuredProductId();
		shop.updateProfile(name, shortName, phone, address, descriptionShort, description, openingHours, featured,
				legalName, taxOffice, taxNumber, email, notifyPhone, notifySms);
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
