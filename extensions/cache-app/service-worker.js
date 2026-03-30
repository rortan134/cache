importScripts("cache-config.js");

/** @typedef {{ shortcode: string, url: string, thumbnailUrl: string, caption: string, scrapedAt: string }} InstagramSavedItem */
/** @typedef {{ id: string, url: string, thumbnailUrl: string, caption: string, scrapedAt: string }} TikTokFavoriteItem */

const INSTAGRAM_STORAGE_VERSION = 1;
const TIKTOK_STORAGE_VERSION = 1;

const INSTAGRAM_KEYS = {
    bookmarkCount: "bookmarkCount",
    bookmarks: "instagramSavedBookmarks",
    lastSyncAt: "lastSyncAt",
    storageVersion: "storageVersion",
};

const TIKTOK_KEYS = {
    favoriteCount: "tiktokFavoriteCount",
    lastSyncAt: "tiktokLastSyncAt",
    storageVersion: "tiktokStorageVersion",
    videos: "tiktokFavoriteVideos",
};

const SYNC_KEYS = {
    syncApiKey: "syncApiKey",
    syncEndpoint: "syncEndpoint",
};

/**
 * @returns {string}
 */
function defaultIngestEndpoint() {
    const o = String(globalThis.CACHE_APP_ORIGIN ?? "").replace(/\/$/, "");
    const p = String(globalThis.CACHE_INGEST_PATH ?? "");
    if (!o || !p.startsWith("/")) {
        return "";
    }
    return `${o}${p}`;
}

/**
 * @param {unknown} msg
 * @returns {"instagram" | "tiktok"}
 */
function messageSource(msg) {
    return msg && typeof msg === "object" && msg.source === "tiktok"
        ? "tiktok"
        : "instagram";
}

/**
 * @param {Record<string, unknown>} data
 * @returns {Promise<InstagramSavedItem[]>}
 */
async function migrateInstagramIfNeeded(data) {
    const version =
        typeof data[INSTAGRAM_KEYS.storageVersion] === "number"
            ? data[INSTAGRAM_KEYS.storageVersion]
            : 0;
    const raw = data[INSTAGRAM_KEYS.bookmarks];
    let bookmarks = Array.isArray(raw) ? /** @type {unknown[]} */ (raw) : [];

    if (version < INSTAGRAM_STORAGE_VERSION) {
        bookmarks = bookmarks
            .map((row) => {
                if (row && typeof row === "object" && !Array.isArray(row)) {
                    return /** @type {InstagramSavedItem} */ (row);
                }
                return null;
            })
            .filter(Boolean);
        await chrome.storage.local.set({
            [INSTAGRAM_KEYS.bookmarks]: bookmarks,
            [INSTAGRAM_KEYS.storageVersion]: INSTAGRAM_STORAGE_VERSION,
        });
    }

    return /** @type {InstagramSavedItem[]} */ (bookmarks);
}

/**
 * @param {Record<string, unknown>} data
 * @returns {Promise<TikTokFavoriteItem[]>}
 */
async function migrateTikTokIfNeeded(data) {
    const version =
        typeof data[TIKTOK_KEYS.storageVersion] === "number"
            ? data[TIKTOK_KEYS.storageVersion]
            : 0;
    const raw = data[TIKTOK_KEYS.videos];
    let videos = Array.isArray(raw) ? /** @type {unknown[]} */ (raw) : [];

    if (version < TIKTOK_STORAGE_VERSION) {
        videos = videos
            .map((row) => {
                if (row && typeof row === "object" && !Array.isArray(row)) {
                    return /** @type {TikTokFavoriteItem} */ (row);
                }
                return null;
            })
            .filter(Boolean);
        await chrome.storage.local.set({
            [TIKTOK_KEYS.storageVersion]: TIKTOK_STORAGE_VERSION,
            [TIKTOK_KEYS.videos]: videos,
        });
    }

    return /** @type {TikTokFavoriteItem[]} */ (videos);
}

/**
 * @param {InstagramSavedItem[]} incoming
 * @param {InstagramSavedItem[]} existing
 * @returns {InstagramSavedItem[]}
 */
function mergeByShortcode(incoming, existing) {
    const map = new Map();
    for (const item of existing) {
        if (item?.shortcode) {
            map.set(item.shortcode, item);
        }
    }
    for (const item of incoming) {
        if (item?.shortcode) {
            const prev = map.get(item.shortcode);
            map.set(item.shortcode, {
                ...prev,
                ...item,
                scrapedAt:
                    item.scrapedAt ||
                    prev?.scrapedAt ||
                    new Date().toISOString(),
            });
        }
    }
    return [...map.values()];
}

/**
 * @param {TikTokFavoriteItem[]} incoming
 * @param {TikTokFavoriteItem[]} existing
 * @returns {TikTokFavoriteItem[]}
 */
