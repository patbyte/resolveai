DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'resolveai_app') THEN
    CREATE ROLE resolveai_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;

GRANT resolveai_app TO CURRENT_USER;

CREATE TABLE organizations (
  id text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tickets (
  id text NOT NULL,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reference text NOT NULL,
  customer_name text NOT NULL,
  customer_company text NOT NULL,
  customer_initials text NOT NULL,
  subject text NOT NULL,
  preview text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  status text NOT NULL CHECK (status IN ('open', 'pending', 'resolved')),
  sentiment text NOT NULL CHECK (sentiment IN ('frustrated', 'neutral', 'positive')),
  assignee text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, organization_id),
  UNIQUE (organization_id, reference)
);

CREATE INDEX tickets_organization_updated_idx
  ON tickets (organization_id, updated_at DESC);

CREATE TABLE ticket_messages (
  id text NOT NULL,
  ticket_id text NOT NULL,
  organization_id text NOT NULL,
  author text NOT NULL,
  author_type text NOT NULL CHECK (author_type IN ('customer', 'agent')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, organization_id),
  CONSTRAINT ticket_messages_ticket_fk
    FOREIGN KEY (ticket_id, organization_id)
    REFERENCES tickets(id, organization_id)
    ON DELETE CASCADE
);

CREATE INDEX ticket_messages_ticket_created_idx
  ON ticket_messages (organization_id, ticket_id, created_at);

CREATE TABLE knowledge (
  id text NOT NULL,
  organization_id text NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  source_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, organization_id)
);

CREATE TABLE ticket_knowledge (
  ticket_id text NOT NULL,
  knowledge_id text NOT NULL,
  organization_id text NOT NULL,
  PRIMARY KEY (ticket_id, knowledge_id, organization_id),
  CONSTRAINT ticket_knowledge_ticket_fk
    FOREIGN KEY (ticket_id, organization_id)
    REFERENCES tickets(id, organization_id)
    ON DELETE CASCADE,
  CONSTRAINT ticket_knowledge_source_fk
    FOREIGN KEY (knowledge_id, organization_id)
    REFERENCES knowledge(id, organization_id)
    ON DELETE CASCADE
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge FORCE ROW LEVEL SECURITY;
ALTER TABLE ticket_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_knowledge FORCE ROW LEVEL SECURITY;

CREATE POLICY tickets_tenant_isolation ON tickets
  USING (organization_id = current_setting('app.organization_id', true))
  WITH CHECK (organization_id = current_setting('app.organization_id', true));

CREATE POLICY ticket_messages_tenant_isolation ON ticket_messages
  USING (organization_id = current_setting('app.organization_id', true))
  WITH CHECK (organization_id = current_setting('app.organization_id', true));

CREATE POLICY knowledge_tenant_isolation ON knowledge
  USING (organization_id = current_setting('app.organization_id', true))
  WITH CHECK (organization_id = current_setting('app.organization_id', true));

CREATE POLICY ticket_knowledge_tenant_isolation ON ticket_knowledge
  USING (organization_id = current_setting('app.organization_id', true))
  WITH CHECK (organization_id = current_setting('app.organization_id', true));

GRANT USAGE ON SCHEMA public TO resolveai_app;
GRANT SELECT ON tickets, ticket_messages, knowledge, ticket_knowledge TO resolveai_app;
