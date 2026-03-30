/** Shown after the page-specific title, e.g. "Settings | Cache". */
export const SITE_APP_NAME = "Cache App";

/** Root / default document title when a segment does not override `title`. */
export const SITE_DEFAULT_TITLE = "Bookmark manager";

export const BASE_URL =
    process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://" +
          (process.env.VERCEL_ENV === "production"
              ? process.env.VERCEL_PROJECT_PRODUCTION_URL
              : process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL);