function mergeByVideoId(incoming, existing) {
    const map = new Map();
    for (const item of existing) {
        if (item?.id) {
            map.set(item.id, item);
        }
    }
    for (const item of incoming) {
        if (item?.id) {
            const prev = map.get(item.id);
            map.set(item.id, {
                ...prev,
                ...item,
                scrapedAt:
                    item.scrapedAt ||
                    prev?.scrapedAt ||
                    new Date().toISOString(),
            });
        }
    }
    return [...map.values()];
}

/**
 * @returns {Promise<{ instagramCount: number, tiktokCount: number, instagramLastSyncAt?: string, tiktokLastSyncAt?: string }>}
 */
async function readSyncMetaForUi() {
    const data = await chrome.storage.local.get([
        INSTAGRAM_KEYS.bookmarkCount,
        INSTAGRAM_KEYS.lastSyncAt,
        TIKTOK_KEYS.favoriteCount,
        TIKTOK_KEYS.lastSyncAt,
    ]);
    return {
        instagramCount:
            typeof data[INSTAGRAM_KEYS.bookmarkCount] === "number"
                ? data[INSTAGRAM_KEYS.bookmarkCount]
                : 0,
        instagramLastSyncAt:
            typeof data[INSTAGRAM_KEYS.lastSyncAt] === "string"
                ? data[INSTAGRAM_KEYS.lastSyncAt]
                : undefined,
        tiktokCount:
            typeof data[TIKTOK_KEYS.favoriteCount] === "number"
                ? data[TIKTOK_KEYS.favoriteCount]
                : 0,
        tiktokLastSyncAt:
            typeof data[TIKTOK_KEYS.lastSyncAt] === "string"
                ? data[TIKTOK_KEYS.lastSyncAt]
                : undefined,
    };
}

/**
 * @param {string} endpointUrl
 * @returns {Promise<boolean>}
 */
function originHasBetterAuthSessionCookie(endpointUrl) {
    return new Promise((resolve) => {
        let origin;
        try {
            origin = new URL(endpointUrl.trim()).origin;
        } catch {
            resolve(false);
            return;
        }
        const url = origin.endsWith("/") ? origin : `${origin}/`;
        chrome.cookies.getAll({ url }, (cookies) => {
            if (chrome.runtime.lastError) {
                resolve(false);
                return;
            }
            const ok = cookies.some((c) => {
                const n = c.name.toLowerCase();
                return (
                    n.includes("better-auth") &&
                    n.includes("session") &&
                    c.value &&
                    c.value.length > 8
                );
            });
            resolve(ok);
        });
    });
}

/**
 * @param {string | undefined} endpoint
 * @param {string | undefined} apiKey
 * @param {InstagramSavedItem[] | TikTokFavoriteItem[]} items
 * @param {"instagram" | "tiktok"} source
 */
async function postToOptionalBackend(endpoint, apiKey, items, source) {
    if (!endpoint?.trim()) {
        return;
    }
    if (!apiKey?.trim()) {
        console.warn(
            "[Cache App] Skipping server sync: no ingest token. Open any Cache page while signed in once.",
        );
        return;
    }
    const sessionOk = await originHasBetterAuthSessionCookie(endpoint);
    if (!sessionOk) {
        console.warn(
            "[Cache App] Skipping server sync: no Cache session cookie for sync URL origin. Sign in on the site first."
        );
        return;
    }
    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };
    if (apiKey?.trim()) {
        headers.Authorization = `Bearer ${apiKey.trim()}`;
    }
    const res = await fetch(endpoint.trim(), {
        body: JSON.stringify({
            items,
            source,
            syncedAt: new Date().toISOString(),
        }),
        headers,
        method: "POST",
    });
    if (!res.ok) {
        console.warn(
            "[Cache App] Optional sync failed:",
            source,
            res.status,
            await res.text().catch(() => "")
        );
    }
}

/**
 * @param {unknown[]} items
 * @param {boolean} final
 */
async function persistInstagramItems(items, final) {
    const data = await chrome.storage.local.get([
        INSTAGRAM_KEYS.bookmarks,
        INSTAGRAM_KEYS.storageVersion,
        SYNC_KEYS.syncEndpoint,
        SYNC_KEYS.syncApiKey,
    ]);

    const existing = await migrateInstagramIfNeeded(data);
    const incoming = Array.isArray(items) ? items : [];
    const merged = mergeByShortcode(
        /** @type {InstagramSavedItem[]} */ (incoming),
        existing
    );

    const patch = {
        [INSTAGRAM_KEYS.bookmarks]: merged,
        [INSTAGRAM_KEYS.bookmarkCount]: merged.length,
        [INSTAGRAM_KEYS.storageVersion]: INSTAGRAM_STORAGE_VERSION,
    };

    if (final) {
        const lastSyncAt = new Date().toISOString();
        patch[INSTAGRAM_KEYS.lastSyncAt] = lastSyncAt;
        await chrome.storage.local.set(patch);

        const stored =
            typeof data[SYNC_KEYS.syncEndpoint] === "string"
                ? data[SYNC_KEYS.syncEndpoint]
                : "";
        const endpoint = stored.trim() || defaultIngestEndpoint();
        const apiKey =
            typeof data[SYNC_KEYS.syncApiKey] === "string"
                ? data[SYNC_KEYS.syncApiKey]
                : "";
        try {
            await postToOptionalBackend(endpoint, apiKey, merged, "instagram");
        } catch (err) {
            console.warn("[Cache App] Instagram optional sync error:", err);
        }

        const meta = await readSyncMetaForUi();
        await chrome.runtime
            .sendMessage({
                completedSource: "instagram",
                type: "SYNC_DONE",
                ...meta,
            })
            .catch(() => {
                /* no extension page listening */
            });
    } else {
        await chrome.storage.local.set(patch);
        const meta = await readSyncMetaForUi();
        await chrome.runtime
            .sendMessage({
                activeSource: "instagram",
                type: "SYNC_PROGRESS",
                ...meta,
            })
            .catch(() => {
                /* no extension page listening */
            });
    }
}

