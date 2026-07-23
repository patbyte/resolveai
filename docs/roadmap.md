# Roadmap

## Milestone 1 — Safe vertical slice (complete)

- Support workspace with responsive ticket review
- Tenant boundary and defense-in-depth authorization
- Deterministic and live AI provider adapters
- Structured output, grounding validation, and mandatory human review
- Unit tests, CI, health endpoint, and production container

## Milestone 2 — Durable multi-tenant core (in progress)

- [x] PostgreSQL ticket repository and checksum-verified migrations
- [x] Forced row-level security verified against PostgreSQL in CI
- [x] Composite tenant keys and transaction-scoped pooled connections
- Session authentication and role-based authorization
- Idempotent audit event recording
- Redis-backed distributed rate limiting

Acceptance: concurrent instances enforce the same limits, and an automated test
suite proves that no role can read or mutate another organization's records.

## Milestone 3 — Knowledge ingestion and retrieval

- Signed document uploads and malware scanning
- Asynchronous parsing and chunking jobs
- Hybrid semantic and keyword retrieval
- Source versioning, revocation, and freshness indicators
- Retrieval quality evaluation dataset

Acceptance: retrieval metrics and regression thresholds run in CI, and revoked
content cannot appear in new drafts.

## Milestone 4 — Production operations

- OpenTelemetry traces, metrics, and structured logs
- SLOs for inbox reads and draft generation
- Cost budgets and per-tenant usage reports
- Dead-letter queues and replay tooling
- Terraform deployment modules and staged release workflow

Acceptance: documented failure drills cover provider outage, queue backlog,
database failover, and compromised knowledge content.
