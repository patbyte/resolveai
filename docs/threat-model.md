# Threat model

## Scope

This model covers ticket access and AI-assisted drafting in the current
single-process vertical slice. It does not claim that the demo identity adapter
or process-local limiter is suitable for production traffic.

## Assets and trust boundaries

| Asset | Primary risk | Current control |
| --- | --- | --- |
| Tenant ticket content | Cross-tenant disclosure | Tenant-scoped lookup and defense-in-depth domain check |
| Approved knowledge | Poisoning or unapproved citation | Explicit context set and citation allow-list |
| Customer messages | Prompt injection and unintended retention | Untrusted-data boundaries and provider storage disabled |
| Provider credential | Disclosure through source, logs, or errors | Environment injection and sanitized operational errors |
| Customer communication | Unsanctioned AI action | No send endpoint and mandatory human review |
| Service capacity | Automated draft abuse | Per-actor limiter; Redis replacement required for scaling |

The browser-to-route boundary is untrusted. The actor adapter, ticket repository,
AI provider, and future knowledge ingestion pipeline are separate trust
boundaries. Model input and output remain untrusted even after authentication.

## Abuse cases

### Cross-tenant ticket probing

An actor requests a known ticket identifier from another organization.

- The lookup result is indistinguishable from a missing record.
- The domain service repeats the tenant check before provider invocation.
- Production acceptance requires database row-level security integration tests.

### Prompt injection through customer content

A ticket asks the model to ignore policy, reveal instructions, or cite an
attacker-controlled source.

- Customer and knowledge text use explicit untrusted-data delimiters.
- The system instruction prohibits following commands found in that data.
- Returned citation identifiers are intersected with the approved set.
- Human review remains mandatory.

### Model output contract bypass

The provider returns malformed JSON, an unexpected field, or out-of-range
confidence.

- The API requests a strict JSON schema.
- Runtime validation treats provider output as untrusted.
- Invalid responses fail closed and do not create customer-visible actions.

### Cost or availability abuse

An automated client repeatedly requests drafts.

- Requests are limited per organization and actor.
- Provider errors are classified without exposing credentials or response bodies.
- Distributed enforcement and per-tenant budgets are required before scaling.

### Sensitive-data leakage through telemetry

An exception contains ticket text, a provider response, or a credential.

- Correlated logs contain identifiers, event names, and error types only.
- Error messages and model content are excluded from structured events.
- Production log access, retention, and deletion policies remain deployment
  responsibilities.

## Accepted risks in the demo

- Identity headers are forgeable.
- Rate-limit state is local to one process and resets on restart.
- Demo tickets are in application memory.
- There is no immutable audit store.
- Knowledge is curated fixture data rather than an ingestion pipeline.

These risks prohibit real customer data. The roadmap converts each into an
acceptance-tested production control.

## Review triggers

Review this model when adding authentication, persistence, retrieval, a send
action, another AI provider, file ingestion, or a new deployment boundary.
