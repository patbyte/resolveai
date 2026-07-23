import { describe, expect, it, vi } from "vitest";
import { AiProviderError, OpenAiDraftProvider } from "./openai-provider";

const input = {
  instructions: "Draft a grounded reply.",
  safetyIdentifier: "actor-8baf"
};

const validDraft = {
  subject: "Workspace invitations",
  body: "Please review this response before sending.",
  confidence: 0.88,
  needsHumanReview: true,
  citedKnowledgeIds: ["kb_invites"],
  riskFlags: []
};

describe("OpenAiDraftProvider", () => {
  it("requests strict structured output with privacy controls", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ output_text: JSON.stringify(validDraft) })
    );
    const provider = new OpenAiDraftProvider("secret-key", "test-model", fetcher);

    await expect(provider.generateDraft(input)).resolves.toEqual(validDraft);
    expect(fetcher).toHaveBeenCalledOnce();

    const [url, init] = fetcher.mock.calls[0];
    const body = JSON.parse(String(init?.body));

    expect(url).toBe("https://api.openai.com/v1/responses");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer secret-key" });
    expect(body).toMatchObject({
      model: "test-model",
      input: input.instructions,
      safety_identifier: input.safetyIdentifier,
      store: false,
      text: {
        format: {
          type: "json_schema",
          name: "support_draft",
          strict: true
        }
      }
    });
    expect(body.text.format.schema.additionalProperties).toBe(false);
  });

  it.each([
    { status: 429, retryable: true },
    { status: 503, retryable: true },
    { status: 400, retryable: false }
  ])("classifies upstream status $status", async ({ status, retryable }) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status }));
    const provider = new OpenAiDraftProvider("secret-key", "test-model", fetcher);

    const result = provider.generateDraft(input);

    await expect(result).rejects.toMatchObject({
      code: "upstream_rejected",
      retryable
    } satisfies Partial<AiProviderError>);
    await expect(result).rejects.not.toThrow("secret-key");
  });

  it("rejects output that violates the domain contract", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ output_text: JSON.stringify({ ...validDraft, confidence: 4 }) })
    );
    const provider = new OpenAiDraftProvider("secret-key", "test-model", fetcher);

    await expect(provider.generateDraft(input)).rejects.toMatchObject({
      code: "invalid_response",
      retryable: false
    } satisfies Partial<AiProviderError>);
  });

  it("rejects a response without structured output", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({}));
    const provider = new OpenAiDraftProvider("secret-key", "test-model", fetcher);

    await expect(provider.generateDraft(input)).rejects.toMatchObject({
      code: "invalid_response"
    } satisfies Partial<AiProviderError>);
  });
});
