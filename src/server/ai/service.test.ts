import { describe, expect, it } from "vitest";
import { demoTickets } from "@/server/data/demo-tickets";
import type { AiDraftProvider } from "./provider";
import { DraftService } from "./service";

const actor = {
  organizationId: "org_northstar",
  userId: "user_maya",
  role: "agent" as const,
  safetyIdentifier: "safe-test-actor"
};

describe("DraftService", () => {
  it("rejects cross-organization access before invoking the provider", async () => {
    let invoked = false;
    const provider: AiDraftProvider = {
      name: "test",
      async generateDraft() {
        invoked = true;
        throw new Error("should not run");
      }
    };
    const service = new DraftService(provider);

    await expect(
      service.createDraft({
        actor: { ...actor, organizationId: "org_other" },
        ticket: demoTickets[0],
        input: { tone: "warm" }
      })
    ).rejects.toThrow("Cross-organization");
    expect(invoked).toBe(false);
  });

  it("drops unapproved citations and forces human review", async () => {
    const provider: AiDraftProvider = {
      name: "test",
      async generateDraft() {
        return {
          subject: "A draft",
          body: "A grounded response for review.",
          confidence: 0.8,
          needsHumanReview: false,
          citedKnowledgeIds: ["kb_invites", "untrusted_source"],
          riskFlags: []
        };
      }
    };
    const service = new DraftService(provider);
    const result = await service.createDraft({
      actor,
      ticket: demoTickets[0],
      input: { tone: "warm" }
    });

    expect(result.needsHumanReview).toBe(true);
    expect(result.citedKnowledgeIds).toEqual(["kb_invites"]);
    expect(result.riskFlags).toContain("Draft referenced unapproved knowledge");
  });
});
