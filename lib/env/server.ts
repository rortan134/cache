import { vercel } from "@t3-oss/env-core/presets-zod";
import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const serverEnv = createEnv({
    emptyStringAsUndefined: true,
    experimental__runtimeEnv: process.env,
    extends: [vercel()],
    server: {
        // Authentication
        BETTER_AUTH_SECRET: z.string(), // Secret key for Better Auth JWT signing
        BETTER_AUTH_URL: z.url(), // Base URL for Better Auth service

        // Database
        DATABASE_URL: z.string(), // Primary database connection string

        // Internationalization
        GT_API_KEY: z.string(),
        GT_PROJECT_ID: z.string(),

        // Payment & Billing
        STRIPE_PRICE_ID_MONTHLY: z.string(), // Stripe price ID for monthly subscription
        STRIPE_PRICE_ID_YEARLY: z.string(), // Stripe price ID for yearly subscription
        STRIPE_SECRET_KEY: z.string().startsWith("sk_"), // Stripe secret key for payment processing
        STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"), // Webhook secret for Stripe events
    },
    // Variables available on both server and client
    shared: {
        NODE_ENV: z.enum(["development", "test", "production"]),
    },
});
