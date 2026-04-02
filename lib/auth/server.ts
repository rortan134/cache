import { getStripeClient, getStripeWebhookSecret } from "@/lib/billing/client";
import { prisma } from "@/prisma";
import { stripe } from "@better-auth/stripe";
import type { OAuth2Tokens } from "@better-auth/core/oauth2";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import type { GenericOAuthConfig } from "better-auth/plugins";
import { genericOAuth } from "better-auth/plugins";
import { headers } from "next/headers";

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

interface SoundcloudUserAccount {
    avatar_url?: string | null;
    full_name?: string | null;
    id?: number | string;
    username?: string | null;
}

async function soundcloudUserFromTokens(tokens: OAuth2Tokens): Promise<{
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

    const response = await fetch("https://api.soundcloud.com/me", {
        headers: {
            Accept: "application/json",
            Authorization: `OAuth ${accessToken}`,
        },
    });

    if (!response.ok) {
        return null;
    }

    const data = (await response.json()) as SoundcloudUserAccount;
    const id = data.id;
    if (id === undefined || id === null) {
        return null;
    }

    const stableId = String(id);
    return {
        email: `soundcloud.${stableId}.integration@placeholder.cache`,
        emailVerified: false,
        id: stableId,
        image: data.avatar_url ?? undefined,
        name: data.full_name ?? data.username ?? stableId,
    };
}

interface XUserAccount {
    data?: {
        id?: string;
        name?: string;
        profile_image_url?: string;
        username?: string;
    };
}

async function xUserFromTokens(tokens: OAuth2Tokens): Promise<{
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

    const response = await fetch(
        "https://api.x.com/2/users/me?user.fields=profile_image_url",
        {
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        }
    );

    if (!response.ok) {
        return null;
    }

    const payload = (await response.json()) as XUserAccount;
    const user = payload.data;
    const id = user?.id;
    if (!id) {
        return null;
    }

    return {
        email: `x.${id}.integration@placeholder.cache`,
        emailVerified: false,
        id,
        image: user.profile_image_url,
        name: user.name ?? user.username ?? id,
    };
}

function requiredEnv(name: string): string {
    const value = process.env[name];
    if (value === undefined || value === "") {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function optionalEnv(name: string): string | null {
    const value = process.env[name];
    return value === undefined || value === "" ? null : value;
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

const soundcloudClientId = optionalEnv("SOUNDCLOUD_CLIENT_ID");
const soundcloudClientSecret = optionalEnv("SOUNDCLOUD_CLIENT_SECRET");
const soundcloudOAuthEnabled = Boolean(
    soundcloudClientId && soundcloudClientSecret
);
const xClientId = optionalEnv("X_CLIENT_ID");
const xClientSecret = optionalEnv("X_CLIENT_SECRET");
const xOAuthEnabled = Boolean(xClientId && xClientSecret);

const genericOAuthConfig: GenericOAuthConfig[] = [
    {
        authentication: "basic",
        authorizationUrl: "https://www.pinterest.com/oauth/",
        clientId: requiredEnv("PINTEREST_CLIENT_ID"),
        clientSecret: requiredEnv("PINTEREST_CLIENT_SECRET"),
        disableSignUp: true,
        getUserInfo: pinterestUserFromTokens,
        pkce: true,
        providerId: "pinterest",
        scopes: ["user_accounts:read", "boards:read", "pins:read"],
        tokenUrl: "https://api.pinterest.com/v5/oauth/token",
    },
];

if (soundcloudClientId && soundcloudClientSecret) {
    genericOAuthConfig.push({
        authorizationUrl: "https://secure.soundcloud.com/authorize",
        clientId: soundcloudClientId,
        clientSecret: soundcloudClientSecret,
        disableSignUp: true,
        getUserInfo: soundcloudUserFromTokens,
        providerId: "soundcloud",
        scopes: ["non-expiring"],
        tokenUrl: "https://secure.soundcloud.com/oauth/token",
    });
}

if (xClientId && xClientSecret) {
    genericOAuthConfig.push({
        authentication: "basic",
        authorizationUrl: "https://x.com/i/oauth2/authorize",
        clientId: xClientId,
        clientSecret: xClientSecret,
        disableSignUp: true,
        getUserInfo: xUserFromTokens,
        pkce: true,
        providerId: "x",
        scopes: ["bookmark.read", "offline.access", "tweet.read", "users.read"],
        tokenUrl: "https://api.x.com/2/oauth2/token",
    });
}

const trustedProviders = [
    "google",
    "pinterest",
    ...(soundcloudOAuthEnabled ? ["soundcloud"] : []),
    ...(xOAuthEnabled ? ["x"] : []),
];

export const auth = betterAuth({
    account: {
        accountLinking: {
            allowDifferentEmails: true,
            enabled: true,
            trustedProviders,
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
        genericOAuth({
            config: genericOAuthConfig,
        }),
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
