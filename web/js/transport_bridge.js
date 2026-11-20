/**
 * BEATWAVE PRO - Universal Transport Bridge
 * Transparent RPC abstraction layer:
 * - Detects environment: Native Eel Desktop vs. FastAPI REST/WebSocket vs. Cloud vs. Tauri
 * - Proxies window.eel calls to FastAPI /api/rpc/<funcName> with Promise semantics: window.eel.func(args)()
 * - Bridges real-time progress callbacks via WebSocket /ws/telemetry
 */
(function() {
  'use strict';

  console.log('[BeatWave Transport Bridge] Initializing universal transport layer...');

  const callbacks = {};
  let ws = null;
  let wsConnected = false;
  let reconnectTimer = null;

  function initWebSocket() {
    if (typeof window === 'undefined' || !window.location || !window.location.host) return;
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = function() {
        console.log('[BeatWave Transport Bridge] ⚡ WebSocket telemetry connected.');
        wsConnected = true;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };

      ws.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === 'rpc_callback') {
            const cbName = data.name;
            const args = data.args || [];
            if (typeof callbacks[cbName] === 'function') {
              callbacks[cbName].apply(null, args);
            }
            if (typeof window[cbName] === 'function' && window[cbName] !== callbacks[cbName]) {
              window[cbName].apply(null, args);
            }
          }
        } catch (err) {
          console.warn('[BeatWave Transport Bridge] WebSocket message parse error:', err);
        }
      };

      ws.onclose = function() {
        wsConnected = false;
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(initWebSocket, 2000);
        }
      };

      ws.onerror = function() {
        wsConnected = false;
      };
    } catch (e) {
      console.warn('[BeatWave Transport Bridge] WebSocket connection skipped:', e);
    }
  }

  // Invocar RPC vía HTTP POST con formato FastAPI
  async function invokeRpc(methodName, args) {
    try {
      const response = await fetch(`/api/rpc/${methodName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ args: args || [] })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      if (json && json.status === 'error') {
        throw new Error(json.error || 'Error en ejecución de RPC');
      }
      return json ? json.result : null;
    } catch (err) {
      console.error(`[BeatWave Transport Bridge] Error invocando RPC '${methodName}':`, err);
      throw err;
    }
  }

  // Crear o enriquecer window.eel
  const targetEel = window.eel || {};

  // Función expose
  targetEel.expose = function(fn, name) {
    const fnName = name || fn.name;
    if (fnName) {
      callbacks[fnName] = fn;
      window[fnName] = fn;
    }
    return targetEel;
  };

  // Proxy para interceptar cualquier llamada window.eel.<metodo>(...args)()
  const eelProxy = new Proxy(targetEel, {
    get(target, prop, receiver) {
      // Si la propiedad existe en target directamente (ej. expose), devolverla
      if (prop in target) {
        return target[prop];
      }

      // Si es un símbolo u objeto interno, retornar undefined
      if (typeof prop === 'symbol' || (typeof prop === 'string' && prop.startsWith('_'))) {
        return target[prop];
      }

      // Devolver función currificada acorde al patrón Eel: window.eel.func(args)()
      return function(...args) {
        return function() {
          return invokeRpc(prop, args);
        };
      };
    }
  });

  window.eel = eelProxy;
  // Sincronización ultraligera de metadatos (Zero Audio Ingestion)
  async function pushMetadataSync(libraryName, folders, tracks) {
    const lightTracks = {};
    if (Array.isArray(tracks)) {
      tracks.forEach(t => {
        const id = t.id || t.path || t.filename;
        if (!id) return;
        lightTracks[id] = {
          title: t.title || t.track || '',
          artist: t.artist || '',
          bpm: t.bpm || null,
          key: t.initial_key || t.key || '',
          genre: t.genre || '',
          subgenre: t.subgenre || '',
          duration_ms: t.duration_ms || t.duration || 0,
          energy: t.energy || 0,
          danceability: t.danceability || 0,
          lossless: !!t.lossless,
          cues: t.cues || [],
          beatgrid: t.beatgrid || null,
          folder_id: t.folder_id || null
        };
      });
    }

    const payload = {
      library_name: libraryName || 'Mi Biblioteca DJ',
      folders: folders || [],
      tracks_metadata: lightTracks
    };

    const res = await fetch('/api/sync/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  }

  async function pullMetadataSync() {
    const res = await fetch('/api/sync/pull');
    return await res.json();
  }

  async function getMetadataSyncStatus() {
    const res = await fetch('/api/sync/status');
    return await res.json();
  }

  window.BeatWaveSync = {
    push: pushMetadataSync,
    pull: pullMetadataSync,
    status: getMetadataSyncStatus
  };

  window.__beatwave_transport_bridge = {
    invokeRpc,
    initWebSocket,
    callbacks,
    sync: window.BeatWaveSync
  };

  // Arrancar WebSocket en background
  if (typeof window !== 'undefined' && window.location && window.location.host) {
    initWebSocket();
  }

  console.log('[BeatWave Transport Bridge] ✅ Bridge activo (Modo Híbrido FastAPI / Native RPC listo).');
})();
