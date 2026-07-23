# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Contact the repository
owner privately with reproduction steps, impact, and any suggested mitigation.
Do not include real customer data, credentials, or active exploit payloads.

## Supported versions

Only the latest commit on `main` is supported during the pre-1.0 phase.

## Demo limitations

The current actor resolver uses request headers to demonstrate the authorization
boundary. Those headers are not trustworthy authentication and must be replaced
with verified session claims before deployment with real users or data.

The in-memory rate limiter is process-local. A multi-instance deployment must use
a shared, atomic Redis implementation.

## Database isolation

PostgreSQL mode applies the verified actor's organization inside a transaction,
switches to the restricted `resolveai_app` role, and forces row-level security
on every table reachable by ticket reads. Composite foreign keys also prevent
messages or knowledge from being associated across tenants.

The migration connection owns schema objects and must not be used by the web
runtime in production. Provision a dedicated login that can assume only
`resolveai_app`, store its credential in a secret manager, and rotate it
independently. Integration tests use an owner connection solely to build
fixtures, then switch to the restricted role for application queries.
