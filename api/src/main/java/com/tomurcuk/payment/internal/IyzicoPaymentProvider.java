package com.tomurcuk.payment.internal;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.tomurcuk.payment.PaymentProvider;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * iyzico Checkout Form. Alıcı iyzico'nun ödeme sayfasında öder; iyzico alıcıyı `callbackUrl`'e
 * token'la POST eder, sonuç token'la sorgulanır. Kimlik doğrulaması IYZWSv2: HMAC-SHA256
 * (gizli anahtar, rastgele anahtar + yol + gövde).
 *
 * <p>
 * Pazaryeri modelinde (`marketplace`) sepet satırına dükkânın alt üye işyeri anahtarı yazılır
 * ve para doğrudan dükkâna geçer; Tomurcuk komisyon almadığı için alt üye işyeri tutarı satır
 * tutarına eşittir.
 */
class IyzicoPaymentProvider implements PaymentProvider {

	static final String INITIALIZE = "/payment/iyzipos/checkoutform/initialize/auth/ecom";

	static final String RETRIEVE = "/payment/iyzipos/checkoutform/auth/ecom/detail";

	private static final MediaType JSON_UTF8 = new MediaType(MediaType.APPLICATION_JSON, StandardCharsets.UTF_8);

	/** Üye olmadan sipariş veren alıcı için iyzico'nun kabul ettiği kimlik numarası. */
	private static final String GUEST_IDENTITY_NUMBER = "11111111111";

	private final RestClient http;

	private final JsonMapper json;

	private final String apiKey;

	private final String secretKey;

	private final String buyerEmail;

	private final SubMerchants subMerchants;

	private final Supplier<String> randomKey;

	IyzicoPaymentProvider(RestClient http, JsonMapper json, String apiKey, String secretKey, String buyerEmail,
			SubMerchants subMerchants, Supplier<String> randomKey) {
		this.http = http;
		this.json = json;
		this.apiKey = apiKey;
		this.secretKey = secretKey;
		this.buyerEmail = buyerEmail;
		this.subMerchants = subMerchants;
		this.randomKey = randomKey;
	}

	@Override
	public String name() {
		return "iyzico";
	}

	@Override
	public Session start(Request request) {
		String price = price(request.amount());
		Buyer buyer = request.buyer();
		String[] names = splitName(buyer.name());
		Map<String, Object> address = Map.of("contactName", (names[0] + " " + names[1]).strip(), "city", buyer.city(),
				"country", "Turkey", "address", buyer.address());
		Map<String, Object> item = new LinkedHashMap<>();
		item.put("id", request.conversationId());
		item.put("name", request.description());
		item.put("category1", "Çiçek");
		item.put("itemType", "PHYSICAL");
		item.put("price", price);
		subMerchants.keyOf(request.shopId()).ifPresent(key -> {
			item.put("subMerchantKey", key);
			item.put("subMerchantPrice", price);
		});

		Map<String, Object> body = new LinkedHashMap<>();
		body.put("locale", "tr");
		body.put("conversationId", request.conversationId());
		body.put("price", price);
		body.put("paidPrice", price);
		body.put("currency", "TRY");
		body.put("basketId", request.conversationId());
		body.put("paymentGroup", "PRODUCT");
		body.put("callbackUrl", request.callbackUrl());
		body.put("enabledInstallments", List.of(1));
		body.put("buyer", Map.of("id", buyer.id(), "name", names[0], "surname", names[1], "gsmNumber",
				"+90" + buyer.phone().replaceAll("\\D", "").replaceFirst("^0", ""), "email", buyerEmail,
				"identityNumber", GUEST_IDENTITY_NUMBER, "registrationAddress", buyer.address(), "ip", buyer.ip(),
				"city", buyer.city(), "country", "Turkey"));
		body.put("shippingAddress", address);
		body.put("billingAddress", address);
		body.put("basketItems", List.of(item));

		JsonNode response = post(INITIALIZE, body);
		if (!"success".equals(text(response, "status")) || text(response, "token") == null) {
			throw new Unavailable("iyzico ödeme sayfası açılamadı: " + text(response, "errorCode") + " "
					+ text(response, "errorMessage") + ", cevap: " + abbreviate(response.toString()));
		}
		return new Session(text(response, "token"), text(response, "paymentPageUrl"));
	}

