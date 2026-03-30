import { BASE_URL, SITE_APP_NAME } from "@/lib/constants";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        background_color: "#ffffff",
        categories: ["productivity", "utilities"],
        description:
            "Cache is a tool to unify your bookmarks across all platforms.",
        dir: "ltr",
        display: "standalone",
        display_override: ["fullscreen"],
        icons: [
            {
                purpose: "maskable",
                sizes: "192x192",
                src: "/web-app-manifest-192x192.png",
                type: "image/png",
            },
            {
                purpose: "maskable",
                sizes: "512x512",
                src: "/web-app-manifest-512x512.png",
                type: "image/png",
            },
        ],
        lang: "en-US",
        name: SITE_APP_NAME,
        orientation: "landscape-primary",
        prefer_related_applications: true,
        scope: BASE_URL,
        short_name: SITE_APP_NAME,
        start_url: "/?utm_source=pwa_homescreen&__pwa=1",
        theme_color: "#ffffff",
    };
}
