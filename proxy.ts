import { getSessionCookie } from "better-auth/cookies";
import { createNextMiddleware } from "gt-next/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const gtMiddleware = createNextMiddleware();

const DEFAULT_LOCALE = "en-US";

/** `/{locale}/library` — first segment is locale (e.g. en-US). */
function isLibraryPath(pathname: string): boolean {
    const parts = pathname.split("/").filter(Boolean);
    return parts.length >= 2 && parts[1] === "library";
}

function localeFromPathname(pathname: string): string {
    const first = pathname.split("/").filter(Boolean)[0];
    return first ?? DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
    if (request.method === "OPTIONS") {
        const response = new NextResponse(null, { status: 204 });
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set(
            "Access-Control-Allow-Methods",
            "GET,POST,PUT,DELETE,OPTIONS"
        );
        response.headers.set("Access-Control-Allow-Headers", "*");
        return response;
    }

    const { pathname } = request.nextUrl;
    if (isLibraryPath(pathname) && !getSessionCookie(request)) {
        const locale = localeFromPathname(pathname);
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    return gtMiddleware(request);
}

export const config = {
    matcher: ["/((?!api|mcp|static|.*\\..*|_next).*)"],
};
