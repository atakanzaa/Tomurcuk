package com.tomurcuk.identity;

/**
 * İzinler (docs/mvp.md "Yetki matrisi"). Kontroller rol değil izin üzerinden yapılır;
 * web/lib/permissions.ts aynı adları kullanır.
 */
public enum Permission {

	ORDER_CANCEL, REFUND_START, CUSTOMER_PII_VIEW, CATALOG_EDIT,

	/**
	 * Destek: dükkân adına süreli oturum, dükkânı askıya alma ve kalıcı kapatma (yeniden açma da),
	 * herkesin denetim kaydını görme.
	 */
	SHOP_IMPERSONATE, SHOP_SUSPEND, AUDIT_VIEW_ALL,

	/** Destek: dükkânın siparişlerini geçici kapatma ve geçici kapatmayı kaldırma (bütün destek rolleri). */
	SHOP_PAUSE,

	/** Destek: yeni dükkân açma ve sahibine şifre bağlantısı oluşturma (platform sahibi ve lider). */
	SHOP_ONBOARD

}
