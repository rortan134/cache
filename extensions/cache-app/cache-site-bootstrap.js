/**
 * Runs only on Cache app pages (see manifest `matches`). Same-origin fetch sends session cookies;
 * the service worker stores ingest URL + Bearer token for Instagram/TikTok sync POSTs.
 */
(function runCacheSiteBootstrap() {
    const origin = window.location.origin;

    void (async () => {
        try {
            const res = await fetch(
                `${origin}/api/user/extension-ingest-token`,
                { credentials: "include" },
            );
            if (!res.ok) {
                return;
            }
            const data = await res.json();
            const token =
                data && typeof data.token === "string" ? data.token : "";
            if (!token) {
                return;
            }
            const endpoint = `${origin}/api/integrations/instagram/saved`;
            await chrome.runtime.sendMessage({
                endpoint,
                token,
                type: "CACHE_SITE_BRIDGE",
            });
        } catch (err) {
            console.warn("[Cache App] extension site bridge failed:", err);
        }
    })();
})();