	@Override
	public Result fetch(String token) {
		JsonNode response = post(RETRIEVE, Map.of("locale", "tr", "token", token));
		String raw = response.toString();
		if (!"success".equals(text(response, "status"))) {
			return new Result(Status.FAILED, null, 0, raw);
		}
		String paymentStatus = text(response, "paymentStatus");
		if ("SUCCESS".equals(paymentStatus)) {
			long paid = new BigDecimal(text(response, "paidPrice")).movePointRight(2).longValueExact();
			return new Result(Status.SUCCEEDED, text(response, "paymentId"), paid, raw);
		}
		if ("FAILURE".equals(paymentStatus)) {
			return new Result(Status.FAILED, text(response, "paymentId"), 0, raw);
		}
		return new Result(Status.PENDING, null, 0, raw);
	}

	private JsonNode post(String path, Map<String, Object> body) {
		String payload = json.writeValueAsString(body);
		String rnd = randomKey.get();
		try {
			ResponseEntity<String> response = http.post()
				.uri(path)
				.contentType(JSON_UTF8)
				.header("Authorization", authorization(rnd, path, payload))
				.header("x-iyzi-rnd", rnd)
				// İmza bu baytların üzerinden hesaplanır; gövde aynen bu baytlarla gider.
				.body(payload.getBytes(StandardCharsets.UTF_8))
				.retrieve()
				.toEntity(String.class);
			// 3xx hata sayılmaz ve gövdesi boştur; iyzico her cevabında JSON döner.
			if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null
					|| response.getBody().isBlank()) {
				throw new Unavailable("iyzico " + response.getStatusCode().value() + " döndü, gövde boş"
						+ (response.getHeaders().getLocation() == null ? ""
								: ", yönlendirme: " + response.getHeaders().getLocation()));
			}
			return json.readTree(response.getBody());
		}
		catch (RestClientResponseException ex) {
			throw new Unavailable("iyzico " + ex.getStatusCode().value() + " döndü: " + ex.getResponseBodyAsString());
		}
		catch (RestClientException ex) {
			throw new Unavailable("iyzico'ya ulaşılamadı: " + ex.getMessage());
		}
	}

	/** IYZWSv2: base64("apiKey:..&randomKey:..&signature:" + hex(HMAC-SHA256(secret, rnd + yol + gövde))). */
	String authorization(String rnd, String path, String payload) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
			String signature = HexFormat.of()
				.formatHex(mac.doFinal((rnd + path + payload).getBytes(StandardCharsets.UTF_8)));
			String auth = "apiKey:" + apiKey + "&randomKey:" + rnd + "&signature:" + signature;
			return "IYZWSv2 " + Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
		}
		catch (NoSuchAlgorithmException | InvalidKeyException ex) {
			throw new IllegalStateException(ex);
		}
	}

	/** Log'a yazılan iyzico cevabı; ödeme sayfasının HTML'i gibi uzun alanlar kesilir. */
	private static String abbreviate(String raw) {
		return raw.length() <= 600 ? raw : raw.substring(0, 600) + "…";
	}

	/** 137000 kuruş → "1370.00" */
	static String price(long kurus) {
		return BigDecimal.valueOf(kurus, 2).toPlainString();
	}

	/** iyzico ad ve soyadı ayrı ister; imzasız siparişte "Tomurcuk Müşterisi". */
	static String[] splitName(String name) {
		String trimmed = name == null ? "" : name.strip();
		if (trimmed.isEmpty()) {
			return new String[] { "Tomurcuk", "Müşterisi" };
		}
		int space = trimmed.lastIndexOf(' ');
		return space < 0 ? new String[] { trimmed, trimmed } : new String[] { trimmed.substring(0, space), trimmed.substring(space + 1) };
	}

	private static String text(JsonNode node, String field) {
		JsonNode value = node.get(field);
		return value == null || value.isNull() ? null : value.asString();
	}
}
