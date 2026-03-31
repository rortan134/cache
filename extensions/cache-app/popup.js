const statusEl = document.getElementById("status");
const syncBtn = document.getElementById("sync");
const instagramMetaEl = document.getElementById("instagramMeta");
const tiktokMetaEl = document.getElementById("tiktokMeta");
const openCacheBtnEl = document.getElementById("openCache");

/** Default locale path segment for opening the web app (matches Next `[locale]` routes). */
const CACHE_APP_DEFAULT_LOCALE = "en-US";

/**
 * @param {string} raw
 * @returns {string | null}
 */
function deriveOriginFromEndpoint(raw) {
    const s = (raw ?? "").trim();
    if (!s) {
        return null;
    }
    try {
        return new URL(s).origin;
    } catch {
        return null;
    }
}

function setOpenCacheVisible(visible) {
    if (!openCacheBtnEl) {
        return;
    }
    openCacheBtnEl.style.display = visible ? "" : "none";
}

/**
 * Attempts to re-link by asking an open Cache tab to bridge token immediately.
 * @returns {Promise<boolean>}
 */
async function requestBridgeFromOpenCacheTab() {
    const appOrigin = String(globalThis.CACHE_APP_ORIGIN ?? "").replace(
        /\/$/,
        "",
    );
    if (!appOrigin) {
        return false;
    }
    let tabs = [];
    let urlPatterns = [`${appOrigin}/*`];
    try {
        const u = new URL(appOrigin);
        if (
            u.protocol === "https:" &&
            u.hostname.split(".").length === 2 &&
            !u.hostname.startsWith("www.")
        ) {
            urlPatterns = [...urlPatterns, `https://www.${u.hostname}/*`];
        }
    } catch {
        // leave default pattern only
    }
    try {
        tabs = await chrome.tabs.query({ url: urlPatterns });
    } catch {
        return false;
    }
    for (const tab of tabs) {
        if (!tab.id) {
            continue;
        }
        try {
            const res = await chrome.tabs.sendMessage(tab.id, {
                type: "CACHE_SITE_BRIDGE_REQUEST",
            });
            if (res && typeof res === "object" && res.ok === true) {
                return true;
            }
        } catch {
            // ignore and continue trying other tabs
        }
    }
    return false;
}

/**
 * @param {string} text
 * @param {'idle' | 'ok' | 'error'} kind
 */
function setStatus(text, kind) {
    if (!statusEl) {
        return;
    }
    statusEl.textContent = text;
    statusEl.classList.remove("error", "ok");
    if (kind === "error") {
        statusEl.classList.add("error");
    }
    if (kind === "ok") {
        statusEl.classList.add("ok");
    }
}

/**
 * @param {string} code
 * @param {string} [message]
 */
function formatErrorMessage(code, message) {
    const map = {
        MERGE_FAILED: message || "Could not save data.",
        NO_ITEMS: "No items found. Scroll the grid, then sync again.",
        NOT_SAVED_PAGE: "Open your Saved collection on Instagram first.",
        SCRAPE_FAILED: message || "Could not read the page.",
        UNKNOWN: message || "Something went wrong.",
        UNSUPPORTED_PAGE:
            "Open instagram.com or tiktok.com (Saved or Favorites) in this tab.",
    };
    return (
        map[/** @type {keyof typeof map} */ (code)] ?? message ?? "Sync failed."
    );
}

/**
 * @param {string | undefined} iso
 * @returns {string}
 */
function formatLastSync(iso) {
    if (!iso) {
        return "—";
    }
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return "—";
    }
}

async function refreshFromStorage() {
    const data = await chrome.storage.local.get([
        "bookmarkCount",
        "lastSyncAt",
        "tiktokFavoriteCount",
        "tiktokLastSyncAt",
    ]);

    const igCount =
        typeof data.bookmarkCount === "number" ? data.bookmarkCount : 0;
    const ttCount =
        typeof data.tiktokFavoriteCount === "number"
            ? data.tiktokFavoriteCount
            : 0;

    if (instagramMetaEl) {
        instagramMetaEl.textContent = `Instagram Saved: ${igCount} · last sync ${formatLastSync(typeof data.lastSyncAt === "string" ? data.lastSyncAt : undefined)}`;
    }
    if (tiktokMetaEl) {
        tiktokMetaEl.textContent = `TikTok Favorites: ${ttCount} · last sync ${formatLastSync(typeof data.tiktokLastSyncAt === "string" ? data.tiktokLastSyncAt : undefined)}`;
    }
}

/**
 * Sync is allowed when the configured Cache origin has a session cookie and the site
 * bootstrap has stored an ingest token.
 */
