import { BASE_URL } from "@/lib/constants";
import { getDefaultLocale, getLocales } from "gt-next/server";
import type { MetadataRoute } from "next";

interface SitemapRoute {
    path: `/${string}`;
    priority: number;
}

const PUBLIC_STATIC_ROUTES = [
    { path: "/", priority: 1 },
    { path: "/library", priority: 1 },
    { path: "/legal", priority: 1 },
    { path: "/legal/terms-of-service", priority: 0.8 },
    { path: "/legal/privacy-policy", priority: 0.8 },
    { path: "/legal/cookie-policy", priority: 0.8 },
    { path: "/manifesto", priority: 0.8 },
    { path: "/pricing", priority: 0.8 },
] satisfies SitemapRoute[];

function getLocalizedUrl(locale: string, path: SitemapRoute["path"]) {
    return path === "/"
        ? `${BASE_URL}/${locale}`
        : `${BASE_URL}/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
    const locales = getLocales();
    const defaultLocale = getDefaultLocale();

    return PUBLIC_STATIC_ROUTES.map((entry) => ({
        alternates: {
            languages: Object.fromEntries(
                locales.map((locale) => [
                    locale,
                    getLocalizedUrl(locale, entry.path),
                ])
            ),
        },
        changeFrequency: "weekly",
        lastModified: new Date().toISOString(),
        priority: entry.priority,
        url: getLocalizedUrl(defaultLocale, entry.path),
    }));
}
