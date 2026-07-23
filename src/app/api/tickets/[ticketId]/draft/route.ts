import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { draftRequestSchema } from "@/domain/ai/schemas";
import { createDraftService } from "@/server/ai/service";
import { getRequestActor } from "@/server/auth/request-actor";
import { createTicketRepository } from "@/server/data/ticket-repository";
import { logEvent } from "@/server/observability/logger";
import { checkRateLimit } from "@/server/security/rate-limit";

type RouteContext = { params: Promise<{ ticketId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const requestId = randomUUID();

  try {
    const actor = getRequestActor(request.headers);
    const rateLimit = checkRateLimit(`${actor.organizationId}:${actor.userId}`);

    if (!rateLimit.allowed) {
      logEvent("warn", "draft_rate_limited", {
        requestId,
        organizationId: actor.organizationId
      });
      return NextResponse.json(
        { error: "Too many draft requests. Try again shortly.", requestId },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
            "X-Request-Id": requestId
          }
        }
      );
    }

    const { ticketId } = await context.params;
    const repository = await createTicketRepository();
    const ticket = await repository.findById(actor, ticketId);

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found.", requestId },
        { status: 404, headers: { "X-Request-Id": requestId } }
      );
    }

    const input = draftRequestSchema.parse(await request.json());
    const service = createDraftService();
    const draft = await service.createDraft({ actor, ticket, input });

    logEvent("info", "draft_generated", {
      requestId,
      organizationId: actor.organizationId,
      provider: draft.provider
    });
    return NextResponse.json(
      { draft, rateLimit, requestId },
      { headers: { "X-Request-Id": requestId } }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request.",
          details: error.flatten().fieldErrors,
          requestId
        },
        { status: 400, headers: { "X-Request-Id": requestId } }
      );
    }

    logEvent("error", "draft_generation_failed", { requestId }, error);
    return NextResponse.json(
      {
        error: "The draft could not be generated. No customer message was sent.",
        requestId
      },
      { status: 503, headers: { "X-Request-Id": requestId } }
    );
  }
}
