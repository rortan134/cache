(function () {
    const MESSAGE_TYPE = "CACHE_YT_BOOTSTRAP";

    try {
        const cfg = window.ytcfg || null;
        const get = function (key) {
            try {
                if (cfg && typeof cfg.get === "function") {
                    return cfg.get(key);
                }
                if (cfg && cfg.data_) {
                    return cfg.data_[key];
                }
            } catch (_error) {
                return null;
            }
            return null;
        };

        window.postMessage(
            {
                type: MESSAGE_TYPE,
                payload: {
                    apiKey: get("INNERTUBE_API_KEY") || null,
                    clientName: get("INNERTUBE_CONTEXT_CLIENT_NAME") || null,
                    clientVersion: get("INNERTUBE_CONTEXT_CLIENT_VERSION") || null,
                    context: get("INNERTUBE_CONTEXT") || null,
                    initialData: window.ytInitialData || null,
                },
            },
            window.location.origin,
        );
    } catch (_error) {
        window.postMessage(
            {
                type: MESSAGE_TYPE,
                payload: null,
            },
            window.location.origin,
        );
    }
})();
