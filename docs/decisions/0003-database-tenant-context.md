# ADR 0003: Enforce tenant context inside database transactions

## Status

Accepted

## Context

Application-only organization filters are easy to omit as query paths grow.
Connection pools add another risk: session state can survive one request and be
observed by the next tenant unless its lifetime is tightly controlled.

## Decision

Every PostgreSQL repository operation runs inside a transaction. Before reading
data, the adapter assumes the non-owner `resolveai_app` role and sets
`app.organization_id` and `app.user_id` with transaction-local configuration.

Forced row-level security compares each row's organization with that context.
Tenant identifiers are also present in composite primary and foreign keys, so
relationships cannot cross organizations. Context disappears on commit or
rollback before the client returns to the pool.

The deterministic fixture repository remains the default development path.
PostgreSQL mode must be selected explicitly.

## Consequences

- A missing tenant context fails closed with zero visible rows.
- Integration tests must execute under the restricted role, not the table owner.
- Repository methods own their transaction boundary.
- Cross-service reporting and administrative work require separate, audited
  roles rather than bypass flags in application queries.
- Production deployments need separate migration and runtime credentials.
