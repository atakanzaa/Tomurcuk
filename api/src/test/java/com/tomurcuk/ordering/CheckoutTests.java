package com.tomurcuk.ordering;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import com.tomurcuk.MutableClock;
import com.tomurcuk.TestcontainersConfiguration;
import com.tomurcuk.ordering.internal.Checkout;
import com.tomurcuk.ordering.internal.Checkout.CardInput;
import com.tomurcuk.ordering.internal.Checkout.DeliveryInput;
import com.tomurcuk.ordering.internal.Checkout.Placed;
import com.tomurcuk.ordering.internal.Checkout.PlaceOrderInput;
import com.tomurcuk.ordering.internal.Draft;
import com.tomurcuk.payment.PaymentSucceeded;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.web.util.UriComponentsBuilder;

@SpringBootTest(properties = "tomurcuk.jobs.enabled=false")
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
@RecordApplicationEvents
class CheckoutTests {

	private static final String SHOP = "shop_nergis";

	@Autowired
	Checkout checkout;

	@Autowired
	MutableClock clock;

	@Autowired
	JdbcClient jdbc;

	@Autowired
	ApplicationEvents events;

	@BeforeEach
	void resetClock() {
		clock.set(Instant.parse("2026-10-22T07:00:00Z"));
	}

	/** Callback iki kez gelirse sipariş bir kez ödenir, olay bir kez yayınlanır. */
	@Test
	void paymentCallbackTwiceIsIdempotent() {
		Placed placed = placeCardOrder("2026-10-24", "s_aksam");
		String token = UriComponentsBuilder.fromUriString(placed.paymentUrl())
			.build()
			.getQueryParams()
			.getFirst("token");

		Optional<Checkout.PaymentReturn> first = checkout.completePayment(SHOP, token);
		Optional<Checkout.PaymentReturn> second = checkout.completePayment(SHOP, token);

		assertThat(first).hasValueSatisfying(r -> assertThat(r.paid()).isTrue());
		assertThat(second).hasValueSatisfying(r -> assertThat(r.paid()).isTrue());
		assertThat(events.stream(PaymentSucceeded.class)).hasSize(1);
		assertThat(checkout.tracking(SHOP, placed.trackingToken()))
			.hasValueSatisfying(t -> assertThat(t.paymentStatus()).isEqualTo(PaymentStatus.PAID));
		assertThat(jdbc.sql("SELECT count(*) FROM payment WHERE token = :token AND status = 'succeeded'")
			.param("token", token)
			.query(Integer.class)
			.single()).isEqualTo(1);
	}

	/** Aynı idempotency anahtarıyla ikinci gönderim yeni sipariş açmaz. */
	@Test
	void sameIdempotencyKeyReturnsSameOrder() {
		Draft draft = readyDraft("2026-10-25", "s_ogle");
		PlaceOrderInput input = new PlaceOrderInput("transfer", true, "key-" + draft.id());
		Placed first = checkout.placeOrder(SHOP, draft.id(), input);
		Placed second = checkout.placeOrder(SHOP, draft.id(), input);
		assertThat(second.trackingToken()).isEqualTo(first.trackingToken());
		assertThat(first.paymentUrl()).isNull();
	}

	/** Başka dükkânın takip kodu bulunamaz. */
	@Test
	void trackingTokenOfAnotherShopIsNotFound() {
		assertThat(checkout.tracking(SHOP, "a3Fq9ZmLx2VbN8cR")).isPresent();
		assertThat(checkout.tracking("shop_lale", "a3Fq9ZmLx2VbN8cR")).isEmpty();
		assertThat(checkout.findTrackingToken("shop_lale", "4821", "0533 207 41 65")).isEmpty();
		assertThat(checkout.findTrackingToken(SHOP, "t4821", "05332074165")).contains("a3Fq9ZmLx2VbN8cR");
	}

	private Placed placeCardOrder(String date, String slotId) {
		Draft draft = readyDraft(date, slotId);
		return checkout.placeOrder(SHOP, draft.id(), new PlaceOrderInput("card", true, "key-" + draft.id()));
	}

	private Draft readyDraft(String date, String slotId) {
		Draft draft = checkout.createDraft(SHOP, "p_mevsim", List.of("p_mevsim_o2", "p_mevsim_o4"));
		checkout.saveDelivery(SHOP, draft.id(), new DeliveryInput(date, slotId, "Elif Yılmaz", "0532 412 88 19",
				"z_caferaga", "", "Moda Cad. No: 12", ""));
		return checkout.saveCard(SHOP, draft.id(), new CardInput("İyi ki doğdun", "Ayşe", false, "0533 207 41 65"));
	}
}
