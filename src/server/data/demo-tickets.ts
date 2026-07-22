import type { Ticket } from "@/domain/tickets/types";

export const demoTickets: Ticket[] = [
  {
    id: "ticket_1048",
    reference: "#1048",
    organizationId: "org_northstar",
    customer: { name: "Lena Ortiz", company: "Atlas Coffee", initials: "LO" },
    subject: "Team members cannot access our workspace",
    preview: "We upgraded this morning, but the invitations still show as expired…",
    priority: "urgent",
    status: "open",
    sentiment: "frustrated",
    assignee: "Maya Chen",
    updatedAt: "7 min",
    messages: [
      {
        id: "message_1",
        author: "Lena Ortiz",
        authorType: "customer",
        createdAt: "Today at 10:42 AM",
        body: "Hi team — we upgraded to Scale this morning so our support leads could join. Every invitation still opens an expired-link page. We have onboarding in two hours and need six people added. Can you help?"
      },
      {
        id: "message_2",
        author: "Maya Chen",
        authorType: "agent",
        createdAt: "Today at 10:49 AM",
        body: "I’m looking into the workspace provisioning event now. I’ll confirm the safest next step shortly."
      }
    ],
    knowledge: [
      {
        id: "kb_invites",
        title: "Resetting expired workspace invitations",
        body: "Workspace administrators can revoke expired invitations and issue new links from Settings → Members. Newly issued links remain valid for 72 hours.",
        sourceUrl: "/docs/workspace-invitations"
      },
      {
        id: "kb_provisioning",
        title: "Plan upgrades and seat provisioning",
        body: "Seat entitlements should update immediately after a successful plan upgrade. If seats remain unavailable after five minutes, support must verify the billing event before changing access manually.",
        sourceUrl: "/docs/seat-provisioning"
      }
    ]
  },
  {
    id: "ticket_1043",
    reference: "#1043",
    organizationId: "org_northstar",
    customer: { name: "Andre Silva", company: "Fieldwork", initials: "AS" },
    subject: "Webhook deliveries are arriving twice",
    preview: "Our integration processed duplicate invoice.paid events yesterday…",
    priority: "high",
    status: "open",
    sentiment: "neutral",
    assignee: "Unassigned",
    updatedAt: "24 min",
    messages: [
      {
        id: "message_3",
        author: "Andre Silva",
        authorType: "customer",
        createdAt: "Today at 10:25 AM",
        body: "We received two deliveries for the same invoice.paid event. Are event IDs stable so we can deduplicate safely?"
      }
    ],
    knowledge: [
      {
        id: "kb_webhooks",
        title: "Webhook delivery guarantees",
        body: "Webhook delivery is at least once. Consumers must store the event ID and make handlers idempotent. Retries use the same event ID.",
        sourceUrl: "/docs/webhook-retries"
      }
    ]
  },
  {
    id: "ticket_1039",
    reference: "#1039",
    organizationId: "org_northstar",
    customer: { name: "Nia Brooks", company: "Gather Studio", initials: "NB" },
    subject: "Export finished — thank you",
    preview: "The replacement export completed and the totals match now…",
    priority: "normal",
    status: "pending",
    sentiment: "positive",
    assignee: "Maya Chen",
    updatedAt: "1 hr",
    messages: [
      {
        id: "message_4",
        author: "Nia Brooks",
        authorType: "customer",
        createdAt: "Today at 9:36 AM",
        body: "The replacement export completed and the totals match now. Thank you for the quick investigation."
      }
    ],
    knowledge: []
  }
];

export function findDemoTicket(id: string) {
  return demoTickets.find((ticket) => ticket.id === id);
}
