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

export class AiProviderError extends Error {
  constructor(
    message: string,
    readonly code: "upstream_rejected" | "invalid_response",
    readonly retryable: boolean,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "AiProviderError";
  }
}

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
      throw new AiProviderError(
        `AI provider rejected the request with status ${response.status}`,
        "upstream_rejected",
        response.status === 408 || response.status === 429 || response.status >= 500
      );
    }

    let payload: ResponsesApiResult;
    try {
      payload = (await response.json()) as ResponsesApiResult;
    } catch (error) {
      throw new AiProviderError(
        "AI provider returned invalid JSON",
        "invalid_response",
        false,
        { cause: error }
      );
    }

    if (!payload.output_text) {
      throw new AiProviderError(
        "AI provider response did not include structured output",
        "invalid_response",
        false
      );
    }

    try {
      return supportDraftSchema.parse(JSON.parse(payload.output_text));
    } catch (error) {
      throw new AiProviderError(
        "AI provider response did not match the draft contract",
        "invalid_response",
        false,
        { cause: error }
      );
    }
  }
}