/**
 * @param {unknown[]} items
 * @param {boolean} final
 */
async function persistTikTokItems(items, final) {
    const data = await chrome.storage.local.get([
        TIKTOK_KEYS.videos,
        TIKTOK_KEYS.storageVersion,
        SYNC_KEYS.syncEndpoint,
        SYNC_KEYS.syncApiKey,
    ]);

    const existing = await migrateTikTokIfNeeded(data);
    const incoming = Array.isArray(items) ? items : [];
    const merged = mergeByVideoId(
        /** @type {TikTokFavoriteItem[]} */ (incoming),
        existing
    );

    const patch = {
        [TIKTOK_KEYS.favoriteCount]: merged.length,
        [TIKTOK_KEYS.storageVersion]: TIKTOK_STORAGE_VERSION,
        [TIKTOK_KEYS.videos]: merged,
    };

    if (final) {
        const lastSyncAt = new Date().toISOString();
        patch[TIKTOK_KEYS.lastSyncAt] = lastSyncAt;
        await chrome.storage.local.set(patch);

        const stored =
            typeof data[SYNC_KEYS.syncEndpoint] === "string"
                ? data[SYNC_KEYS.syncEndpoint]
                : "";
        const endpoint = stored.trim() || defaultIngestEndpoint();
        const apiKey =
            typeof data[SYNC_KEYS.syncApiKey] === "string"
                ? data[SYNC_KEYS.syncApiKey]
                : "";
        try {
            await postToOptionalBackend(endpoint, apiKey, merged, "tiktok");
        } catch (err) {
            console.warn("[Cache App] TikTok optional sync error:", err);
        }

        const meta = await readSyncMetaForUi();
        await chrome.runtime
            .sendMessage({
                completedSource: "tiktok",
                type: "SYNC_DONE",
                ...meta,
            })
            .catch(() => {
                /* no extension page listening */
            });
    } else {
        await chrome.storage.local.set(patch);
        const meta = await readSyncMetaForUi();
        await chrome.runtime
            .sendMessage({
                activeSource: "tiktok",
                type: "SYNC_PROGRESS",
                ...meta,
            })
            .catch(() => {
                /* no extension page listening */
            });
    }
}

/**
 * @param {unknown[]} items
 * @param {{ final: boolean, source: "instagram" | "tiktok" }} options
 */
async function persistBookmarkItems(items, options) {
    if (options.source === "tiktok") {
        await persistTikTokItems(items, options.final);
    } else {
        await persistInstagramItems(items, options.final);
    }
}

/**
 * @param {string} code
 * @param {string} [message]
 */
async function notifySyncError(code, message) {
    await chrome.runtime
        .sendMessage({
            code,
            message: message ?? "",
            type: "SYNC_ERROR",
        })
        .catch(() => {
            /* no extension page listening */
        });
}

chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "CACHE_SITE_BRIDGE") {
        (async () => {
            const endpoint =
                typeof msg.endpoint === "string" ? msg.endpoint.trim() : "";
            const token =
                typeof msg.token === "string" ? msg.token.trim() : "";
            if (!endpoint || !token) {
                return;
            }
            await chrome.storage.local.set({
                [SYNC_KEYS.syncApiKey]: token,
                [SYNC_KEYS.syncEndpoint]: endpoint,
            });
        })();
        return true;
    }

    if (msg?.type === "BOOKMARKS_CHUNK" || msg?.type === "BOOKMARKS_COMPLETE") {
        (async () => {
            try {
                await persistBookmarkItems(
                    Array.isArray(msg.items) ? msg.items : [],
                    {
                        final: msg.type === "BOOKMARKS_COMPLETE",
                        source: messageSource(msg),
                    }
                );
            } catch (err) {
                console.error("[Cache App] bookmark persist failed:", err);
                await notifySyncError(
                    "MERGE_FAILED",
                    err instanceof Error ? err.message : String(err)
                );
            }
        })();
        return true;
    }

    if (msg?.type === "SYNC_ERROR") {
        (async () => {
            await notifySyncError(
                typeof msg.code === "string" ? msg.code : "UNKNOWN",
                msg.message
            );
        })();
        return true;
    }

    return false;
});
