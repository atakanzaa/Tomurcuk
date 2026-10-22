package com.tomurcuk.shop.web;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * web/lib/api/types.ts `ShopLookup`: güncel slug'la `found` ve dükkân, eski slug'la `moved`
 * ve güncel slug, ikisi de değilse `missing`.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
record ShopLookupResponse(String kind, ShopResponse shop, String slug) {

	static ShopLookupResponse found(ShopResponse shop) {
		return new ShopLookupResponse("found", shop, null);
	}

	static ShopLookupResponse moved(String slug) {
		return new ShopLookupResponse("moved", null, slug);
	}

	static ShopLookupResponse missing() {
		return new ShopLookupResponse("missing", null, null);
	}
}
