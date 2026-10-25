package com.tomurcuk.shop.internal;

import java.time.Instant;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import com.tomurcuk.shop.ShopPlan;
import com.tomurcuk.shop.ShopStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "shop")
public class Shop {

	@Id
	private String id;

	private String slug;

	private String name;

	private String shortName;

	private String phone;

	private String address;

	private String logoUrl;

	private ShopStatus status;

	/** Destek ekibinin yazdığı gerekçe; askıdaki dükkânın panelinde görünür, vitrinde görünmez. */
	private String statusReason;

	/** Geçici kapatmanın bittiği an; geçince dükkân açık sayılır. */
	private Instant pausedUntil;

	private Instant statusChangedAt;

	private String statusChangedBy;

	private ShopPlan plan;

	private LocalTime sameDayCutoff;

	private String timeZone;

	private String description;

	private String descriptionShort;

	private String openingHours;

	private String featuredProductId;

	/** Dükkânın sayfası: kapak (3:2), hikâye, kuruluş yılı, atölye fotoğrafları (1:1), favori notu. */
	private String coverPhotoUrl;

	private String story;

	private Integer foundedYear;

	@JdbcTypeCode(SqlTypes.ARRAY)
	private List<String> storyPhotos = new ArrayList<>();

	private String favoriteNote;

	/** Sözleşmelerde satıcı: unvan ya da ad soyad, vergi dairesi ve numarası, e-posta. */
	private String legalName;

	private String taxOffice;

	private String taxNumber;

	private String email;

	/** Yeni siparişte SMS'in gittiği cep telefonu; `notifySms` kapalıysa kullanılmaz. */
	private String notifyPhone;

	private boolean notifySms;

	private Instant createdAt;

	@OneToMany
	@JoinColumn(name = "shop_id")
	private List<ShopSlugHistory> previousSlugs = new ArrayList<>();

	protected Shop() {
	}

	/** Destekten açılan dükkân; bilgilerin geri kalanını sahibi panelden doldurur. */
	public Shop(String id, String slug, String name, String shortName, String phone, String address, ShopPlan plan,
			LocalTime sameDayCutoff, String timeZone, Instant createdAt) {
		this.id = id;
		this.slug = slug;
		this.name = name;
		this.shortName = shortName;
		this.phone = phone;
		this.address = address;
		this.status = ShopStatus.OPEN;
		this.statusReason = "";
		this.plan = plan;
		this.sameDayCutoff = sameDayCutoff;
		this.timeZone = timeZone;
		this.description = "";
		this.descriptionShort = "";
		this.openingHours = "";
		this.legalName = "";
		this.taxOffice = "";
		this.taxNumber = "";
		this.email = "";
		this.story = "";
		this.favoriteNote = "";
		this.createdAt = createdAt;
	}

	public String getId() {
		return id;
	}

	public String getSlug() {
		return slug;
	}

	public String getName() {
		return name;
	}

	public String getShortName() {
		return shortName;
	}

	public String getPhone() {
		return phone;
	}

	public String getAddress() {
		return address;
	}

	public String getLogoUrl() {
		return logoUrl;
	}

	/** Süresi geçen geçici kapatma açık sayılır. */
	public ShopStatus effectiveStatus(Instant now) {
		if (status == ShopStatus.PAUSED && pausedUntil != null && !now.isBefore(pausedUntil)) {
			return ShopStatus.OPEN;
		}
		return status;
	}

	public String getStatusReason() {
		return statusReason;
	}

	public Instant getPausedUntil() {
		return pausedUntil;
	}

	public Instant getStatusChangedAt() {
		return statusChangedAt;
	}

	public String getStatusChangedBy() {
		return statusChangedBy;
	}

	public void changeStatus(ShopStatus status, String reason, Instant pausedUntil, Instant at, String by) {
		this.status = status;
		this.statusReason = reason;
		this.pausedUntil = status == ShopStatus.PAUSED ? pausedUntil : null;
		this.statusChangedAt = at;
		this.statusChangedBy = by;
	}

	public ShopPlan getPlan() {
		return plan;
	}

	public LocalTime getSameDayCutoff() {
		return sameDayCutoff;
	}

	public String getTimeZone() {
		return timeZone;
	}

	public String getDescription() {
		return description;
	}

	public String getDescriptionShort() {
		return descriptionShort;
	}

	public String getOpeningHours() {
		return openingHours;
	}

	public String getFeaturedProductId() {
		return featuredProductId;
	}

	/** Panelden dükkân bilgileri; slug panelden değişmez. */
	public void updateProfile(String name, String shortName, String phone, String address, String descriptionShort,
			String description, String openingHours, String legalName, String taxOffice, String taxNumber, String email,
			String notifyPhone, boolean notifySms) {
		this.name = name;
		this.shortName = shortName;
		this.phone = phone;
		this.address = address;
		this.descriptionShort = descriptionShort;
		this.description = description;
		this.openingHours = openingHours;
		this.legalName = legalName;
		this.taxOffice = taxOffice;
		this.taxNumber = taxNumber;
		this.email = email;
		this.notifyPhone = notifyPhone;
		this.notifySms = notifySms;
	}

	public void updatePage(String logoUrl, String coverPhotoUrl, String story, Integer foundedYear,
			List<String> storyPhotos, String featuredProductId, String favoriteNote) {
		this.logoUrl = logoUrl;
		this.coverPhotoUrl = coverPhotoUrl;
		this.story = story;
		this.foundedYear = foundedYear;
		this.storyPhotos = new ArrayList<>(storyPhotos);
		this.featuredProductId = featuredProductId;
		this.favoriteNote = favoriteNote;
	}

	public String getCoverPhotoUrl() {
		return coverPhotoUrl;
	}

	public String getStory() {
		return story;
	}

	public Integer getFoundedYear() {
		return foundedYear;
	}

	public List<String> getStoryPhotos() {
		return List.copyOf(storyPhotos);
	}

	public String getFavoriteNote() {
		return favoriteNote;
	}

	public void updateSameDayCutoff(LocalTime cutoff) {
		this.sameDayCutoff = cutoff;
	}

	public String getLegalName() {
		return legalName;
	}

	public String getTaxOffice() {
		return taxOffice;
	}

	public String getTaxNumber() {
		return taxNumber;
	}

	public String getEmail() {
		return email;
	}

	public String getNotifyPhone() {
		return notifyPhone;
	}

	public boolean isNotifySms() {
		return notifySms;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public List<ShopSlugHistory> getPreviousSlugs() {
		return previousSlugs;
	}
}
