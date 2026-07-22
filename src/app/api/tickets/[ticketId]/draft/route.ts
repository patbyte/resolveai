import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { draftRequestSchema } from "@/domain/ai/schemas";
import { findDemoTicket } from "@/server/data/demo-tickets";
import { createDraftService } from "@/server/ai/service";
import { getRequestActor } from "@/server/auth/request-actor";
import { checkRateLimit } from "@/server/security/rate-limit";

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const actor = getRequestActor(request.headers);
    const rateLimit = checkRateLimit(`${actor.organizationId}:${actor.userId}`);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many draft requests. Try again shortly." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
      );
    }

    const { ticketId } = await context.params;
    const ticket = findDemoTicket(ticketId);

    if (!ticket || ticket.organizationId !== actor.organizationId) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }

    const input = draftRequestSchema.parse(await request.json());
    const service = createDraftService();
    const draft = await service.createDraft({ actor, ticket, input });

    return NextResponse.json({ draft, rateLimit });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request.", details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error("draft_generation_failed", error);
    return NextResponse.json(
      { error: "The draft could not be generated. No customer message was sent." },
      { status: 503 }
    );
  }
}
