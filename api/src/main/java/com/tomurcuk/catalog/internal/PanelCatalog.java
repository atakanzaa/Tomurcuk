package com.tomurcuk.catalog.internal;

import java.text.Normalizer;
import java.time.Clock;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.tomurcuk.catalog.OptionKind;
import com.tomurcuk.identity.Permission;
import com.tomurcuk.identity.ShopPrincipal;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Texts;
import com.tomurcuk.shared.ValidationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Panelden ürün yönetimi. Okumayı dükkânın herkesi yapar; ekleme, düzenleme, silme ve fotoğraf
 * yükleme `CATALOG_EDIT` ister (dükkân sahibi). Dükkân oturumdan gelir; başka dükkânın ürünü
 * bulunamaz.
 *
 * Formda boyların fiyatı tamdır ("Küçük 850 TL, Orta 1.100 TL"). Kayıtta ürünün fiyatı en ucuz
 * boyun fiyatı, boyların ek fiyatı aradaki farktır; vitrin ve sipariş bu modeli okur.
 */
@Service
@Transactional(readOnly = true)
public class PanelCatalog {

	private static final Logger log = LoggerFactory.getLogger(PanelCatalog.class);

	/** 100.000 TL, kuruş. */
	static final long MAX_PRICE = 10_000_000L;

	static final int MAX_PHOTOS = 4;

	static final int MAX_CHOICES = 10;

	private static final Locale TR = Locale.forLanguageTag("tr");

	private final ProductRepository products;

	private final CategoryRepository categories;

	private final PhotoStore photos;

	private final Clock clock;

	PanelCatalog(ProductRepository products, CategoryRepository categories, PhotoStore photos, Clock clock) {
		this.products = products;
		this.categories = categories;
		this.photos = photos;
		this.clock = clock;
	}

	/** Boy ya da ek seçenek. Boyda `price` tam fiyat, ek seçenekte ek ücrettir; kuruş. */
	public record Choice(String id, String name, Long price) {
	}

	/**
	 * `categoryId` boşsa `newCategory` adıyla kategori açılır. `sizes` boşsa ürünün tek fiyatı
	 * `price`'tır. `photos` sırayla en çok dört adres; ilki kapak.
	 */
	public record ProductInput(String categoryId, String newCategory, String name, String summary,
			String description, Long price, List<Choice> sizes, List<Choice> extras, List<String> photos,
			Boolean active) {
	}

	public List<Product> list(ShopPrincipal user) {
		return products.findByShopIdAndDeletedAtIsNullOrderByPosition(user.shopId());
	}

	public Optional<Product> get(ShopPrincipal user, String productId) {
		return products.findByIdAndShopIdAndDeletedAtIsNull(productId, user.shopId());
	}

	@Transactional
	public Product create(ShopPrincipal user, ProductInput input) {
		requireEdit(user);
		Product product = new Product(Ids.newId(), user.shopId(), products.maxPosition(user.shopId()) + 1);
		apply(user, product, input);
		return products.save(product);
	}

	@Transactional
	public Optional<Product> update(ShopPrincipal user, String productId, ProductInput input) {
		requireEdit(user);
		return get(user, productId).map(product -> {
			apply(user, product, input);
			return product;
		});
	}

	@Transactional
	public boolean delete(ShopPrincipal user, String productId) {
		requireEdit(user);
		return get(user, productId).map(product -> {
			product.delete(clock.instant(), user.name());
			return true;
		}).orElse(false);
	}

	/** Fotoğrafı 4:5 JPEG'e çevirip depoya yazar; adresi ürün kaydedilirken listeye girer. */
	public String uploadPhoto(ShopPrincipal user, byte[] content) {
		requireEdit(user);
		byte[] jpeg;
		try {
			jpeg = PhotoImages.toProductJpeg(content);
		}
		catch (PhotoImages.InvalidPhoto ex) {
			log.info("Fotoğraf reddedildi ({}): {}", user.shopId(), ex.getMessage());
			throw ValidationException.of("photo", FieldError.of("photo_invalid"));
		}
		return photos.put(Ids.newId().toLowerCase(Locale.ROOT) + ".jpg", jpeg);
	}

	private void apply(ShopPrincipal user, Product product, ProductInput input) {
		Map<String, FieldError> errors = new LinkedHashMap<>();
		String name = Texts.check(errors, "name", input.name(), 80, true);
		String summary = Texts.check(errors, "summary", input.summary(), 80, false);
		String description = Texts.check(errors, "description", input.description(), 1000, false);
		String categoryId = category(user, input, errors);
		List<Choice> sizes = choices(errors, "sizes", input.sizes(), 1);
		List<Choice> extras = choices(errors, "extras", input.extras(), 0);
		Long single = input.price();
		if (sizes.isEmpty() && (single == null || single < 1 || single > MAX_PRICE)) {
			errors.put("price", FieldError.of(single == null ? "required" : "price_invalid"));
		}
		List<String> photoUrls = input.photos() == null ? List.of() : input.photos();
		Set<String> current = new HashSet<>(product.getPhotos());
		if (photoUrls.size() > MAX_PHOTOS) {
			errors.put("photos", FieldError.of("too_many", Map.of("max", MAX_PHOTOS)));
		}
		else if (photoUrls.stream().anyMatch(url -> url == null || !(current.contains(url) || photos.owns(url)))) {
			errors.put("photos", FieldError.of("photo_invalid"));
		}
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		long base = sizes.isEmpty() ? single : sizes.stream().mapToLong(Choice::price).min().orElseThrow();
		product.update(categoryId, name, summary, description, base, photoUrls,
				input.active() == null || input.active(), clock.instant(), user.name());
		replaceOptions(product, sizes, extras, base);
	}

