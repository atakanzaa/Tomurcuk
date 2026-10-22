package com.tomurcuk.identity;

import java.util.List;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;

/** Destek ekibinin listesi (atama, lidere aktarma). */
@Service
public class PlatformUsers {

	private final JdbcClient jdbc;

	PlatformUsers(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	public List<PlatformPrincipal> active() {
		return jdbc.sql("SELECT id, name, email, role FROM platform_user WHERE active ORDER BY name")
			.query((rs, n) -> new PlatformPrincipal(rs.getString("id"), rs.getString("name"), rs.getString("email"),
					PlatformRole.fromCode(rs.getString("role"))))
			.list();
	}
}
