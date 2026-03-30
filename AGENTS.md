# What is this project?

Cache is a modern well-crafted web application meant to unify user bookmarks across all mainstream platforms, meant for power-users.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Tech stack

- runtime & package manager: Node.js >= 24, Bun, read Bun API docs in `node_modules/bun-types/docs/**.mdx` if necessary.
- framework: Next.js 16 (App Router)
- ui: React 19; COSS (Base-UI); lucide-react; motion (aka framer-motion);
- styling: Tailwind CSS 4
- validation: zod
- auth: better-auth with better-auth/stripe (subscriptions)
- payments: Stripe
- tooling: TypeScript 6 (strict typing, never use `any`), Biome via Ultracite

## Logging and error handling

- Logging lives at `lib/logs/console/logger.ts`:
  - `createLogger(module)` returns a scoped logger with `.debug/.info/.warn/.error` and a `.time()` helper for spans.
- Named errors live at `lib/error.ts`:
  - `NamedError.create("SomeDomainError", z.object({...}))` creates a typed error class with runtime-validated `data` and a stable `name`.
  - Use these in services and actions to propagate domain failures with structured metadata (e.g., `{ operation, message, ... }`).
