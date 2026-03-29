import { withGTConfig } from "gt-next/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    cacheComponents: true,
    experimental: {
        optimizePackageImports: ["@base-ui/react", "zod", "better-auth"],
        turbopackFileSystemCacheForDev: true,
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
