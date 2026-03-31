import { getStripeClient, getStripeWebhookSecret } from "@/lib/billing/client";
import { prisma } from "@/prisma";
import { stripe } from "@better-auth/stripe";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";

/* Pinterest generic OAuth — disabled until Pinterest app approval.
import type { OAuth2Tokens } from "@better-auth/core/oauth2";
import { genericOAuth } from "better-auth/plugins";

interface PinterestUserAccount {
    id?: string;
    profile_image?: string;
    username?: string;
}

async function pinterestUserFromTokens(tokens: OAuth2Tokens): Promise<{
    id: string;
    name?: string;
    email?: string | null;
    image?: string;
    emailVerified: boolean;
} | null> {
    const accessToken = tokens.accessToken;
    if (!accessToken) {
        return null;
    }
    const res = await fetch("https://api.pinterest.com/v5/user_account", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
        return null;
    }
    const data = (await res.json()) as PinterestUserAccount;
    const id = data.id ?? data.username;
    if (!id) {
        return null;
    }
    const sid = String(id);
    return {
        email: `pinterest.${sid}.integration@placeholder.cache`,
        emailVerified: false,
        id: sid,
        image: data.profile_image,
        name: data.username ?? sid,
    };
}

Then add to plugins after nextCookies():
        genericOAuth({
            config: [
                {
                    authentication: "basic",
                    authorizationUrl: "https://www.pinterest.com/oauth/",
                    clientId: requiredEnv("PINTEREST_CLIENT_ID"),
                    clientSecret: requiredEnv("PINTEREST_CLIENT_SECRET"),
                    disableSignUp: true,
                    getUserInfo: pinterestUserFromTokens,
                    pkce: true,
                    providerId: "pinterest",
                    scopes: ["user_accounts:read", "pins:read"],
                    tokenUrl: "https://api.pinterest.com/v5/oauth/token",
                },
            ],
        }),
And set trustedProviders to ["google", "pinterest"].
Also restore genericOAuthClient() in lib/auth/client.ts.
*/

function requiredEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined || value === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

const baseURL =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

const trustedOrigins = [
    baseURL,
    ...(process.env.TRUSTED_ORIGINS?.split(",")
        .map((s) => s.trim())
        .filter(Boolean) ?? []),
];

export const auth = betterAuth({
    account: {
        accountLinking: {
            allowDifferentEmails: true,
            enabled: true,
            trustedProviders: ["google"],
        },
    },
    appName: "Cache",
    baseURL,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: false,
    },
    plugins: [
        nextCookies(),
        stripe({
            createCustomerOnSignUp: true,
            stripeClient: getStripeClient(),
            stripeWebhookSecret: getStripeWebhookSecret(),
            subscription: {
                enabled: true,
                plans: [
                    {
                        annualDiscountPriceId: requiredEnv(
                            "STRIPE_PRICE_ID_YEARLY"
                        ),
                        name: "pro",
                        priceId: requiredEnv("STRIPE_PRICE_ID_MONTHLY"),
                    },
                ],
            },
        }),
    ],
    secret: requiredEnv("BETTER_AUTH_SECRET"),
    socialProviders: {
        google: {
            accessType: "offline",
            clientId: requiredEnv("GOOGLE_CLIENT_ID"),
            clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
            prompt: "select_account consent",
            scope: [
                "openid",
                "email",
                "profile",
                "https://www.googleapis.com/auth/photospicker.mediaitems.readonly",
            ],
        },
    },
    trustedOrigins,
});

export async function getServerSession() {
    return await auth.api.getSession({
        headers: await headers(),
    });
}
