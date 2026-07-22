import type { SupportDraft } from "@/domain/ai/schemas";

export type GenerateDraftInput = {
  instructions: string;
  safetyIdentifier: string;
};

export interface AiDraftProvider {
  readonly name: string;
  generateDraft(input: GenerateDraftInput): Promise<SupportDraft>;
}
