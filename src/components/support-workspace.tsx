"use client";

import { useMemo, useState } from "react";
import type { SupportDraft } from "@/domain/ai/schemas";
import type { Ticket } from "@/domain/tickets/types";

type DraftResult = SupportDraft & { provider: string };

export function SupportWorkspace({ initialTickets }: { initialTickets: Ticket[] }) {
  const [activeId, setActiveId] = useState(initialTickets[0]?.id ?? "");
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeTicket = useMemo(
    () => initialTickets.find((ticket) => ticket.id === activeId) ?? initialTickets[0],
    [activeId, initialTickets]
  );

  if (!activeTicket) return null;

  async function generateDraft() {
    setIsGenerating(true);
    setError(null);
    setDraft(null);

    try {
      const response = await fetch(`/api/tickets/${activeTicket.id}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone: "warm" })
      });
      const payload = (await response.json()) as { draft?: DraftResult; error?: string };
      if (!response.ok || !payload.draft) throw new Error(payload.error ?? "Draft generation failed");
      setDraft(payload.draft);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Draft generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  function selectTicket(id: string) {
    setActiveId(id);
    setDraft(null);
    setError(null);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><LogoIcon /><span>resolve<span>ai</span></span></div>
        <nav aria-label="Primary navigation" className="primary-nav">
          <NavItem icon={<InboxIcon />} label="Inbox" count="12" active />
          <NavItem icon={<SparkIcon />} label="AI review" count="3" />
          <NavItem icon={<BookIcon />} label="Knowledge" />
          <NavItem icon={<ChartIcon />} label="Insights" />
        </nav>
        <div className="sidebar-spacer" />
        <div className="health-card">
          <div className="health-card__heading"><span className="live-dot" />Systems healthy</div>
          <p>All workflows operational</p>
          <div className="health-bar"><span /></div>
        </div>
        <button className="profile-chip">
          <span className="avatar avatar--agent">MC</span>
          <span><strong>Maya Chen</strong><small>Support lead</small></span>
          <span className="more">•••</span>
        </button>
      </aside>

      <section className="ticket-column">
        <header className="column-header">
          <div><p className="eyebrow">Workspace</p><h1>Support inbox</h1></div>
          <button className="icon-button" aria-label="Filter tickets"><FilterIcon /></button>
        </header>
        <div className="queue-summary">
          <div><strong>12</strong><span>Open</span></div>
          <div><strong>4</strong><span>Mine</span></div>
          <div><strong>3</strong><span>AI ready</span></div>
        </div>
        <div className="ticket-list">
          {initialTickets.map((ticket) => (
            <button
              className={`ticket-card ${ticket.id === activeTicket.id ? "ticket-card--active" : ""}`}
              key={ticket.id}
              onClick={() => selectTicket(ticket.id)}
            >
              <div className="ticket-card__top">
                <span className={`priority priority--${ticket.priority}`}>{ticket.priority}</span>
                <time>{ticket.updatedAt}</time>
              </div>
              <h2>{ticket.subject}</h2>
              <p>{ticket.preview}</p>
              <div className="ticket-card__person">
                <span className="avatar">{ticket.customer.initials}</span>
                <span><strong>{ticket.customer.name}</strong><small>{ticket.customer.company}</small></span>
                {ticket.sentiment === "frustrated" && <span className="sentiment">Needs care</span>}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="conversation-column">
        <header className="conversation-header">
          <div>
            <div className="conversation-meta"><span>{activeTicket.reference}</span><span>•</span><span>{activeTicket.status}</span></div>
            <h2>{activeTicket.subject}</h2>
          </div>
          <div className="header-actions">
            <button className="secondary-button">Assign to me</button>
            <button className="icon-button" aria-label="More ticket actions">•••</button>
          </div>
        </header>

        <div className="conversation-body">
          <div className="day-divider"><span>Today</span></div>
          {activeTicket.messages.map((message) => (
            <article className={`message message--${message.authorType}`} key={message.id}>
              <div className="avatar">{message.author.split(" ").map((word) => word[0]).join("")}</div>
              <div className="message__content">
                <div className="message__header"><strong>{message.author}</strong><time>{message.createdAt}</time></div>
                <p>{message.body}</p>
              </div>
            </article>
          ))}
        </div>

        <footer className="composer">
          {error && <div className="error-banner" role="alert">{error}</div>}
          {draft ? (
            <div className="draft-panel">
              <div className="draft-panel__header">
                <span className="ai-badge"><SparkIcon /> AI draft</span>
                <span>{Math.round(draft.confidence * 100)}% confidence · Review required</span>
              </div>
              <textarea aria-label="AI-generated reply draft" defaultValue={draft.body} rows={7} />
              <div className="draft-panel__footer">
                <span>Grounded in {draft.citedKnowledgeIds.length} approved sources</span>
                <div><button className="text-button" onClick={() => setDraft(null)}>Discard</button><button className="primary-button">Approve draft</button></div>
              </div>
            </div>
          ) : (
            <div className="composer-empty">
              <div><strong>Reply to {activeTicket.customer.name}</strong><span>AI drafts are grounded in approved knowledge and never sent automatically.</span></div>
              <button className="primary-button" onClick={generateDraft} disabled={isGenerating || activeTicket.knowledge.length === 0}>
                <SparkIcon /> {isGenerating ? "Drafting…" : "Generate draft"}
              </button>
            </div>
          )}
        </footer>
      </section>

      <aside className="context-column">
        <section className="context-section customer-card">
          <p className="eyebrow">Customer</p>
          <div className="customer-card__identity"><span className="avatar avatar--large">{activeTicket.customer.initials}</span><div><h3>{activeTicket.customer.name}</h3><p>{activeTicket.customer.company}</p></div></div>
          <dl><div><dt>Plan</dt><dd>Scale</dd></div><div><dt>Lifetime value</dt><dd>$18,420</dd></div><div><dt>Customer since</dt><dd>May 2023</dd></div></dl>
        </section>
        <section className="context-section">
          <div className="section-title"><div><p className="eyebrow">AI context</p><h3>Relevant knowledge</h3></div><span>{activeTicket.knowledge.length}</span></div>
          <div className="knowledge-list">
            {activeTicket.knowledge.length > 0 ? activeTicket.knowledge.map((item, index) => (
              <article className="knowledge-card" key={item.id}>
                <span className="knowledge-card__number">0{index + 1}</span>
                <div><h4>{item.title}</h4><p>{item.body}</p><span className="source-label"><BookIcon /> Approved source</span></div>
              </article>
            )) : <p className="empty-context">No approved knowledge is attached to this ticket. AI drafting is paused.</p>}
          </div>
        </section>
        <section className="context-section safeguard-card">
          <div className="safeguard-icon"><ShieldIcon /></div>
          <div><h3>Human in the loop</h3><p>AI can draft and cite. Only an authorized agent can send.</p></div>
        </section>
      </aside>
    </main>
  );
}

function NavItem({ icon, label, count, active = false }: { icon: React.ReactNode; label: string; count?: string; active?: boolean }) {
  return <button className={`nav-item ${active ? "nav-item--active" : ""}`}>{icon}<span>{label}</span>{count && <small>{count}</small>}</button>;
}

const Icon = ({ children }: { children: React.ReactNode }) => <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
const LogoIcon = () => <Icon><path d="M4 5h16v11H9l-5 4V5Z"/><path d="m9 10 2 2 4-4"/></Icon>;
const InboxIcon = () => <Icon><path d="M4 5h16v14H4z"/><path d="M4 13h4l2 3h4l2-3h4"/></Icon>;
const SparkIcon = () => <Icon><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"/><path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"/></Icon>;
const BookIcon = () => <Icon><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z"/></Icon>;
const ChartIcon = () => <Icon><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/></Icon>;
const FilterIcon = () => <Icon><path d="M4 6h16M7 12h10M10 18h4"/></Icon>;
const ShieldIcon = () => <Icon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></Icon>;
