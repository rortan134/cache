const statusEl = document.getElementById("status");
const syncBtn = document.getElementById("sync");
const chromeSyncBtn = document.getElementById("chromeSync");
const chromeModeEl = document.getElementById("chromeMode");
const chromeContinuousEl = document.getElementById("chromeContinuous");
const instagramMetaEl = document.getElementById("instagramMeta");
const tiktokMetaEl = document.getElementById("tiktokMeta");
const chromeMetaEl = document.getElementById("chromeMeta");
const openCacheBtnEl = document.getElementById("openCache");

const CACHE_APP_DEFAULT_LOCALE = "en-US";

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
    } catch {}

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
        } catch {}
    }
    return false;
}

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

function formatErrorMessage(code, message) {
    const map = {
        CHROME_SYNC_FAILED:
            message || "Chrome bookmarks could not be synced right now.",
        MERGE_FAILED: message || "Could not save data.",
        NO_ITEMS: "No items found. Scroll the grid, then sync again.",
        NOT_SAVED_PAGE: "Open your Saved collection on Instagram first.",
        SCRAPE_FAILED: message || "Could not read the page.",
        UNKNOWN: message || "Something went wrong.",
        UNSUPPORTED_PAGE:
            "Open instagram.com or tiktok.com (Saved or Favorites) in this tab.",
    };
    return map[code] ?? message ?? "Sync failed.";
}

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

async function loadMeta() {
    const response = await chrome.runtime.sendMessage({ type: "GET_SYNC_META" });
    return response && typeof response === "object" ? response : {};
}

async function refreshFromStorage() {
    const meta = await loadMeta();

    if (instagramMetaEl) {
        instagramMetaEl.textContent = `Instagram Saved: ${meta.instagramCount ?? 0} · last sync ${formatLastSync(meta.instagramLastSyncAt)}`;
    }
    if (tiktokMetaEl) {
        tiktokMetaEl.textContent = `TikTok Favorites: ${meta.tiktokCount ?? 0} · last sync ${formatLastSync(meta.tiktokLastSyncAt)}`;
    }
    if (chromeMetaEl) {
        const pending = meta.chromePendingEvents ?? 0;
        const mode = meta.chromeContinuousSync ? "continuous" : "one-time";
        const error = meta.chromeLastError ? ` · error ${meta.chromeLastError}` : "";
        chromeMetaEl.textContent = `Chrome bookmarks: ${meta.chromeCount ?? 0} · ${mode} mode · pending ${pending} · last sync ${formatLastSync(meta.chromeLastSyncAt)}${error}`;
    }
    if (chromeContinuousEl) {
        chromeContinuousEl.checked = meta.chromeContinuousSync === true;
    }
    if (chromeModeEl) {
        chromeModeEl.value =
            meta.chromeContinuousSync === true
                ? "continuous_sync"
                : chromeModeEl.value || "one_time_import";
    }
}

async function applyCacheSessionGate() {
    const appOrigin = String(globalThis.CACHE_APP_ORIGIN ?? "").replace(
        /\/$/,
        "",
    );
    if (!appOrigin) {
        syncBtn.disabled = true;
        chromeSyncBtn.disabled = true;
        setOpenCacheVisible(true);
        setStatus(
            "Extension is missing CACHE_APP_ORIGIN in cache-config.js.",
            "error",
        );
        return false;
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
        chromeSyncBtn.disabled = true;
        setOpenCacheVisible(true);
        setStatus(
            "Sign in to Cache and keep a cachd.app tab open, then reopen this popup.",
            "error",
        );
        return false;
    }

    syncBtn.disabled = false;
    chromeSyncBtn.disabled = false;
    setOpenCacheVisible(false);
    if (statusEl && !statusEl.classList.contains("error")) {
        statusEl.textContent = "";
    }
    return true;
}

