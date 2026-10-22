package com.tomurcuk.identity;

/** Destek ekibi dükkân adına girdi; dükkân sahiplerine e-posta gider. */
public record ImpersonationStarted(String impersonationId, String shopId, String supportUserName, String reason) {
}
