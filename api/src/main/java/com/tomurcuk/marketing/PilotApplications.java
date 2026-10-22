package com.tomurcuk.marketing;

import java.util.LinkedHashMap;
import java.util.Map;

import com.tomurcuk.shared.FieldError;
import com.tomurcuk.shared.Ids;
import com.tomurcuk.shared.Texts;
import com.tomurcuk.shared.ValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Tanıtım sitesindeki pilot başvurusu: dükkân adı, telefon, ilçe, isteğe bağlı Instagram. */
@RestController
public class PilotApplications {

	private final JdbcClient jdbc;

	PilotApplications(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	@PostMapping("/api/public/pilot-applications")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void submit(@RequestBody Input input) {
		Map<String, FieldError> errors = new LinkedHashMap<>();
		String shopName = Texts.check(errors, "shopName", input.shopName(), 120, true);
		String phone = Texts.phone(errors, "phone", input.phone());
		String district = Texts.check(errors, "district", input.district(), 80, true);
		String instagram = Texts.check(errors, "instagram", input.instagram(), 60, false);
		if (!errors.isEmpty()) {
			throw new ValidationException(errors);
		}
		jdbc.sql("INSERT INTO pilot_application (id, shop_name, phone, district, instagram) VALUES (:id, :shopName, :phone, :district, :instagram)")
			.param("id", Ids.newId())
			.param("shopName", shopName)
			.param("phone", phone)
			.param("district", district)
			.param("instagram", instagram.isEmpty() ? null : instagram)
			.update();
	}

	public record Input(String shopName, String phone, String district, String instagram) {
	}
}
