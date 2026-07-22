export type TicketPriority = "urgent" | "high" | "normal" | "low";
export type TicketStatus = "open" | "pending" | "resolved";

export type ConversationMessage = {
  id: string;
  author: string;
  authorType: "customer" | "agent";
  body: string;
  createdAt: string;
};

export type KnowledgeExcerpt = {
  id: string;
  title: string;
  body: string;
  sourceUrl: string;
};

export type Ticket = {
  id: string;
  reference: string;
  organizationId: string;
  customer: {
    name: string;
    company: string;
    initials: string;
  };
  subject: string;
  preview: string;
  priority: TicketPriority;
  status: TicketStatus;
  sentiment: "frustrated" | "neutral" | "positive";
  assignee: string;
  updatedAt: string;
  messages: ConversationMessage[];
  knowledge: KnowledgeExcerpt[];
};
