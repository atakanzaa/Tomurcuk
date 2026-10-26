package com.tomurcuk.notification.internal;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.util.HtmlUtils;

/**
 * Tomurcuk e-postalarının ortak iskeleti: üstte logo ve ad, ortada içerik, altta neden
 * gönderildiği. İçerik bloklardan kurulur; her blok hem HTML'e hem düz metne yazılır, iki ayrı
 * metin tutulmaz. Değerler HTML'e yazılırken kaçışlanır (dükkân adı, gerekçe ve kart notu
 * kullanıcı girdisidir).
 *
 * E-posta istemcileri CSS değişkeni, harici stil ve SVG okumaz: düzen tablo, stiller satır içi,
 * renkler design/tomurcuk/tokens.json'un açık tema değerleri, logo `cid:logo` ile gömülü PNG
 * (ResendEmailSender ekler). Web fontu (Google Fonts) yalnızca Apple Mail gibi istemcilerde
 * yüklenir; diğerlerinde Georgia ve Arial'a düşer.
 */
final class EmailLayout {

	// design/tomurcuk/tokens.json, açık tema.
	private static final String PAPER = "#f6f0e6";

	private static final String PAPER_RAISED = "#fbf8f2";

	private static final String KRAFT = "#e6d7bf";

	private static final String LINE = "#ddd2c0";

	private static final String INK = "#23261f";

	private static final String INK_MUTED = "#57594f";

	private static final String STEM = "#2e4a35";

	private static final String ON_STEM = "#f6f0e6";

	private static final String DISPLAY = "'Young Serif', Georgia, 'Times New Roman', serif";

	private static final String SANS = "'Schibsted Grotesk', 'Helvetica Neue', Arial, sans-serif";

	static final String LOGO_CID = "logo";

	private final String subject;

	private String preheader = "";

	private String title = "";

	private final List<Block> blocks = new ArrayList<>();

	private final List<String> footer = new ArrayList<>();

	private EmailLayout(String subject) {
		this.subject = subject;
	}

	static EmailLayout email(String subject) {
		return new EmailLayout(subject);
	}

	/** Gelen kutusunda konunun yanında görünen kısa özet. */
	EmailLayout preheader(String text) {
		this.preheader = text;
		return this;
	}

	EmailLayout title(String text) {
		this.title = text;
		return this;
	}

	EmailLayout paragraph(String text) {
		blocks.add(new Paragraph(text));
		return this;
	}

	/** Etiket ve değer satırları; boş değerli satır yazılmaz. `link` true ise değer bağlantıdır. */
	EmailLayout facts(List<Fact> facts) {
		List<Fact> shown = facts.stream().filter(f -> f.value() != null && !f.value().isBlank()).toList();
		if (!shown.isEmpty()) {
			blocks.add(new Facts(shown));
		}
		return this;
	}

	/** Kraft zeminli alıntı: gerekçe, kart notu. Metin boşsa yazılmaz. */
	EmailLayout quote(String label, String text) {
		if (text != null && !text.isBlank()) {
			blocks.add(new Quote(label, text.strip()));
		}
		return this;
	}

	EmailLayout button(String label, String url) {
		blocks.add(new Button(label, url));
		return this;
	}

	/** Küçük, soluk dipnot: bağlantının süresi gibi. */
	EmailLayout note(String text) {
		blocks.add(new Note(text));
		return this;
	}

	EmailLayout footer(String line) {
		footer.add(line);
		return this;
	}

	Email build() {
		return new Email(subject, text(), html());
	}

	record Fact(String label, String value, boolean link) {

		static Fact of(String label, String value) {
			return new Fact(label, value, false);
		}

		static Fact link(String label, String url) {
			return new Fact(label, url, true);
		}
	}

	// ---------------------------------------------------------------- düz metin

	private String text() {
		StringBuilder out = new StringBuilder(title).append("\n\n");
		for (Block block : blocks) {
			out.append(block.text()).append("\n\n");
		}
		out.append("--\n");
		footer.forEach(line -> out.append(line).append('\n'));
		return out.toString();
	}

	// ---------------------------------------------------------------- HTML

