// Runtime-agnostic API configuration. Resolution order lets every shell inject its backend
// without touching the bundle:
//   1. ?api=<url> query param (dev overrides, QA builds)
//   2. window.__BEATWAVE_CONFIG__.apiBaseUrl (set by Tauri / Capacitor bootstrap or a hosting page)
//   3. <meta name="beatwave-api-base" content="..."> in the HTML shell
// An empty base URL selects the in-memory mock server so the UI is always operable offline.

const DEFAULTS = { apiBaseUrl: "", timeoutMs: 15000, pollIntervalMs: 700 };

function fromQuery() {
    try {
        const value = new URLSearchParams(window.location.search).get("api");
        return value === null ? undefined : value;
    } catch {
        return undefined;
    }
}

function fromMeta() {
    const meta = typeof document !== "undefined" ? document.querySelector('meta[name="beatwave-api-base"]') : null;
    const value = meta && meta.getAttribute("content");
    return value ? value : undefined;
}

let cached = null;

export function getApiConfig() {
    if (cached) return cached;
    const injected = (typeof window !== "undefined" && window.__BEATWAVE_CONFIG__) || {};
    const rawBase = fromQuery() ?? injected.apiBaseUrl ?? fromMeta() ?? DEFAULTS.apiBaseUrl;
    const apiBaseUrl = rawBase === "mock" ? "" : String(rawBase).replace(/\/+$/, "");
    cached = {
        ...DEFAULTS,
        ...injected,
        apiBaseUrl,
        mode: apiBaseUrl ? "remote" : "mock",
    };
    return cached;
}
