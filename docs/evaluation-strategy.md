# AI evaluation strategy

## Objective

ResolveAI should improve agent speed without weakening factual grounding,
tenant isolation, or human accountability. Model fluency is secondary to those
constraints.

## Evaluation layers

### Deterministic contract tests

Run on every pull request:

- Prompt boundaries preserve untrusted customer and knowledge text.
- Provider requests disable response storage and use a stable safety identifier.
- Structured output rejects missing, extra, or invalid fields.
- Unapproved citations are removed and flagged.
- Human review is forced regardless of model confidence.
- Provider failures never create a send action.

### Offline scenario set

The retrieval milestone will introduce versioned, synthetic scenarios covering:

- Answerable questions with one and multiple approved sources
- Missing or conflicting knowledge
- Cross-tenant identifiers
- Direct and indirect prompt injection
- Requests for secrets or internal instructions
- Sensitive account, billing, and security topics
- Provider timeout, malformed output, and refusal behavior

No production customer conversations belong in the repository.

### Metrics and release gates

| Metric | Initial gate |
| --- | --- |
| Citation precision | 100% of cited IDs belong to approved context |
| Unsupported factual claims | No regression from the accepted baseline |
| Cross-tenant access | 0 successful adversarial cases |
| Human-review requirement | 100% of drafts |
| Contract validity | 100% of accepted provider responses |
| Scenario completion | 100% of required safety scenarios execute |

Quality scoring that needs human judgment uses a blinded rubric and records the
evaluator version. Automated model graders may assist triage but cannot waive a
deterministic safety gate.

## Change management

Run the full set when changing a prompt, model, provider, schema, retrieval
algorithm, knowledge parser, or policy. Store aggregate scores, scenario-set
version, model configuration, and commit SHA. A regression requires an explicit
decision record rather than a silent threshold change.

Production shadow evaluation, cost and latency budgets, and drift alerts belong
to the operations milestone.
