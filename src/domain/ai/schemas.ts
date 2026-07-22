import { z } from "zod";

export const draftRequestSchema = z.object({
  tone: z.enum(["warm", "direct", "technical"]).default("warm"),
  agentNote: z.string().trim().max(500).optional()
});

export const supportDraftSchema = z.object({
  subject: z.string().min(1).max(160),
  body: z.string().min(1).max(4_000),
  confidence: z.number().min(0).max(1),
  needsHumanReview: z.boolean(),
  citedKnowledgeIds: z.array(z.string()).max(8),
  riskFlags: z.array(z.string()).max(8)
});

export type DraftRequest = z.infer<typeof draftRequestSchema>;
export type SupportDraft = z.infer<typeof supportDraftSchema>;
