import { BASE_URL } from "@/lib/constants";
import { getDefaultLocale, getLocales } from "gt-next/server";
import type { MetadataRoute } from "next";

/** Path segments after `/{locale}` that should be indexed. */
const publicPaths = ["", "/library", "/legal"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
    const locales = getLocales();
    const defaultLocale = getDefaultLocale();
    const lastModified = new Date();

    return publicPaths.map((pathSuffix) => ({
        alternates: {
            languages: Object.fromEntries(
                locales.map((locale) => [
                    locale,
                    `${BASE_URL}/${locale}${pathSuffix}`,
                ])
            ),
        },
        changeFrequency: pathSuffix === "" ? "weekly" : "monthly",
        lastModified,
        priority: pathSuffix === "" ? 1 : 0.8,
        url: `${BASE_URL}/${defaultLocale}${pathSuffix}`,
    }));
}
