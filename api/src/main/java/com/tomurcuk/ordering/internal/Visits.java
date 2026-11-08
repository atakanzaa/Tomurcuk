package com.tomurcuk.ordering.internal;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import com.tomurcuk.ordering.Channel;
import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Instants;
import com.tomurcuk.shared.ValidationException;
import com.tomurcuk.shop.ShopDirectory;
import com.tomurcuk.shop.ShopInfo;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/**
 * Vitrin ziyaretleri ve siparişlerin kanala göre sayıları. Ziyaret dükkânın gününe, kanala göre
 * tek satırda artar; kim olduğu tutulmaz. Sipariş sayısına iptal edilenler ve kartla ödemesi
 * tamamlanmayanlar girmez; ciro bu siparişlerin toplamıdır.
 */
@Service
public class Visits {

	static final List<Integer> PERIODS = List.of(7, 30);

	private final JdbcClient jdbc;

	private final ShopDirectory shops;

	private final Clock clock;

	Visits(JdbcClient jdbc, ShopDirectory shops, Clock clock) {
		this.jdbc = jdbc;
		this.shops = shops;
		this.clock = clock;
	}

	/** Bilinmeyen kanal kodu ya da dükkân sessizce yok sayılır; vitrin bundan etkilenmez. */
	public void record(String shopId, String channelCode) {
		Channel channel = Channel.parse(channelCode).orElse(null);
		ShopInfo shop = shops.find(shopId).orElse(null);
		if (channel == null || shop == null) {
			return;
		}
		jdbc.sql("""
				INSERT INTO shop_visit (shop_id, day, channel, visits) VALUES (:shopId, :day, :channel, 1)
				ON CONFLICT (shop_id, day, channel) DO UPDATE SET visits = shop_visit.visits + 1
				""")
			.param("shopId", shopId)
			.param("day", LocalDate.now(clock.withZone(shop.timeZone())))
			.param("channel", channel.code())
			.update();
	}

	/** Bugün dahil son `days` gün; `days` 7 ya da 30, değilse `days` alanında `option_invalid`. */
	public Stats stats(String shopId, int days) {
		if (!PERIODS.contains(days)) {
			throw ValidationException.of("days", FieldError.of("option_invalid"));
		}
		ShopInfo shop = shops.find(shopId).orElseThrow();
		LocalDate today = LocalDate.now(clock.withZone(shop.timeZone()));
		LocalDate from = today.minusDays(days - 1L);
		Map<Channel, Row> rows = new EnumMap<>(Channel.class);
		jdbc.sql("""
				SELECT channel, sum(visits) AS visits FROM shop_visit
				WHERE shop_id = :shopId AND day BETWEEN :from AND :today GROUP BY channel
				""")
			.param("shopId", shopId)
			.param("from", from)
			.param("today", today)
			.query((rs, n) -> new Row(Channel.fromCode(rs.getString("channel")), rs.getLong("visits"), 0, 0))
			.list()
			.forEach(row -> rows.put(row.channel(), row));
		jdbc.sql("""
				SELECT channel, count(*) AS orders, sum(total) AS revenue FROM orders
				WHERE shop_id = :shopId AND channel IS NOT NULL AND created_at >= :since
				  AND status <> 'cancelled' AND NOT (payment_method = 'card' AND payment_status <> 'paid')
				GROUP BY channel
				""")
			.param("shopId", shopId)
			.param("since", Instants.sql(from.atStartOfDay(shop.timeZone()).toInstant()))
			.query((rs, n) -> new Row(Channel.fromCode(rs.getString("channel")), 0, rs.getLong("orders"),
					rs.getLong("revenue")))
			.list()
			.forEach(row -> rows.merge(row.channel(), row,
					(a, b) -> new Row(a.channel(), a.visits(), b.orders(), b.revenue())));
		List<Row> channels = rows.values()
			.stream()
			.filter(row -> row.visits() > 0 || row.orders() > 0)
			.sorted(Comparator.comparingLong(Row::visits).thenComparingLong(Row::orders).reversed()
				.thenComparing(Row::channel))
			.toList();
		return new Stats(days, channels.stream().mapToLong(Row::visits).sum(),
				channels.stream().mapToLong(Row::orders).sum(), channels.stream().mapToLong(Row::revenue).sum(),
				channels);
	}

	/** Panelde "Ziyaretçiler"; JSON'u web/lib/api/types.ts `VisitStats`. Para kuruş. */
	public record Stats(int days, long visits, long orders, long revenue, List<Row> channels) {
	}

	public record Row(Channel channel, long visits, long orders, long revenue) {
	}
}
