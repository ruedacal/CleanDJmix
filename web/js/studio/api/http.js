import { getApiConfig } from "./config.js";
import { handleMockRequest } from "./mock-server.js";

export class ApiError extends Error {
    constructor(message, { status = 0, code = "network_error", details = null } = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

function buildUrl(base, path, query) {
    const url = `${base}${path}`;
    if (!query) return url;
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => value != null && params.append(key, String(value)));
    const qs = params.toString();
    return qs ? `${url}?${qs}` : url;
}

async function parseBody(response) {
    if (response.status === 204) return null;
    const type = response.headers.get("content-type") || "";
    return type.includes("application/json") ? response.json() : response.text();
}

async function remoteRequest(method, path, { body, query, signal, headers } = {}) {
    const { apiBaseUrl, timeoutMs } = getApiConfig();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), timeoutMs);
    const onAbort = () => controller.abort(signal.reason);
    if (signal) signal.addEventListener("abort", onAbort, { once: true });

    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    try {
        const response = await fetch(buildUrl(apiBaseUrl, path, query), {
            method,
            headers: { Accept: "application/json", ...(body && !isForm ? { "Content-Type": "application/json" } : {}), ...headers },
            body: body == null ? undefined : isForm ? body : JSON.stringify(body),
            signal: controller.signal,
        });
        const data = await parseBody(response);
        if (!response.ok) {
            const error = (data && data.error) || {};
            throw new ApiError(error.message || `HTTP ${response.status}`, { status: response.status, code: error.code || "http_error", details: error.details });
        }
        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        if (error && error.name === "AbortError" && signal && signal.aborted) throw error;
        const timedOut = controller.signal.aborted;
        throw new ApiError(timedOut ? "El servidor tardó demasiado en responder" : "No se pudo contactar con la API", { code: timedOut ? "timeout" : "network_error" });
    } finally {
        clearTimeout(timer);
        if (signal) signal.removeEventListener("abort", onAbort);
    }
}

async function mockRequest(method, path, { body, query, signal } = {}) {
    const { status, data } = await handleMockRequest(method, path, { body, query, signal });
    if (status >= 400) {
        const error = (data && data.error) || {};
        throw new ApiError(error.message || `HTTP ${status}`, { status, code: error.code || "http_error" });
    }
    return data;
}

export function request(method, path, options) {
    return getApiConfig().mode === "mock" ? mockRequest(method, path, options) : remoteRequest(method, path, options);
}

export const http = {
    get: (path, options) => request("GET", path, options),
    post: (path, body, options) => request("POST", path, { ...options, body }),
    put: (path, body, options) => request("PUT", path, { ...options, body }),
    patch: (path, body, options) => request("PATCH", path, { ...options, body }),
    delete: (path, options) => request("DELETE", path, options),
};
