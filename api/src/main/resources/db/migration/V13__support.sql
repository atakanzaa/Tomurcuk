-- Destek ekibi (platform kullanıcıları); dükkân kullanıcılarından ayrı tabloda. Giriş şifre
-- ve TOTP ile; TOTP gizli anahtarı Base32.
CREATE TABLE platform_user
(
    id            VARCHAR(32) PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL,
    totp_secret   VARCHAR(64)  NOT NULL,
    role          VARCHAR(16)  NOT NULL CHECK (role IN ('owner', 'lead', 'agent')),
    active        BOOLEAN      NOT NULL DEFAULT TRUE,
    last_seen_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Dükkân adına süreli oturum (30 dakika).
CREATE TABLE impersonation_session
(
    id               VARCHAR(32) PRIMARY KEY,
    platform_user_id VARCHAR(32) NOT NULL REFERENCES platform_user (id),
    shop_id          VARCHAR(32) NOT NULL REFERENCES shop (id),
    reason           TEXT        NOT NULL,
    started_at       TIMESTAMPTZ NOT NULL,
    ends_at          TIMESTAMPTZ NOT NULL,
    ended_at         TIMESTAMPTZ
);

-- Denetim kaydı: yalnızca eklenir. Güncelleme ve silme tetikleyiciyle reddedilir.
CREATE TABLE audit_log
(
    id         VARCHAR(32) PRIMARY KEY,
    actor_type VARCHAR(16)  NOT NULL CHECK (actor_type IN ('platform', 'shop', 'system')),
    actor_id   VARCHAR(40),
    actor_name VARCHAR(120) NOT NULL,
    shop_id    VARCHAR(32),
    action     VARCHAR(120) NOT NULL,
    record     VARCHAR(300) NOT NULL,
    reason     TEXT,
    ip         VARCHAR(64),
    at         TIMESTAMPTZ  NOT NULL
);
CREATE INDEX audit_log_at_idx ON audit_log (at DESC);
CREATE INDEX audit_log_actor_idx ON audit_log (actor_id, at DESC);

CREATE FUNCTION audit_log_append_only() RETURNS trigger AS
$$
BEGIN
    RAISE EXCEPTION 'audit_log yalnızca eklenir';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update_delete
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();

-- Talepler. Bugün teslim edilecek siparişe bağlı talep okunurken acil sayılır (uygulamada).
CREATE TABLE support_ticket
(
    id                VARCHAR(32) PRIMARY KEY,
    shop_id           VARCHAR(32)  NOT NULL REFERENCES shop (id),
    order_id          VARCHAR(32),
    order_number      VARCHAR(16),
    subject           VARCHAR(160) NOT NULL,
    category          VARCHAR(16)  NOT NULL CHECK (category IN ('payment', 'delivery', 'technical', 'account')),
    priority          VARCHAR(16)  NOT NULL CHECK (priority IN ('urgent', 'normal')),
    status            VARCHAR(16)  NOT NULL CHECK (status IN ('open', 'waiting_shop', 'resolved')),
    assignee_id       VARCHAR(32) REFERENCES platform_user (id),
    created_at        TIMESTAMPTZ  NOT NULL,
    waiting_since     TIMESTAMPTZ  NOT NULL,
    first_response_at TIMESTAMPTZ,
    closed_at         TIMESTAMPTZ
);
CREATE INDEX support_ticket_shop_idx ON support_ticket (shop_id, created_at DESC);

-- Dahili notlar dükkâna görünmez.
CREATE TABLE ticket_message
(
    id          VARCHAR(40) PRIMARY KEY,
    ticket_id   VARCHAR(32)  NOT NULL REFERENCES support_ticket (id) ON DELETE CASCADE,
    author_type VARCHAR(16)  NOT NULL CHECK (author_type IN ('platform', 'shop')),
    author_id   VARCHAR(40),
    author_name VARCHAR(120) NOT NULL,
    author_org  VARCHAR(160) NOT NULL,
    internal    BOOLEAN      NOT NULL DEFAULT FALSE,
    text        TEXT         NOT NULL,
    at          TIMESTAMPTZ  NOT NULL
);
CREATE INDEX ticket_message_ticket_idx ON ticket_message (ticket_id, at);

CREATE TABLE canned_reply
(
    id       VARCHAR(32) PRIMARY KEY,
    title    VARCHAR(120) NOT NULL,
    text     TEXT         NOT NULL,
    category VARCHAR(16)  NOT NULL CHECK (category IN ('payment', 'delivery', 'technical', 'account'))
);

-- Ekip notları; dükkân görmez.
CREATE TABLE shop_note
(
    id          VARCHAR(32) PRIMARY KEY,
    shop_id     VARCHAR(32)  NOT NULL REFERENCES shop (id),
    author_id   VARCHAR(32),
    author_name VARCHAR(120) NOT NULL,
    text        TEXT         NOT NULL,
    at          TIMESTAMPTZ  NOT NULL
);
CREATE INDEX shop_note_shop_idx ON shop_note (shop_id, at DESC);

-- Tanıtım sitesindeki pilot başvuruları.
CREATE TABLE pilot_application
(
    id         VARCHAR(32) PRIMARY KEY,
    shop_name  VARCHAR(120) NOT NULL,
    phone      VARCHAR(20)  NOT NULL,
    district   VARCHAR(80)  NOT NULL,
    instagram  VARCHAR(60),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