	private String html() {
		StringBuilder body = new StringBuilder();
		body.append("<h1 style=\"margin:0 0 20px;font-family:").append(DISPLAY)
			.append(";font-weight:400;font-size:26px;line-height:32px;color:").append(INK).append(";\">")
			.append(esc(title)).append("</h1>");
		for (Block block : blocks) {
			body.append(block.html());
		}
		StringBuilder foot = new StringBuilder();
		for (String line : footer) {
			foot.append("<p style=\"margin:0 0 6px;\">").append(esc(line)).append("</p>");
		}
		return """
				<!doctype html>
				<html lang="tr">
				<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1">
				<meta name="color-scheme" content="light">
				<meta name="supported-color-schemes" content="light">
				<title>%s</title>
				<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;600&amp;family=Young+Serif&amp;display=swap" rel="stylesheet">
				<style>
				@media (max-width: 600px) {
				  .tm-outer { padding: 20px 8px !important; }
				  .tm-card { padding: 28px 20px !important; }
				  .tm-fact-label, .tm-fact-value { display: block !important; width: auto !important; }
				  .tm-fact-label { padding-bottom: 0 !important; }
				  .tm-fact-value { border-top: 0 !important; padding-top: 2px !important; }
				}
				</style>
				</head>
				<body style="margin:0;padding:0;background:%s;-webkit-text-size-adjust:100%%;">
				<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">%s</div>
				<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="background:%s;">
				<tr><td class="tm-outer" align="center" style="padding:32px 12px;">
				<table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
				<tr><td style="padding:0 4px 20px;">
				<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
				<td style="vertical-align:middle;"><img src="cid:%s" width="36" height="36" alt="" style="display:block;border:0;width:36px;height:36px;"></td>
				<td style="vertical-align:middle;padding-left:10px;font-family:%s;font-size:22px;line-height:28px;color:%s;">Tomurcuk</td>
				</tr></table>
				</td></tr>
				<tr><td class="tm-card" style="background:%s;border:1px solid %s;border-radius:20px;padding:36px 40px;font-family:%s;font-size:16px;line-height:24px;color:%s;">
				%s
				</td></tr>
				<tr><td style="padding:20px 8px 0;font-family:%s;font-size:13px;line-height:19px;color:%s;">
				%s
				</td></tr>
				</table>
				</td></tr>
				</table>
				</body>
				</html>
				""".formatted(esc(subject), PAPER, esc(preheader), PAPER, LOGO_CID, DISPLAY, INK, PAPER_RAISED, LINE, SANS,
				INK, body, SANS, INK_MUTED, foot);
	}

	static String esc(String value) {
		return value == null ? "" : HtmlUtils.htmlEscape(value, "UTF-8");
	}

	private sealed interface Block permits Paragraph, Facts, Quote, Button, Note {

		String html();

		String text();
	}

	private record Paragraph(String value) implements Block {

		public String html() {
			return "<p style=\"margin:0 0 16px;\">" + esc(value) + "</p>";
		}

		public String text() {
			return value;
		}
	}

	private record Facts(List<Fact> facts) implements Block {

		public String html() {
			StringBuilder rows = new StringBuilder();
			for (Fact fact : facts) {
				String value = fact.link()
						? "<a href=\"" + esc(fact.value()) + "\" style=\"color:" + STEM + ";word-break:break-all;\">"
								+ esc(fact.value()) + "</a>"
						: esc(fact.value());
				rows.append("<tr>")
					.append("<td class=\"tm-fact-label\" width=\"36%\" style=\"padding:10px 12px 10px 0;border-top:1px solid ")
					.append(LINE).append(";vertical-align:top;font-size:14px;line-height:20px;color:").append(INK_MUTED)
					.append(";\">").append(esc(fact.label())).append("</td>")
					.append("<td class=\"tm-fact-value\" style=\"padding:10px 0;border-top:1px solid ").append(LINE)
					.append(";vertical-align:top;font-size:15px;line-height:22px;color:").append(INK).append(";\">")
					.append(value).append("</td>")
					.append("</tr>");
			}
			return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
					+ "style=\"margin:4px 0 20px;border-bottom:1px solid " + LINE + ";\">" + rows + "</table>";
		}

		public String text() {
			StringBuilder out = new StringBuilder();
			for (Fact fact : facts) {
				if (!out.isEmpty()) {
					out.append('\n');
				}
				out.append(fact.label()).append(": ").append(fact.value());
			}
			return out.toString();
		}
	}

	private record Quote(String label, String value) implements Block {

		public String html() {
			return "<table role=\"presentation\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" "
					+ "style=\"margin:4px 0 20px;\"><tr><td style=\"background:" + KRAFT
					+ ";border-radius:6px;padding:14px 18px;\">"
					+ "<p style=\"margin:0 0 4px;font-size:13px;line-height:18px;color:" + INK_MUTED + ";\">"
					+ esc(label) + "</p>"
					+ "<p style=\"margin:0;font-size:16px;line-height:24px;color:" + INK + ";white-space:pre-line;\">"
					+ esc(value) + "</p></td></tr></table>";
		}

		public String text() {
			return label + ": " + value;
		}
	}

	/** Tablo hücresinde bağlantı: Outlook dahil tıklanır. Altında, buton görünmezse diye adres. */
	private record Button(String label, String url) implements Block {

		public String html() {
			return "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" style=\"margin:8px 0 12px;\">"
					+ "<tr><td align=\"center\" bgcolor=\"" + STEM + "\" style=\"border-radius:10px;\">"
					+ "<a href=\"" + esc(url) + "\" style=\"display:inline-block;padding:13px 24px;font-family:" + SANS
					+ ";font-size:16px;line-height:22px;font-weight:600;color:" + ON_STEM
					+ ";text-decoration:none;border-radius:10px;\">" + esc(label) + "</a></td></tr></table>"
					+ "<p style=\"margin:0 0 20px;font-size:13px;line-height:19px;color:" + INK_MUTED
					+ ";\">Buton açılmazsa bu adresi tarayıcınıza yapıştırın:<br><a href=\"" + esc(url)
					+ "\" style=\"color:" + STEM + ";word-break:break-all;\">" + esc(url) + "</a></p>";
		}

		public String text() {
			return label + ": " + url;
		}
	}

	private record Note(String value) implements Block {

		public String html() {
			return "<p style=\"margin:0 0 12px;font-size:14px;line-height:20px;color:" + INK_MUTED + ";\">" + esc(value)
					+ "</p>";
		}

		public String text() {
			return value;
		}
	}
}
