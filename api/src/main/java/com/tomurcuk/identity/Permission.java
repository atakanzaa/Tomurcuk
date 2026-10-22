package com.tomurcuk.identity;

/**
 * İzinler (docs/mvp.md "Yetki matrisi"). Kontroller rol değil izin üzerinden yapılır;
 * web/lib/permissions.ts aynı adları kullanır.
 */
public enum Permission {

	ORDER_CANCEL, REFUND_START, CUSTOMER_PII_VIEW, CATALOG_EDIT,

	/** Destek: dükkân adına süreli oturum, dükkânı askıya alma, herkesin denetim kaydını görme. */
	SHOP_IMPERSONATE, SHOP_SUSPEND, AUDIT_VIEW_ALL

}
