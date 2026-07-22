# ADR 0001: Isolate AI providers behind a domain interface

Status: Accepted

## Context

The application needs deterministic development, reliable tests, and the option
to evaluate multiple providers without coupling product routes to vendor APIs.

## Decision

Domain code depends on a narrow `AiDraftProvider` interface. Provider-specific
request formats, credentials, and response parsing stay in adapters.

## Consequences

The product can run without an API key and tests remain deterministic. New
provider capabilities must be translated into the stable domain schema, which
adds a small amount of adapter code but prevents vendor details from spreading.
