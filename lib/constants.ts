/**
 * BCP-47 locales enabled in General Translation.
 * Keep in sync with `locales` in `gt.config.json`.
 */
export const SUPPORTED_GT_LOCALES = [
    "en-US",
    "fr-FR",
    "de-DE",
    "es-419",
    "pt-BR",
    "ja-JP",
    "nl-NL",
    "ko-KR",
    "zh-CN",
    "zh-TW",
    "sv-SE",
    "da-DK",
    "pl-PL",
] as const;

export type SupportedGTLocale = (typeof SUPPORTED_GT_LOCALES)[number];

export const DEFAULT_GT_LOCALE: SupportedGTLocale = "en-US";

/** Shown after the page-specific title, e.g. "Settings | Cache". */
export const SITE_APP_NAME = "Cache App";

/** Root / default document title when a segment does not override `title`. */
export const SITE_DEFAULT_TITLE = `Bookmark manager | ${SITE_APP_NAME}`;

export const BASE_URL =
    process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://" +
          (process.env.VERCEL_ENV === "production"
              ? process.env.VERCEL_PROJECT_PRODUCTION_URL
              : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL);