	/** Var olan kategori ya da aynı adla açılmış olan; yoksa yenisi. */
	private String category(ShopPrincipal user, ProductInput input, Map<String, FieldError> errors) {
		if (input.categoryId() != null && !input.categoryId().isBlank()) {
			Optional<Category> found = categories.findByIdAndShopId(input.categoryId(), user.shopId());
			if (found.isEmpty()) {
				errors.put("category", FieldError.of("option_invalid"));
				return null;
			}
			return found.get().getId();
		}
		String name = Texts.check(errors, "category", input.newCategory(), 40, true);
		if (errors.containsKey("category")) {
			return null;
		}
		return categories.findByShopIdAndNameIgnoreCase(user.shopId(), name).map(Category::getId).orElseGet(() -> {
			List<Category> all = categories.findByShopIdOrderByPosition(user.shopId());
			int position = all.isEmpty() ? 1 : all.getLast().getPosition() + 1;
			return categories.save(new Category(Ids.newId(), user.shopId(), slug(user.shopId(), name), name, position))
				.getId();
		});
	}

	private String slug(String shopId, String name) {
		String base = Normalizer.normalize(name.toLowerCase(TR).replace('ı', 'i'), Normalizer.Form.NFD)
			.replaceAll("\\p{M}", "")
			.replaceAll("[^a-z0-9]+", "-")
			.replaceAll("(^-|-$)", "");
		String slug = base.isEmpty() ? "kategori" : base;
		for (int i = 2; categories.existsByShopIdAndSlug(shopId, slug); i++) {
			slug = base + "-" + i;
		}
		return slug;
	}

	/** Satırların adı zorunlu, fiyatı `min` ile 100.000 TL arasında; hata alana tek kodla yazılır. */
	private static List<Choice> choices(Map<String, FieldError> errors, String field, List<Choice> input, long min) {
		List<Choice> rows = input == null ? List.of() : input.stream()
			.map(c -> new Choice(c.id(), c.name() == null ? "" : c.name().strip(), c.price()))
			.toList();
		if (rows.size() > MAX_CHOICES) {
			errors.put(field, FieldError.of("too_many", Map.of("max", MAX_CHOICES)));
		}
		else if (rows.stream()
			.anyMatch(c -> c.name().isEmpty() || c.name().length() > 80 || c.price() == null || c.price() < min
					|| c.price() > MAX_PRICE)) {
			errors.put(field, FieldError.of("option_invalid"));
		}
		return rows;
	}

	/**
	 * Satırlar sırayla yazılır; kimliği gelen seçenek güncellenir, gelmeyen silinir. Taslakta
	 * silinen seçenek kalırsa sipariş adımı onu "artık yok" diye reddeder.
	 */
	private static void replaceOptions(Product product, List<Choice> sizes, List<Choice> extras, long base) {
		Map<String, ProductOption> existing = product.getOptions()
			.stream()
			.collect(Collectors.toMap(ProductOption::getId, Function.identity()));
		List<ProductOption> next = new ArrayList<>();
		int position = 0;
		for (Choice size : sizes) {
			ProductOption option = reuse(product, existing, size.id());
			String[] parts = size.name().split(",", 2);
			String detail = parts.length > 1 && !parts[1].isBlank() ? parts[1].strip() : null;
			option.update(parts[0].strip(), detail, OptionKind.SIZE, size.price() - base, position++);
			next.add(option);
		}
		for (Choice extra : extras) {
			ProductOption option = reuse(product, existing, extra.id());
			OptionKind kind = option.getKind() != null && option.getKind() != OptionKind.SIZE ? option.getKind()
					: extra.name().toLowerCase(TR).contains("vazo") ? OptionKind.VASE : OptionKind.ADDON;
			option.update(extra.name(), null, kind, extra.price(), position++);
			next.add(option);
		}
		product.getOptions().clear();
		product.getOptions().addAll(next);
	}

	private static ProductOption reuse(Product product, Map<String, ProductOption> existing, String id) {
		ProductOption option = id == null ? null : existing.remove(id);
		return option != null ? option : new ProductOption(Ids.newId(), product);
	}

	private static void requireEdit(ShopPrincipal user) {
		if (!user.can(Permission.CATALOG_EDIT)) {
			throw new AccessDeniedException("Ürünleri yalnızca dükkân sahibi değiştirir");
		}
	}
}
