# ADR 0002: Require human approval for generated customer messages

Status: Accepted

## Context

Customer support replies can create contractual, security, billing, and trust
risks. Confidence scores are not guarantees, and retrieved content can be stale
or malicious.

## Decision

Generated output is always a draft. The domain service forces
`needsHumanReview` to true and the current API exposes no send operation.

## Consequences

The first release optimizes agent throughput rather than full automation. Any
future auto-send path requires a separate risk assessment, evaluation threshold,
auditable policy, and scoped approval workflow.
