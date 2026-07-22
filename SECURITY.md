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
