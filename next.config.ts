import { withGTConfig } from "gt-next/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    cacheComponents: true,
    experimental: {
        // A list of packages that Next.js should automatically evaluate and optimise the imports for.
        // @see https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
        optimizePackageImports: ["@base-ui/react", "zod", "better-auth"],
        turbopackFileSystemCacheForDev: true,
    },
    images: {
        minimumCacheTTL: 2_678_400, // 31 days
    },
    reactCompiler: true,
    typedRoutes: true,
};

export default withGTConfig(nextConfig);
