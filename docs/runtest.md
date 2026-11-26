pnpm run test:unit
pnpm run test:integration
pnpm run test:e2e
pnpm run test:perf
pnpm run test:all
pnpm exec playwright install chromium

## E2E / performance test auth bypass

`proxy.ts` skips `auth.protect()` when `E2E_TEST_MODE=1` so unauthenticated
Playwright suites can reach `/manage` and `/pos`. The variable must be present in
the server process env — the Playwright configs set it via `webServer.env`, and
`.env.local` carries `E2E_TEST_MODE=1` for `reuseExistingServer` dev runs.
**Never set it in a real deployment.**

Note: `proxy.ts` contains a workaround for a Next.js 16.4.6 issue where
`clerkMiddleware`'s internal auth-header rewrite re-enters proxy.ts and loops
forever (every request hangs ~30s then 500s). The second pass is detected via the
injected `x-clerk-*` headers and allowed through.
