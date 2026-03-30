import { createNextMiddleware } from "gt-next/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const gtMiddleware = createNextMiddleware();

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

    return gtMiddleware(request);
}

export const config = {
    matcher: ["/((?!api|mcp|static|.*\\..*|_next).*)"],
};
