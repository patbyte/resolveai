import type { Ticket } from "@/domain/tickets/types";
import type { RequestActor } from "@/server/auth/request-actor";
import { demoTickets } from "./demo-tickets";

export interface TicketRepository {
  findById(actor: RequestActor, ticketId: string): Promise<Ticket | null>;
}

export class DemoTicketRepository implements TicketRepository {
  async findById(actor: RequestActor, ticketId: string) {
    return (
      demoTickets.find(
        (ticket) =>
          ticket.id === ticketId && ticket.organizationId === actor.organizationId
      ) ?? null
    );
  }
}

export async function createTicketRepository(): Promise<TicketRepository> {
  if (process.env.TICKET_STORE !== "postgres") {
    return new DemoTicketRepository();
  }

  const { getPostgresTicketRepository } = await import("./postgres-ticket-repository");
  return getPostgresTicketRepository();
}

export function getTicketStoreMode() {
  return process.env.TICKET_STORE === "postgres" ? "postgres" : "demo";
}
