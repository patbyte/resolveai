import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { RequestActor } from "@/server/auth/request-actor";
import { PostgresTicketRepository } from "@/server/data/postgres-ticket-repository";

const connectionString = process.env.INTEGRATION_DATABASE_URL;
if (!connectionString) {
  throw new Error("INTEGRATION_DATABASE_URL is required for integration tests");
}

const pool = new Pool({ connectionString, max: 4 });
const repository = new PostgresTicketRepository(pool);

const northstarActor: RequestActor = {
  organizationId: "org_northstar",
  userId: "user_maya",
  role: "agent",
  safetyIdentifier: "integration-northstar"
};

const harborActor: RequestActor = {
  organizationId: "org_harbor",
  userId: "user_ellis",
  role: "agent",
  safetyIdentifier: "integration-harbor"
};

beforeAll(async () => {
  await pool.query(`
    TRUNCATE ticket_knowledge, ticket_messages, knowledge, tickets, organizations
    CASCADE;

    INSERT INTO organizations (id, name) VALUES
      ('org_northstar', 'Northstar'),
      ('org_harbor', 'Harbor');

    INSERT INTO tickets (
      id, organization_id, reference, customer_name, customer_company,
      customer_initials, subject, preview, priority, status, sentiment,
      assignee, updated_at
    ) VALUES
      (
        'ticket_shared', 'org_northstar', '#1048', 'Lena Ortiz', 'Atlas Coffee',
        'LO', 'Workspace invitations', 'Invitations are expired', 'urgent',
        'open', 'frustrated', 'Maya Chen', '2026-07-23T10:00:00Z'
      ),
      (
        'ticket_shared', 'org_harbor', '#2048', 'Drew Kim', 'Harbor Labs',
        'DK', 'Billing export', 'Export is missing rows', 'high',
        'open', 'neutral', 'Ellis Gray', '2026-07-23T11:00:00Z'
      );

    INSERT INTO ticket_messages (
      id, ticket_id, organization_id, author, author_type, body, created_at
    ) VALUES
      (
        'message_northstar', 'ticket_shared', 'org_northstar', 'Lena Ortiz',
        'customer', 'Our invitations expired.', '2026-07-23T09:58:00Z'
      ),
      (
        'message_harbor', 'ticket_shared', 'org_harbor', 'Drew Kim',
        'customer', 'Our export is incomplete.', '2026-07-23T10:58:00Z'
      );

    INSERT INTO knowledge (id, organization_id, title, body, source_url) VALUES
      (
        'kb_shared', 'org_northstar', 'Invitation reset',
        'Administrators can issue a new invitation.', '/docs/invitations'
      ),
      (
        'kb_shared', 'org_harbor', 'Export retry',
        'Administrators can retry an export.', '/docs/exports'
      );

    INSERT INTO ticket_knowledge (ticket_id, knowledge_id, organization_id) VALUES
      ('ticket_shared', 'kb_shared', 'org_northstar'),
      ('ticket_shared', 'kb_shared', 'org_harbor');
  `);
});

afterAll(async () => {
  await pool.end();
});

describe("PostgresTicketRepository tenant isolation", () => {
  it("hydrates only the requesting tenant's ticket graph", async () => {
    const ticket = await repository.findById(northstarActor, "ticket_shared");

    expect(ticket).toMatchObject({
      organizationId: "org_northstar",
      subject: "Workspace invitations",
      messages: [{ id: "message_northstar", body: "Our invitations expired." }],
      knowledge: [{ id: "kb_shared", title: "Invitation reset" }]
    });
    expect(ticket?.messages).toHaveLength(1);
    expect(ticket?.knowledge).toHaveLength(1);
  });

  it("returns the other tenant's version only in that tenant context", async () => {
    const ticket = await repository.findById(harborActor, "ticket_shared");

    expect(ticket).toMatchObject({
      organizationId: "org_harbor",
      subject: "Billing export",
      messages: [{ id: "message_harbor" }],
      knowledge: [{ title: "Export retry" }]
    });
  });

  it("exposes no rows when the database role has no tenant context", async () => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE resolveai_app");
      const result = await client.query("SELECT id FROM tickets");

      expect(result.rows).toEqual([]);
    } finally {
      await client.query("ROLLBACK");
      client.release();
    }
  });

  it("does not leak tenant context between pooled transactions", async () => {
    const northstar = await repository.findById(northstarActor, "ticket_shared");
    const harbor = await repository.findById(harborActor, "ticket_shared");
    const northstarAgain = await repository.findById(northstarActor, "ticket_shared");

    expect([
      northstar?.organizationId,
      harbor?.organizationId,
      northstarAgain?.organizationId
    ]).toEqual(["org_northstar", "org_harbor", "org_northstar"]);
  });
});
