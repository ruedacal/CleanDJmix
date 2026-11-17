import { SNIPPETS } from './log-snippets.js';

const DETAILS = {
    analyze_timeout: {
        fn: 'AnalysisService.escanear_directorio',
        exception: 'concurrent.futures.TimeoutError',
        message: 'El worker no devolvió resultado para /Music/Afterglow.mp3 en 30 s; la petición HTTP se cerró antes.',
        cause: 'future.result() espera sin límite y el bloque except silencia el error, así que el fallo de un fichero (MP3 corrupto o muy largo decodificándose en librosa) bloquea el lote hasta que salta el timeout del gateway.',
        fix: 'Usa future.result(timeout=25), registra la ruta en el except con logger.exception(path) y marca la pista como "pendiente" en lugar de descartarla.',
        stack: [
            'main_web.py:344 in api_load_directory',
            'application/analysis_service.py:108 in escanear_directorio',
            'application/analysis_service.py:111 in escanear_directorio',
            'concurrent/futures/_base.py:456 in result',
        ],
    },
    cover_missing: {
        fn: 'MediaService.obtener_caratula_binaria',
        exception: 'FileNotFoundError (lógico, devuelve None)',
        message: 'Sin APIC/pictures en las etiquetas y sin cover.jpg/folder.jpg en la carpeta de set_509.',
        cause: 'El fichero no tiene carátula embebida y la carpeta no tiene imagen de respaldo. El except de Mutagen oculta si la lectura falló o si simplemente no había imagen.',
        fix: 'Distingue "sin carátula" de "error de lectura" con un log en el except; como respaldo, pide la carátula a iTunes con buscar_metadata_itunes y guárdala en caché.',
        stack: [
            'main_web.py:172 in cover',
            'services/media_service.py:214 in obtener_caratula_binaria',
        ],
    },
    spotify_credentials: {
        fn: 'SpotifyAdapter._get_client',
        exception: 'ValueError',
        message: 'Credenciales de Spotify no localizadas en entorno ni en archivo .env',
        cause: 'SPOTIFY_CLIENT_ID o SPOTIFY_CLIENT_SECRET no están definidos en el entorno de despliegue (en local se leen de .env, que no se sube a producción).',
        fix: 'Añade SPOTIFY_CLIENT_ID y SPOTIFY_CLIENT_SECRET en Vercel → Settings → Environment Variables y vuelve a desplegar.',
        stack: [
            'main_web.py:561 in api_analizar_spotify',
            'infrastructure/spotify_adapter.py:80 in escanear_lista',
            'infrastructure/spotify_adapter.py:45 in _get_client',
        ],
    },
    remote_token: {
        fn: '_verificar_token_remoto',
        exception: 'HTTP 403 Forbidden',
        message: 'Token de sesión inválido o ausente.',
        cause: 'En modo remoto la petición llegó sin cabecera X-Session-Token o con un token caducado. 14 intentos en 60 s desde la misma IP apuntan a un script automatizado.',
        fix: 'Si es un cliente legítimo, renueva el token al iniciar sesión. Si se repite, bloquea la IP en el firewall de Vercel o añade un rate limit con Upstash Redis.',
        stack: [
            'bottle.py:868 in _handle',
            'main_web.py:93 in _verificar_token_remoto',
        ],
    },
    billing_retry: {
        fn: 'Webhook invoice.payment_failed',
        exception: 'card_declined (insufficient_funds)',
        message: 'Stripe reintentará el cobro de s_3299 el 12/11 (intento 3 de 3).',
        cause: 'La tarjeta del cliente se rechazó por fondos insuficientes. Es un aviso de Stripe, no un fallo de nuestro código.',
        fix: 'Envía el aviso "Pago fallido" al usuario desde Avisos. Si falla el tercer intento, la suscripción pasa a past_due.',
        stack: [],
        external: 'Stripe Billing',
    },
};

export function getLogDetail(key) {
    const detail = DETAILS[key];
    if (!detail) return null;
    return { ...detail, snippet: SNIPPETS[key] || null };
}
