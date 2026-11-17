/**
 * BeatWave PRO — Edge Music Recognition Gateway (Cloudflare Worker)
 * ==============================================================================
 * Ultra-fast serverless gateway executing at Cloudflare Edge network (100% isolated).
 * Protects ACRCloud secrets by signing client binary fingerprints using native V8 WebCrypto
 * and enforcing strict 1,200 ms SLAs before querying upstream servers.
 *
 * Architecture & Security:
 * - Environment Isolation: ACR_ACCESS_KEY & ACR_ACCESS_SECRET never touch mobile client binaries.
 * - Hardware-accelerated HMAC-SHA1 using native crypto.subtle (Zero third-party crypto overhead).
 * - Strict 1,200 ms AbortController to guarantee instantaneous DJ booth feedback.
 * - Full CORS compliance for Hybrid Web / iOS / Android / Desktop (Tauri/Electron).
 */

export interface Env {
    ACR_ACCESS_KEY: string;
    ACR_ACCESS_SECRET: string;
    ACR_HOST?: string;            // Default: 'identify-eu-west-1.acrcloud.com'
    ALLOWED_ORIGIN?: string;      // Default: '*'
}

// Configuración de límites y timeouts canónicos
const GATEWAY_TIMEOUT_MS = 1200;
const DEFAULT_ACR_HOST = 'identify-eu-west-1.acrcloud.com';
const IDENTIFY_ENDPOINT = '/v1/identify';
const DATA_TYPE = 'fingerprint';
const SIGNATURE_VERSION = '1';

/**
 * Generador de cabeceras CORS dinámicas para aplicaciones híbridas
 */
function getCorsHeaders(request: Request, env: Env): HeadersInit {
    const origin = request.headers.get('Origin') || '*';
    const allowed = env.ALLOWED_ORIGIN || '*';
    const allowOrigin = (allowed === '*' || allowed.includes(origin)) ? origin : allowed;

    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Platform, X-Requested-With',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
    };
}

/**
 * Respuesta JSON estandarizada con headers de seguridad y CORS
 */
function createJsonResponse(data: unknown, status = 200, request: Request, env: Env): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'X-Content-Type-Options': 'nosniff',
            ...getCorsHeaders(request, env)
        }
    });
}

/**
 * Cálculo determinista de firma HMAC-SHA1 según especificación oficial ACRCloud:
 * string_to_sign = HTTP-Method + "\n" + HTTP-URI + "\n" + AccessKey + "\n" + DataType + "\n" + SignatureVersion + "\n" + Timestamp
 */