async function applyCacheSessionGate() {
    if (!syncBtn) {
        return;
    }
    const appOrigin = String(globalThis.CACHE_APP_ORIGIN ?? "").replace(
        /\/$/,
        "",
    );
    if (!appOrigin) {
        syncBtn.disabled = true;
        setOpenCacheVisible(true);
        setStatus(
            "Extension is missing CACHE_APP_ORIGIN in cache-config.js.",
            "error",
        );
        return;
    }

    const keyData = await chrome.storage.local.get(["syncApiKey"]);
    let token =
        typeof keyData.syncApiKey === "string" ? keyData.syncApiKey.trim() : "";
    if (!token) {
        await requestBridgeFromOpenCacheTab();
        const afterBridge = await chrome.storage.local.get(["syncApiKey"]);
        token =
            typeof afterBridge.syncApiKey === "string"
                ? afterBridge.syncApiKey.trim()
                : "";
    }
    if (!token) {
        syncBtn.disabled = true;
        setOpenCacheVisible(true);
        setStatus(
            "Sign in to Cache and keep a cachd.app tab open, then reopen this popup.",
            "error",
        );
        return;
    }

    syncBtn.disabled = false;
    // User is already linked; hiding avoids the misleading localhost button.
    setOpenCacheVisible(false);
    if (statusEl && !statusEl.classList.contains("error")) {
        statusEl.textContent = "";
    }
}

/**
 * @param {unknown} msg
 */
function handleProgressMessage(msg) {
    if (typeof msg !== "object" || msg === null) {
        return;
    }
    const m = /** @type {Record<string, unknown>} */ (msg);
    const ig = typeof m.instagramCount === "number" ? m.instagramCount : 0;
    const tt = typeof m.tiktokCount === "number" ? m.tiktokCount : 0;
    const active = m.activeSource === "tiktok" ? "TikTok" : "Instagram";
    setStatus(`Syncing ${active}… ${ig} Saved · ${tt} Favorites`, "idle");
    void refreshFromStorage();
}

/**
 * @param {unknown} msg
 */
function handleDoneMessage(msg) {
    if (typeof msg !== "object" || msg === null) {
        return;
    }
    const m = /** @type {Record<string, unknown>} */ (msg);
    const ig = typeof m.instagramCount === "number" ? m.instagramCount : 0;
    const tt = typeof m.tiktokCount === "number" ? m.tiktokCount : 0;
    const src =
        m.completedSource === "tiktok" ? "TikTok Favorites" : "Instagram Saved";
    setStatus(`Done — ${src} updated (${ig} Saved · ${tt} Favorites).`, "ok");
}

chrome.runtime.onMessage.addListener((msg) => {
    const btn = document.getElementById("sync");
    if (msg?.type === "SYNC_PROGRESS") {
        handleProgressMessage(msg);
        void refreshFromStorage();
    }
    if (msg?.type === "SYNC_DONE") {
        handleDoneMessage(msg);
        if (btn) {
            btn.disabled = false;
        }
        void refreshFromStorage();
        void applyCacheSessionGate();
    }
    if (msg?.type === "SYNC_ERROR") {
        setStatus(
            formatErrorMessage(
                typeof msg.code === "string" ? msg.code : "UNKNOWN",
                typeof msg.message === "string" ? msg.message : undefined,
            ),
            "error",
        );
        if (btn) {
            btn.disabled = false;
        }
        void applyCacheSessionGate();
    }
});

syncBtn?.addEventListener("click", async () => {
    await applyCacheSessionGate();
    if (syncBtn?.disabled) {
        return;
    }

    setStatus("Syncing…", "idle");
    syncBtn.disabled = true;

    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (!tab?.id) {
            setStatus("No active tab.", "error");
            syncBtn.disabled = false;
            await applyCacheSessionGate();
            return;
        }
        const url = tab.url ?? "";
        if (
            !url.startsWith("https://www.instagram.com/") &&
            !url.startsWith("https://www.tiktok.com/")
        ) {
            setStatus(
                "Open Instagram or TikTok in this tab (Saved or Favorites).",
                "error",
            );
            syncBtn.disabled = false;
            await applyCacheSessionGate();
            return;
        }

        await chrome.tabs.sendMessage(tab.id, { type: "START_SYNC" });
    } catch {
        setStatus(
            "Could not reach this page. Reload the tab and try again.",
            "error",
        );
        syncBtn.disabled = false;
        await applyCacheSessionGate();
    }
});

openCacheBtnEl?.addEventListener("click", async () => {
    const appOrigin = String(globalThis.CACHE_APP_ORIGIN ?? "").replace(
        /\/$/,
        "",
    );
    const keyData = await chrome.storage.local.get(["syncEndpoint"]);
    const endpoint =
        typeof keyData.syncEndpoint === "string" ? keyData.syncEndpoint : "";
    const derivedOrigin = deriveOriginFromEndpoint(endpoint);
    const originToOpen = derivedOrigin || appOrigin;

    if (!originToOpen) {
        return;
    }

    await chrome.tabs.create({
        url: `${originToOpen}/${CACHE_APP_DEFAULT_LOCALE}`,
    });
});

window.addEventListener("focus", () => {
    void applyCacheSessionGate();
    void refreshFromStorage();
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") {
        return;
    }
    if (changes.syncApiKey || changes.syncEndpoint) {
        void applyCacheSessionGate();
    }
});

void refreshFromStorage();
void applyCacheSessionGate();
