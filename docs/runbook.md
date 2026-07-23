# Operations runbook

## Service signals

- `GET /api/health` confirms the process can serve requests and reports whether
  the live or deterministic provider is configured.
- Every draft response includes `X-Request-Id`; application events use the same
  identifier.
- `draft_generated`, `draft_rate_limited`, and `draft_generation_failed` are the
  current structured event names.

The demo exposes no customer send operation, so a drafting incident cannot
directly deliver model output.

## Provider degradation

Symptoms: elevated 503 responses, `draft_generation_failed` events, or provider
latency approaching the 20-second timeout.

1. Correlate reports with request identifiers and the deployment version.
2. Check provider status, quota, credential rotation, and outbound connectivity.
3. Disable the live credential to fall back to deterministic drafting for demos.
   Do not present deterministic output as live AI behavior.
4. Preserve aggregate error counts and error types; do not copy ticket text or
   provider payloads into incident channels.
5. Restore the live provider only after a health check and a synthetic draft.

## Unexpected rate limiting

Symptoms: sustained 429 responses or `draft_rate_limited` events for legitimate
actors.

1. Confirm the organization and actor dimensions from structured events.
2. Look for retry loops or automation ignoring `Retry-After`.
3. Restarting clears demo limiter state but is not a production mitigation.
4. Before multi-instance deployment, replace the limiter with an atomic Redis
   implementation and monitor rejection rate by tenant.

## Tenant-isolation alarm

Treat any suspected cross-tenant access as a high-severity security incident.

1. Stop affected traffic and preserve access logs.
2. Record deployment version, request identifiers, actor tenant, requested
   resource, and timestamps without spreading ticket content.
3. Verify the route lookup, domain authorization check, and data adapter.
4. Rotate exposed credentials and notify affected parties according to the
   applicable response policy.
5. Add a regression test before restoring service.

## Prompt injection or unsafe draft

1. Do not send the draft.
2. Preserve a redacted reproduction in the evaluation dataset.
3. Identify whether the failure came from prompt boundaries, retrieval,
   citation validation, or reviewer workflow.
4. Add a targeted regression case and confirm existing quality thresholds.
5. Update the threat model if the abuse path is new.

## Rollback

1. Identify the last verified image by immutable commit SHA.
2. Route traffic to that image and verify `/api/health`.
3. Run a synthetic same-tenant draft and a cross-tenant rejection check.
4. Retain the failed image and correlated events for diagnosis.

Database rollback procedures will be added with the persistence milestone.
Forward-compatible migrations are required before that milestone can deploy.
