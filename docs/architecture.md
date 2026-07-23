# Architecture

## Design goals

ResolveAI prioritizes tenant isolation, explainable AI behavior, safe failure,
and a short path from local development to a horizontally scaled deployment.

## Request flow

1. The route resolves a verified actor boundary. The current demo adapter uses
   headers; production will use signed session claims.
2. Rate limiting is applied per organization and actor.
3. The selected repository looks up the ticket. PostgreSQL mode starts a
   transaction, assumes the restricted application role, and sets tenant context
   with transaction-local configuration.
4. Forced row-level security scopes the ticket, message, knowledge, and join
   queries to that tenant.
5. The domain service repeats the tenant check before invoking any provider.
6. Customer and knowledge text are escaped and placed in explicit untrusted-data
   boundaries.
7. The provider returns a structured draft rather than unconstrained text.
8. Runtime validation rejects malformed results.
9. Citation IDs are intersected with the approved knowledge set.
10. Human review is forced, regardless of provider confidence.

## Boundaries

### Web

Next.js owns rendering, HTTP translation, and deployment packaging. Routes do
not contain AI policy or business rules.

### Domain

The draft service owns authorization defense in depth, grounding checks, and
review requirements. It depends on the `AiDraftProvider` interface rather than a
vendor SDK.

### Providers

The deterministic provider supports local work and reliable UI tests. The live
provider uses the OpenAI Responses API. This separation also makes provider
fallback, shadow evaluation, and cost routing possible without changing routes.

### Data

The `TicketRepository` boundary selects deterministic fixtures by default or
PostgreSQL when explicitly configured. The PostgreSQL adapter uses one
transaction per operation. `SET LOCAL ROLE` and `set_config(..., true)` bind the
database authorization context to that transaction, so a pooled connection
cannot retain another tenant's identity.

RLS is enabled and forced on tickets, messages, knowledge, and ticket-knowledge
associations. Composite foreign keys include `organization_id`, preventing
cross-tenant relationships even during privileged migrations. Application
queries execute through a role that owns no tables and receives only `SELECT`
on the current read slice.

## Target deployment

The Next.js standalone image runs behind a managed load balancer. The shipped
PostgreSQL repository becomes the system of record after production identity,
credentials, backups, and migration controls are configured. Redis provides distributed rate limiting and a queue for
document ingestion and evaluation jobs. Object storage holds uploaded source
documents. OpenTelemetry exports traces, metrics, and correlated application
logs.

## Failure behavior

- Authorization failures do not disclose whether another tenant's ticket exists.
- Provider timeouts return a retryable error and never send partial content.
- Missing knowledge disables drafting rather than inviting unsupported claims.
- Invalid or unapproved citations are removed and surfaced for review.
- Missing database tenant context returns zero rows.
- Database operations roll back before a pooled connection is released.
- The AI provider is optional, so demos and core development do not depend on an
  external service.
