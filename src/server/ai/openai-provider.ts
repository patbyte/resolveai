import { supportDraftSchema, type SupportDraft } from "@/domain/ai/schemas";
import type { AiDraftProvider, GenerateDraftInput } from "./provider";

const supportDraftJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "subject",
    "body",
    "confidence",
    "needsHumanReview",
    "citedKnowledgeIds",
    "riskFlags"
  ],
  properties: {
    subject: { type: "string", minLength: 1, maxLength: 160 },
    body: { type: "string", minLength: 1, maxLength: 4000 },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    needsHumanReview: { type: "boolean" },
    citedKnowledgeIds: { type: "array", maxItems: 8, items: { type: "string" } },
    riskFlags: { type: "array", maxItems: 8, items: { type: "string" } }
  }
} as const;

type ResponsesApiResult = { output_text?: string };

export class OpenAiDraftProvider implements AiDraftProvider {
  readonly name = "openai-responses";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly fetcher: typeof fetch = fetch
  ) {}

  async generateDraft(input: GenerateDraftInput): Promise<SupportDraft> {
    const response = await this.fetcher("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        input: input.instructions,
        reasoning: { effort: "low" },
        safety_identifier: input.safetyIdentifier,
        store: false,
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "support_draft",
            strict: true,
            schema: supportDraftJsonSchema
          }
        }
      }),
      signal: AbortSignal.timeout(20_000)
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as ResponsesApiResult;
    if (!payload.output_text) {
      throw new Error("OpenAI response did not include structured output");
    }

    return supportDraftSchema.parse(JSON.parse(payload.output_text));
  }
}
