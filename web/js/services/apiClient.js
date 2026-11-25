const DEFAULT_TIMEOUT_MS = 30000;

async function request(url, { method = 'GET', body = undefined, timeoutMs = DEFAULT_TIMEOUT_MS, signal = undefined } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    if (signal) signal.addEventListener('abort', onAbort, { once: true });

    try {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        const headers = { Accept: 'application/json' };
        if (body !== undefined && !isFormData) {
            headers['Content-Type'] = 'application/json';
        }
        const res = await fetch(url, {
            method,
            headers,
            body: body === undefined ? undefined : (isFormData ? body : JSON.stringify(body)),
            signal: controller.signal,
        });
        const contentType = res.headers.get('content-type') || '';
        const payload = contentType.includes('application/json') ? await res.json() : await res.text();
        if (!res.ok) {
            const msg = (payload && (payload.detail || payload.error || payload.message)) || `HTTP ${res.status}`;
            throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
        }
        return payload;
    } finally {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
    }
}

export const apiClient = {
    get: (url, opts = {}) => request(url, { ...opts, method: 'GET' }),
    post: (url, body, opts = {}) => request(url, { ...opts, method: 'POST', body }),
    rpc: async (methodName, ...args) => {
        const data = await request(`/api/rpc/${encodeURIComponent(methodName)}`, {
            method: 'POST',
            body: { args },
        });
        return data && Object.prototype.hasOwnProperty.call(data, 'result') ? data.result : data;
    },
};

export default apiClient;
