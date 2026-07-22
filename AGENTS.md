# Repository guidance

Before changing Next.js behavior, read the version-matched documentation in
`node_modules/next/dist/docs/`. Keep domain rules independent from framework
routes, validate every external input, and preserve organization boundaries.

Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before
submitting changes.
