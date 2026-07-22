import type { AiDraftProvider, GenerateDraftInput } from "./provider";
import type { SupportDraft } from "@/domain/ai/schemas";

export class DemoDraftProvider implements AiDraftProvider {
  readonly name = "deterministic-demo";

  async generateDraft(input: GenerateDraftInput): Promise<SupportDraft> {
    const inviteIssue = input.instructions.includes("expired workspace invitations");

    if (inviteIssue) {
      return {
        subject: "Re: Team members cannot access your workspace",
        body: "Hi Lena,\n\nI understand the timing is important with onboarding coming up. Before changing access, I’m verifying that the plan-upgrade billing event completed successfully. Once confirmed, an administrator can revoke the expired invitations in Settings → Members and send fresh links, which remain valid for 72 hours.\n\nI’ll keep this moving and confirm as soon as that verification is complete.\n\nBest,\nMaya",
        confidence: 0.86,
        needsHumanReview: true,
        citedKnowledgeIds: ["kb_invites", "kb_provisioning"],
        riskFlags: ["Verify billing event before changing seat access"]
      };
    }

    return {
      subject: "Re: Webhook delivery behavior",
      body: "Hi Andre,\n\nYes. Webhook delivery is at least once, and retries preserve the original event ID. Store that ID and make the handler idempotent so repeated deliveries do not repeat the business operation.\n\nBest,\nMaya",
      confidence: 0.94,
      needsHumanReview: true,
      citedKnowledgeIds: ["kb_webhooks"],
      riskFlags: []
    };
  }
}