async function computeAcrSignature(
    accessKey: string,
    accessSecret: string,
    httpMethod: string,
    httpUri: string,
    dataType: string,
    signatureVersion: string,
    timestamp: string
): Promise<string> {
    const stringToSign = `${httpMethod}\n${httpUri}\n${accessKey}\n${dataType}\n${signatureVersion}\n${timestamp}`;
    const encoder = new TextEncoder();

    const keyBuffer = encoder.encode(accessSecret);
    const messageBuffer = encoder.encode(stringToSign);

    // Importar clave HMAC en motor WebCrypto nativo V8
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );

    // Firmar con HMAC-SHA1
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);

    // Conversión binaria directa a Base64 sin buffers intermedios
    const signatureBytes = new Uint8Array(signatureBuffer);
    let binaryString = '';
    for (let i = 0; i < signatureBytes.byteLength; i++) {
        binaryString += String.fromCharCode(signatureBytes[i]);
    }

    return btoa(binaryString);
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const startTime = Date.now();

        // 1. Manejo de Preflight OPTIONS para navegadores y webviews
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: getCorsHeaders(request, env)
            });
        }

        // 2. Health-check de estado
        const url = new URL(request.url);
        if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/')) {
            return createJsonResponse({
                status: 'operational',
                service: 'BeatWave Radar Edge Gateway',
                region: request.cf?.colo || 'edge',
                timestamp: Math.floor(Date.now() / 1000)
            }, 200, request, env);
        }

        // 3. Validación de método HTTP
        if (request.method !== 'POST') {
            return createJsonResponse({
                status: { code: 405, msg: 'Método no permitido. Solo se acepta POST.' }
            }, 405, request, env);
        }

        // 4. Validación estricta de credenciales en entorno Edge
        if (!env.ACR_ACCESS_KEY || !env.ACR_ACCESS_SECRET) {
            return createJsonResponse({
                status: {
                    code: 500,
                    msg: 'Error de configuración: Variables de entorno ACR_ACCESS_KEY o ACR_ACCESS_SECRET no definidas en el Worker.'
                }
            }, 500, request, env);
        }

        try {
            // 5. Ingestión del buffer de huella binaria (Uint8Array)
            let fingerprintBytes: Uint8Array;
            const contentType = request.headers.get('content-type') || '';

            if (contentType.includes('multipart/form-data')) {
                const formData = await request.formData();
                const fileEntry = formData.get('sample') || formData.get('fingerprint');
                if (!fileEntry || typeof fileEntry === 'string') {
                    return createJsonResponse({
                        status: { code: 2004, msg: 'Campo "sample" binario requerido en multipart/form-data.' }
                    }, 400, request, env);
                }
                const arrayBuf = await (fileEntry as Blob).arrayBuffer();
                fingerprintBytes = new Uint8Array(arrayBuf);
            } else {
                // Ingestión directa raw body (application/octet-stream) Zero-Copy
                const rawBuffer = await request.arrayBuffer();
                fingerprintBytes = new Uint8Array(rawBuffer);
            }

            if (!fingerprintBytes || fingerprintBytes.byteLength === 0) {
                return createJsonResponse({
                    status: { code: 2005, msg: 'Buffer de huella acústica vacío o inválido.' }
                }, 400, request, env);
            }

            // 6. Preparación de metadatos de autenticación
            const host = env.ACR_HOST || DEFAULT_ACR_HOST;
            const timestamp = Math.floor(Date.now() / 1000).toString();

            const signature = await computeAcrSignature(
                env.ACR_ACCESS_KEY,
                env.ACR_ACCESS_SECRET,
                'POST',
                IDENTIFY_ENDPOINT,
                DATA_TYPE,
                SIGNATURE_VERSION,
                timestamp
            );

            // 7. Construcción del payload multipart/form-data upstream
            const outboundForm = new FormData();
            const sampleBlob = new Blob([fingerprintBytes], { type: 'application/octet-stream' });

            outboundForm.append('sample', sampleBlob, 'fingerprint.bin');
            outboundForm.append('access_key', env.ACR_ACCESS_KEY);
            outboundForm.append('data_type', DATA_TYPE);
            outboundForm.append('signature', signature);
            outboundForm.append('signature_version', SIGNATURE_VERSION);
            outboundForm.append('timestamp', timestamp);
            outboundForm.append('sample_bytes', fingerprintBytes.byteLength.toString());

            // 8. Control estricto de timeout (1,200 ms) mediante AbortController
            const abortController = new AbortController();
            const timeoutTimer = setTimeout(() => {
                abortController.abort();
            }, GATEWAY_TIMEOUT_MS);

            // 9. Fetch asíncrono HTTP/2 hacia ACRCloud
            const acrTargetUrl = `https://${host}${IDENTIFY_ENDPOINT}`;
            const acrResponse = await fetch(acrTargetUrl, {
                method: 'POST',
                body: outboundForm,
                signal: abortController.signal,
                headers: {
                    'User-Agent': 'BeatWave-Radar-Edge/1.0.0 (Cloudflare Workers)'
                }
            });

            clearTimeout(timeoutTimer);

            const durationMs = Date.now() - startTime;
            const responseText = await acrResponse.text();

            let parsedJson: unknown;
            try {
                parsedJson = JSON.parse(responseText);
            } catch {
                parsedJson = { raw: responseText };
            }

            // 10. Respuesta al cliente DJ con métricas de latencia inyectadas
            const responseHeaders = new Headers(getCorsHeaders(request, env));
            responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
            responseHeaders.set('X-Edge-Latency-Ms', durationMs.toString());
            responseHeaders.set('X-Edge-Region', request.cf?.colo || 'edge');

            return new Response(JSON.stringify(parsedJson), {
                status: acrResponse.status,
                headers: responseHeaders
            });

        } catch (err: unknown) {
            const error = err as Error;
            const durationMs = Date.now() - startTime;

            // Manejo específico de Timeout estricto de 1,200 ms
            if (error.name === 'AbortError') {
                return createJsonResponse({
                    status: {
                        code: 504,
                        msg: `ACRCloud Gateway Timeout: El reconocimiento superó el umbral estricto de ${GATEWAY_TIMEOUT_MS} ms.`
                    },
                    telemetry: {
                        latencyMs: durationMs,
                        timedOut: true
                    }
                }, 504, request, env);
            }

            // Errores de red o conexión
            return createJsonResponse({
                status: {
                    code: 502,
                    msg: `Fallo de comunicación con servidor ACRCloud: ${error.message || 'Error desconocido'}`
                },
                telemetry: {
                    latencyMs: durationMs,
                    timedOut: false
                }
            }, 502, request, env);
        }
    }
};
