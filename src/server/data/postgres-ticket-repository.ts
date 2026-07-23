import { Pool, type PoolClient } from "pg";
import type {
  ConversationMessage,
  KnowledgeExcerpt,
  Ticket,
  TicketPriority,
  TicketStatus
} from "@/domain/tickets/types";
import type { RequestActor } from "@/server/auth/request-actor";
import type { TicketRepository } from "./ticket-repository";

type TicketRow = {
  id: string;
  reference: string;
  organization_id: string;
  customer_name: string;
  customer_company: string;
  customer_initials: string;
  subject: string;
  preview: string;
  priority: TicketPriority;
  status: TicketStatus;
  sentiment: Ticket["sentiment"];
  assignee: string;
  updated_at: Date;
};

type MessageRow = {
  id: string;
  author: string;
  author_type: ConversationMessage["authorType"];
  body: string;
  created_at: Date;
};

type KnowledgeRow = {
  id: string;
  title: string;
  body: string;
  source_url: string;
};

const globalForPostgres = globalThis as typeof globalThis & {
  resolveAiPool?: Pool;
};

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required when TICKET_STORE=postgres");
  }

  return new Pool({
    connectionString,
    max: 10,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    application_name: "resolveai-web"
  });
}

export class PostgresTicketRepository implements TicketRepository {
  constructor(private readonly pool: Pool) {}

  async findById(actor: RequestActor, ticketId: string): Promise<Ticket | null> {
    return this.withTenant(actor, async (client) => {
      const ticketResult = await client.query<TicketRow>(
        `SELECT id, reference, organization_id, customer_name, customer_company,
                customer_initials, subject, preview, priority, status, sentiment,
                assignee, updated_at
           FROM tickets
          WHERE id = $1`,
        [ticketId]
      );
      const row = ticketResult.rows[0];
      if (!row) {
        return null;
      }

      const [messageResult, knowledgeResult] = await Promise.all([
        client.query<MessageRow>(
          `SELECT id, author, author_type, body, created_at
             FROM ticket_messages
            WHERE ticket_id = $1
            ORDER BY created_at ASC`,
          [ticketId]
        ),
        client.query<KnowledgeRow>(
          `SELECT knowledge.id, knowledge.title, knowledge.body, knowledge.source_url
             FROM knowledge
             JOIN ticket_knowledge
               ON ticket_knowledge.knowledge_id = knowledge.id
              AND ticket_knowledge.organization_id = knowledge.organization_id
            WHERE ticket_knowledge.ticket_id = $1
            ORDER BY knowledge.id ASC`,
          [ticketId]
        )
      ]);

      return mapTicket(row, messageResult.rows, knowledgeResult.rows);
    });
  }

  private async withTenant<T>(
    actor: RequestActor,
    operation: (client: PoolClient) => Promise<T>
  ) {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL ROLE resolveai_app");
      await client.query(
        "SELECT set_config('app.organization_id', $1, true), set_config('app.user_id', $2, true)",
        [actor.organizationId, actor.userId]
      );
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

function mapTicket(
  row: TicketRow,
  messages: MessageRow[],
  knowledge: KnowledgeRow[]
): Ticket {
  return {
    id: row.id,
    reference: row.reference,
    organizationId: row.organization_id,
    customer: {
      name: row.customer_name,
      company: row.customer_company,
      initials: row.customer_initials
    },
    subject: row.subject,
    preview: row.preview,
    priority: row.priority,
    status: row.status,
    sentiment: row.sentiment,
    assignee: row.assignee,
    updatedAt: row.updated_at.toISOString(),
    messages: messages.map(
      (message): ConversationMessage => ({
        id: message.id,
        author: message.author,
        authorType: message.author_type,
        body: message.body,
        createdAt: message.created_at.toISOString()
      })
    ),
    knowledge: knowledge.map(
      (item): KnowledgeExcerpt => ({
        id: item.id,
        title: item.title,
        body: item.body,
        sourceUrl: item.source_url
      })
    )
  };
}

export function getPostgresTicketRepository() {
  const pool = globalForPostgres.resolveAiPool ?? createPool();

  if (process.env.NODE_ENV !== "production") {
    globalForPostgres.resolveAiPool = pool;
  }

  return new PostgresTicketRepository(pool);
}
