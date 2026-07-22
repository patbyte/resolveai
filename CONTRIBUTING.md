# Contributing

Keep changes focused and explain the user or operational outcome. For behavior
changes, add tests at the narrowest useful boundary and update architecture
documentation when a decision or trust boundary changes.

## Development

1. Create a branch from `main`.
2. Copy `.env.example` to `.env.local`.
3. Install dependencies with `npm install`.
4. Run `npm run dev`.
5. Before opening a pull request, run lint, typecheck, tests, and build.

Never commit secrets, customer information, generated dependency folders, or
model outputs containing sensitive data.
