/**
 * Verifies PostgreSQL + Prisma and that Better Auth can serve GET /api/auth/get-session.
 *
 * Uses `.env` from the project root. If OAuth/Stripe vars are empty, temporary
 * placeholders are applied so the auth module can load (smoke test only).
 *
 * Run: bun run scripts/check-db-auth.ts
 */
import { config } from "dotenv";

config();

/** Only applied when the value is missing or blank (local smoke test). */
const OPTIONAL_AUTH_PLACEHOLDERS: Record<string, string> = {
    GOOGLE_CLIENT_ID: "smoke-test.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "smoke-test-secret",
    PINTEREST_CLIENT_ID: "smoke-test-pinterest",
    PINTEREST_CLIENT_SECRET: "smoke-test-pinterest-secret",
    STRIPE_WEBHOOK_SECRET:
        "whsec_smoke_test_placeholder_minimum_length________",
};

for (const [key, value] of Object.entries(OPTIONAL_AUTH_PLACEHOLDERS)) {
    if (!process.env[key]?.trim()) {
        process.env[key] = value;
        console.warn(
            `[warn] ${key} empty in .env — using temporary placeholder for smoke test`
        );
    }
}

async function main() {
    const { prisma } = await import("../prisma");
    const { auth } = await import("../lib/auth/server");

    const base =
        process.env.BETTER_AUTH_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        "http://localhost:3000";

    const ping = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 as ok`;
    if (ping[0]?.ok !== 1) {
        throw new Error("Unexpected SELECT 1 result");
    }
    console.log("[db] PostgreSQL: OK (SELECT 1)");

    const userCount = await prisma.user.count();
    console.log(`[db] Prisma models: OK (user count = ${userCount})`);

    const url = new URL("/api/auth/get-session", base);
    const res = await auth.handler(
        new Request(url, {
            headers: { accept: "application/json" },
            method: "GET",
        })
    );

    const text = await res.text();
    let body: unknown;
    try {
        body = JSON.parse(text) as unknown;
    } catch {
        throw new Error(
            `Better Auth returned non-JSON (status ${res.status}): ${text.slice(0, 200)}`
        );
    }

    if (!res.ok) {
        throw new Error(
            `Better Auth get-session failed: ${res.status} ${JSON.stringify(body)}`
        );
    }

    console.log("[auth] Better Auth handler: OK (GET /api/auth/get-session)");
    console.log(
        "[auth] Session (expected null when unauthenticated):",
        JSON.stringify(body)
    );

    await prisma.$disconnect();
    console.log("All checks passed.");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
