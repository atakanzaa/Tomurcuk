package com.tomurcuk.ordering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
import com.tomurcuk.ordering.internal.Visits;
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
	Visits visits;

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
		PlaceOrderInput input = new PlaceOrderInput("transfer", true, "key-" + draft.id(), "127.0.0.1");
		Placed first = checkout.placeOrder(SHOP, draft.id(), input);
		Placed second = checkout.placeOrder(SHOP, draft.id(), input);
		assertThat(second.trackingToken()).isEqualTo(first.trackingToken());
		assertThat(first.paymentUrl()).isNull();
		// Onaylanan sözleşmelerin sürümü siparişte durur; takip linkinden sipariş bilgisiyle açılır.
		assertThat(checkout.contract(SHOP, first.trackingToken())).hasValueSatisfying(contract -> {
			assertThat(contract.termsVersion()).isEqualTo(Terms.VERSION);
			assertThat(contract.total()).isEqualTo(draft.total());
			assertThat(contract.items()).hasSize(1);
		});
		assertThat(checkout.contract("shop_lale", first.trackingToken())).isEmpty();
	}

	/**
	 * Vitrinin bildirdiği kanal siparişe geçer ve panelde sayılır; ödemesi tamamlanmayan kart
	 * siparişi sayılmaz. Bilinmeyen kanal ve dönem kabul edilmez.
	 */
	@Test
	void channelIsCountedForVisitsAndOrders() {
		Visits.Row before = row(visits.stats(SHOP, 7), Channel.QR);
		visits.record(SHOP, "qr");
		visits.record(SHOP, "qr");
		visits.record(SHOP, "telgraf");
		visits.record("shop_yok", "qr");

		Draft transfer = readyDraft("2026-10-26", "s_aksam", "qr");
		Placed placed = checkout.placeOrder(SHOP, transfer.id(),
				new PlaceOrderInput("transfer", true, "key-" + transfer.id(), "127.0.0.1"));
		Draft card = readyDraft("2026-10-26", "s_aksam", "qr");
		checkout.placeOrder(SHOP, card.id(), new PlaceOrderInput("card", true, "key-" + card.id(), "127.0.0.1"));
		assertThat(readyDraft("2026-10-26", "s_aksam", "telgraf").channel()).isNull();

		Visits.Row after = row(visits.stats(SHOP, 7), Channel.QR);
		assertThat(after.visits() - before.visits()).isEqualTo(2);
		assertThat(after.orders() - before.orders()).isEqualTo(1);
		assertThat(after.revenue() - before.revenue()).isEqualTo(transfer.total());
		assertThat(jdbc.sql("SELECT channel FROM orders WHERE tracking_token = :t")
			.param("t", placed.trackingToken())
			.query(String.class)
			.single()).isEqualTo("qr");
		assertThat(jdbc.sql("SELECT count(*) FROM shop_visit WHERE channel NOT IN ('instagram', 'whatsapp', "
				+ "'google', 'facebook', 'qr', 'tomurcuk', 'other', 'direct') OR shop_id = 'shop_yok'")
			.query(Integer.class)
			.single()).isZero();
		assertThatThrownBy(() -> visits.stats(SHOP, 12)).isInstanceOf(com.tomurcuk.shared.ValidationException.class);
	}

	private static Visits.Row row(Visits.Stats stats, Channel channel) {
		return stats.channels()
			.stream()
			.filter(r -> r.channel() == channel)
			.findFirst()
			.orElse(new Visits.Row(channel, 0, 0, 0));
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
		return checkout.placeOrder(SHOP, draft.id(), new PlaceOrderInput("card", true, "key-" + draft.id(), "127.0.0.1"));
	}

	private Draft readyDraft(String date, String slotId) {
		return readyDraft(date, slotId, null);
	}

	private Draft readyDraft(String date, String slotId, String channel) {
		Draft draft = checkout.createDraft(SHOP, "p_mevsim", List.of("p_mevsim_o2", "p_mevsim_o4"), channel);
		checkout.saveDelivery(SHOP, draft.id(), new DeliveryInput(date, slotId, "Elif Yılmaz", "0532 412 88 19",
				"z_caferaga", "", "Moda Cad. No: 12", ""));
		return checkout.saveCard(SHOP, draft.id(), new CardInput("İyi ki doğdun", "Ayşe", false, "0533 207 41 65"));
	}
}
