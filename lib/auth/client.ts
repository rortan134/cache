import { genericOAuthClient } from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";
import { createAuthClient } from "better-auth/react";

const baseURL = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth`;

export const authClient = createAuthClient({
    baseURL,
    plugins: [genericOAuthClient(), stripeClient({ subscription: true })],
});
