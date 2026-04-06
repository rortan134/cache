import { stripeClient } from "@better-auth/stripe/client";
import {
    genericOAuthClient,
    multiSessionClient,
    oneTapClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const baseURL = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/auth`;

export const authClient = createAuthClient({
    baseURL,
    plugins: [
        genericOAuthClient(),
        stripeClient({ subscription: true }),
        multiSessionClient(),
        oneTapClient({
            clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
        }),
    ],
});
