-- Dükkân kullanıcıları. Platform (destek) kullanıcıları ayrı tabloda tutulur (destek aşaması).
-- E-posta küçük harfle saklanır ve tekildir. Şifre DelegatingPasswordEncoder biçiminde
-- ("{bcrypt}$2a$..."); yalnızca özeti tutulur.
CREATE TABLE shop_user
(
    id            VARCHAR(32) PRIMARY KEY,
    shop_id       VARCHAR(32)  NOT NULL REFERENCES shop (id),
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,
    role          VARCHAR(16)  NOT NULL CHECK (role IN ('owner', 'staff')),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    last_seen_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX shop_user_shop_idx ON shop_user (shop_id);

-- Spring Session JDBC (org/springframework/session/jdbc/schema-postgresql.sql). Oturum
-- veritabanında durduğu için uygulama yeniden başlayınca kullanıcılar çıkış yapmış olmaz.
CREATE TABLE spring_session
(
    primary_id            CHAR(36) NOT NULL,
    session_id            CHAR(36) NOT NULL,
    creation_time         BIGINT   NOT NULL,
    last_access_time      BIGINT   NOT NULL,
    max_inactive_interval INT      NOT NULL,
    expiry_time           BIGINT   NOT NULL,
    principal_name        VARCHAR(100),
    CONSTRAINT spring_session_pk PRIMARY KEY (primary_id)
);
CREATE UNIQUE INDEX spring_session_ix1 ON spring_session (session_id);
CREATE INDEX spring_session_ix2 ON spring_session (expiry_time);
CREATE INDEX spring_session_ix3 ON spring_session (principal_name);

CREATE TABLE spring_session_attributes
(
    session_primary_id CHAR(36)     NOT NULL,
    attribute_name     VARCHAR(200) NOT NULL,
    attribute_bytes    BYTEA        NOT NULL,
    CONSTRAINT spring_session_attributes_pk PRIMARY KEY (session_primary_id, attribute_name),
    CONSTRAINT spring_session_attributes_fk FOREIGN KEY (session_primary_id) REFERENCES spring_session (primary_id) ON DELETE CASCADE
);
