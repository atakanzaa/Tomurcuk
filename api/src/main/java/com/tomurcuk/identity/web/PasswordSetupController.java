package com.tomurcuk.identity.web;

import com.tomurcuk.identity.PasswordLinks;
import com.tomurcuk.identity.PasswordLinks.Holder;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/** Şifre belirleme bağlantısı (/sifre/<token>); oturum gerekmez, token'ın kendisi yetkidir. */
@RestController
@RequestMapping("/api/public")
class PasswordSetupController {

	private final PasswordLinks links;

	PasswordSetupController(PasswordLinks links) {
		this.links = links;
	}

	/** Geçersiz ya da süresi geçmiş bağlantı 404. */
	@GetMapping("/password-setup/{token}")
	Holder holder(@PathVariable String token) {
		return links.holder(token).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}

	@PostMapping("/password-setup")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void redeem(@RequestBody Redeem body) {
		links.redeem(body.token(), body.password());
	}

	/** Şifremi unuttum: adres kayıtlı olsun olmasın 204; bağlantı yalnızca e-postayla gider. */
	@PostMapping("/password-reset")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void requestReset(@RequestBody ResetRequest body) {
		links.requestReset(body.email());
	}

	record Redeem(String token, String password) {
	}

	record ResetRequest(String email) {
	}
}
