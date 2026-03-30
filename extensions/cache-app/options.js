const syncEndpointEl = document.getElementById("syncEndpoint");
const syncApiKeyEl = document.getElementById("syncApiKey");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("optionsStatus");

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

async function load() {
    const data = await chrome.storage.local.get(["syncEndpoint", "syncApiKey"]);
    if (syncEndpointEl && typeof data.syncEndpoint === "string") {
        syncEndpointEl.value = data.syncEndpoint;
    }
    if (syncApiKeyEl && typeof data.syncApiKey === "string") {
        syncApiKeyEl.value = data.syncApiKey;
    }
}

saveBtn?.addEventListener("click", async () => {
    const endpoint = syncEndpointEl?.value.trim() ?? "";
    const apiKey = syncApiKeyEl?.value ?? "";

    if (endpoint) {
        let originPattern;
        try {
            const u = new URL(endpoint);
            originPattern = `${u.origin}/*`;
        } catch {
            setStatus("Enter a valid URL (including https://).", "error");
            return;
        }

        try {
            const granted = await chrome.permissions.request({
                origins: [originPattern],
            });
            if (!granted) {
                setStatus(
                    "Host permission was not granted; sync to your server may fail.",
                    "error"
                );
            }
        } catch (err) {
            setStatus(
                err instanceof Error
                    ? err.message
                    : "Permission request failed.",
                "error"
            );
        }
    }

    await chrome.storage.local.set({
        syncApiKey: apiKey,
        syncEndpoint: endpoint,
    });
    setStatus("Saved.", "ok");
});

void load();