function handleProgressMessage(msg) {
    const activeMap = {
        chrome: "Chrome bookmarks",
        instagram: "Instagram Saved",
        tiktok: "TikTok Favorites",
    };
    const active = activeMap[msg.activeSource] ?? "items";
    setStatus(`Syncing ${active}…`, "idle");
}

function handleDoneMessage(msg) {
    const sourceMap = {
        chrome: "Chrome bookmarks",
        instagram: "Instagram Saved",
        tiktok: "TikTok Favorites",
    };
    const src = sourceMap[msg.completedSource] ?? "items";
    setStatus(`Done. ${src} updated.`, "ok");
}

chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "SYNC_PROGRESS") {
        handleProgressMessage(msg);
        void refreshFromStorage();
    }
    if (msg?.type === "SYNC_DONE") {
        handleDoneMessage(msg);
        if (syncBtn) {
            syncBtn.disabled = false;
        }
        if (chromeSyncBtn) {
            chromeSyncBtn.disabled = false;
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
        if (syncBtn) {
            syncBtn.disabled = false;
        }
        if (chromeSyncBtn) {
            chromeSyncBtn.disabled = false;
        }
        void refreshFromStorage();
    }
});

syncBtn?.addEventListener("click", async () => {
    const linked = await applyCacheSessionGate();
    if (!linked || syncBtn?.disabled) {
        return;
    }

    setStatus("Syncing current tab…", "idle");
    syncBtn.disabled = true;

    try {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        if (!tab?.id) {
            throw new Error("No active tab.");
        }
        const url = tab.url ?? "";
        if (
            !url.startsWith("https://www.instagram.com/") &&
            !url.startsWith("https://www.tiktok.com/")
        ) {
            throw new Error(
                "Open Instagram or TikTok in this tab (Saved or Favorites).",
            );
        }

        await chrome.tabs.sendMessage(tab.id, { type: "START_SYNC" });
    } catch (error) {
        setStatus(
            error instanceof Error
                ? error.message
                : "Could not reach this page. Reload the tab and try again.",
            "error",
        );
        syncBtn.disabled = false;
        await applyCacheSessionGate();
    }
});

chromeSyncBtn?.addEventListener("click", async () => {
    const linked = await applyCacheSessionGate();
    if (!linked || chromeSyncBtn?.disabled) {
        return;
    }

    const selectedMode =
        chromeModeEl?.value === "continuous_sync"
            ? "continuous_sync"
            : "one_time_import";
    const continuousEnabled = chromeContinuousEl?.checked === true;
    const mode = continuousEnabled ? "continuous_sync" : selectedMode;

    setStatus(
        mode === "continuous_sync"
            ? "Importing Chrome bookmarks and enabling continuous sync…"
            : "Importing Chrome bookmarks…",
        "idle",
    );
    chromeSyncBtn.disabled = true;

    try {
        if (chromeContinuousEl) {
            chromeContinuousEl.checked = mode === "continuous_sync";
        }
        await chrome.runtime.sendMessage({
            mode,
            type: "SYNC_CHROME_BOOKMARKS",
        });
    } catch (error) {
        setStatus(
            error instanceof Error
                ? error.message
                : "Chrome bookmarks could not be synced right now.",
            "error",
        );
        chromeSyncBtn.disabled = false;
        await applyCacheSessionGate();
    }
});

chromeContinuousEl?.addEventListener("change", async () => {
    const enabled = chromeContinuousEl.checked;
    if (chromeModeEl) {
        chromeModeEl.value = enabled ? "continuous_sync" : "one_time_import";
    }
    await chrome.runtime.sendMessage({
        enabled,
        type: "TOGGLE_CHROME_SYNC",
    });
    void refreshFromStorage();
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
    if (
        changes.syncApiKey ||
        changes.syncEndpoint ||
        changes.chromeSyncEnabled ||
        changes.chromeLastSyncAt ||
        changes.chromePendingEvents
    ) {
        void applyCacheSessionGate();
        void refreshFromStorage();
    }
});

void refreshFromStorage();
void applyCacheSessionGate();
