package com.tomurcuk;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/** Bir modül başka modülün iç paketine erişirse bu test kırılır. */
class ModularityTests {

	@Test
	void verifiesModuleBoundaries() {
		ApplicationModules.of(TomurcukApiApplication.class).verify();
	}
}
