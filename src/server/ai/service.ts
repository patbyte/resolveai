import type { DraftRequest, SupportDraft } from "@/domain/ai/schemas";
import type { Ticket } from "@/domain/tickets/types";
import type { RequestActor } from "@/server/auth/request-actor";
import { DemoDraftProvider } from "./demo-provider";
import { OpenAiDraftProvider } from "./openai-provider";
import type { AiDraftProvider } from "./provider";
import { buildDraftPrompt } from "./prompt";

type CreateDraftCommand = {
  actor: RequestActor;
  ticket: Ticket;
  input: DraftRequest;
};

export class DraftService {
  constructor(private readonly provider: AiDraftProvider) {}

  async createDraft(command: CreateDraftCommand): Promise<SupportDraft & { provider: string }> {
    if (command.actor.organizationId !== command.ticket.organizationId) {
      throw new Error("Cross-organization ticket access denied");
    }

    const draft = await this.provider.generateDraft({
      instructions: buildDraftPrompt(command.ticket, command.input),
      safetyIdentifier: command.actor.safetyIdentifier
    });
    const approvedIds = new Set(command.ticket.knowledge.map((item) => item.id));
    const invalidCitations = draft.citedKnowledgeIds.filter((id) => !approvedIds.has(id));

    return {
      ...draft,
      needsHumanReview: true,
      citedKnowledgeIds: draft.citedKnowledgeIds.filter((id) => approvedIds.has(id)),
      riskFlags:
        invalidCitations.length > 0
          ? [...draft.riskFlags, "Draft referenced unapproved knowledge"]
          : draft.riskFlags,
      provider: this.provider.name
    };
  }
}

export function createDraftService() {
  const provider = process.env.OPENAI_API_KEY
    ? new OpenAiDraftProvider(
        process.env.OPENAI_API_KEY,
        process.env.OPENAI_MODEL ?? "gpt-5.6-terra"
      )
    : new DemoDraftProvider();

  return new DraftService(provider);
}
