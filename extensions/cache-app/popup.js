const statusEl = document.getElementById("status");
const syncBtn = document.getElementById("sync");
const openCacheBtn = document.getElementById("openCache");
const instagramMetaEl = document.getElementById("instagramMeta");
const tiktokMetaEl = document.getElementById("tiktokMeta");
const openOptionsEl = document.getElementById("openOptions");

/** Default locale path segment for opening the web app (matches Next `[locale]` routes). */
const CACHE_APP_DEFAULT_LOCALE = "en-US";

/**
 * @param {string} raw
 * @returns {string | null}
 */
function deriveOriginFromSyncEndpoint(raw) {
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

/**
 * @param {string} origin
 * @returns {Promise<boolean>}
 */
function originHasBetterAuthSessionCookie(origin) {
    return new Promise((resolve) => {
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
 * Enables Sync only when sync URL is set and a Cache session cookie exists for that origin.
 */
async function applyCacheSessionGate() {
    if (!syncBtn) {
        return;
    }
    const data = await chrome.storage.local.get(["syncEndpoint"]);
    const endpoint =
        typeof data.syncEndpoint === "string" ? data.syncEndpoint : "";
    const origin = deriveOriginFromSyncEndpoint(endpoint);

    if (!origin) {
        syncBtn.disabled = true;
        setStatus(
            "Set your Cache ingest URL in Options (copy from Library page).",
            "idle"
        );
        return;
    }

    const signedIn = await originHasBetterAuthSessionCookie(origin);
    if (!signedIn) {
        syncBtn.disabled = true;
        setStatus(
            "Sign in to Cache in this browser (same site as your sync URL), then reopen this popup.",
            "error"
        );
        return;
    }

    syncBtn.disabled = false;
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
                typeof msg.message === "string" ? msg.message : undefined
            ),
            "error"
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
                "error"
            );
            syncBtn.disabled = false;
            await applyCacheSessionGate();
            return;
        }

        await chrome.tabs.sendMessage(tab.id, { type: "START_SYNC" });
    } catch {
        setStatus(
            "Could not reach this page. Reload the tab and try again.",
            "error"
        );
        syncBtn.disabled = false;
        await applyCacheSessionGate();
    }
});

openCacheBtn?.addEventListener("click", async () => {
    const data = await chrome.storage.local.get(["syncEndpoint"]);
    const origin = deriveOriginFromSyncEndpoint(
        typeof data.syncEndpoint === "string" ? data.syncEndpoint : ""
    );
    if (origin) {
        await chrome.tabs.create({
            url: `${origin}/${CACHE_APP_DEFAULT_LOCALE}`,
        });
    } else {
        await chrome.runtime.openOptionsPage();
    }
});

openOptionsEl?.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
});

window.addEventListener("focus", () => {
    void applyCacheSessionGate();
    void refreshFromStorage();
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.syncEndpoint) {
        return;
    }
    void applyCacheSessionGate();
});

void refreshFromStorage();
void applyCacheSessionGate();
