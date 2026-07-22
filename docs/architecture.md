# Architecture

## Design goals

ResolveAI prioritizes tenant isolation, explainable AI behavior, safe failure,
and a short path from local development to a horizontally scaled deployment.

## Request flow

1. The route resolves a verified actor boundary. The current demo adapter uses
   headers; production will use signed session claims.
2. Rate limiting is applied per organization and actor.
3. Ticket lookup is scoped to the actor's organization.
4. The domain service repeats the tenant check before invoking any provider.
5. Customer and knowledge text are escaped and placed in explicit untrusted-data
   boundaries.
6. The provider returns a structured draft rather than unconstrained text.
7. Runtime validation rejects malformed results.
8. Citation IDs are intersected with the approved knowledge set.
9. Human review is forced, regardless of provider confidence.

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

## Target deployment

The Next.js standalone image runs behind a managed load balancer. PostgreSQL is
the system of record. Redis provides distributed rate limiting and a queue for
document ingestion and evaluation jobs. Object storage holds uploaded source
documents. OpenTelemetry exports traces, metrics, and correlated application
logs.

## Failure behavior

- Authorization failures do not disclose whether another tenant's ticket exists.
- Provider timeouts return a retryable error and never send partial content.
- Missing knowledge disables drafting rather than inviting unsupported claims.
- Invalid or unapproved citations are removed and surfaced for review.
- The AI provider is optional, so demos and core development do not depend on an
  external service.
