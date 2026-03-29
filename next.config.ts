import { withGTConfig } from "gt-next/config";
import type { NextConfig } from "next";

/** Baseline security headers (see Next.js headers docs). */
const securityHeaders = [
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
    },
    {
        key: "X-Content-Type-Options",
        value: "nosniff",
    },
    {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
    },
    {
        key: "Referrer-Policy",
        value: "origin-when-cross-origin",
    },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
    },
] as const;

const nextConfig: NextConfig = {
    cacheComponents: true,
    experimental: {
        optimizePackageImports: ["@base-ui/react", "zod", "better-auth"],
        turbopackFileSystemCacheForDev: true,
    },
    async headers() {
        return [
            {
                headers: [...securityHeaders],
                source: "/:path*",
            },
        ];
    },
    images: {
        minimumCacheTTL: 2_678_400, // 31 days
    },
    reactCompiler: true,
    typedRoutes: true,
};

export default withGTConfig(nextConfig, {
    experimentalLocaleResolution: true,
});
