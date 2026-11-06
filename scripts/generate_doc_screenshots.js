const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../web/docs_assets');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
    console.log("1. Conectando a Chrome DevTools Protocol...");
    const res = await fetch('http://127.0.0.1:9222/json');
    const targets = await res.json();
    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:8000'));
    if (!pageTarget) {
        throw new Error("No page target found on localhost:8000");
    }

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let idSeq = 1;
    const pending = new Map();
    ws.onmessage = (e) => {
        const m = JSON.parse(e.data);
        if (m.method === 'Page.javascriptDialogOpening') {
            // Auto accept any dialog
            send('Page.handleJavaScriptDialog', { accept: true });
        }
        if (m.id && pending.has(m.id)) {
            pending.get(m.id)(m.result);
            pending.delete(m.id);
        }
    };
    await new Promise(r => ws.onopen = r);

    const send = (method, params = {}) => new Promise((resolve) => {
        const id = idSeq++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
    });

    console.log("2. Configurando Viewport 1920x1080 (Retina Scale 2x)...");
    await send("Page.enable");
    await send("Runtime.enable");
    await send("Emulation.setDeviceMetricsOverride", {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
        mobile: false
    });

    async function evaluate(code) {
        const result = await send("Runtime.evaluate", {
            expression: code,
            returnByValue: true,
            awaitPromise: true
        });
        return result && result.result ? result.result.value : null;
    }

    // Auto bypass
    await evaluate(`(() => {
        window.confirm = () => true;
        window.alert = () => {};
        sessionStorage.setItem('bw_intro_viewed', 'true');
        const skip = Array.from(document.querySelectorAll('button')).find(b => (b.innerText || '').includes('Saltar'));
        if (skip) skip.click();
    })()`);
    await new Promise(r => setTimeout(r, 1000));

    async function captureClip(filename, rect) {
        console.log(`Guardando captura ${filename}...`);
        const padding = 10;
        const x = Math.max(0, Math.round(rect.x) - padding);
        const y = Math.max(0, Math.round(rect.y) - padding);
        const width = Math.min(1920 - x, Math.round(rect.width) + padding * 2);
        const height = Math.min(1080 - y, Math.round(rect.height) + padding * 2);

        const shot = await send("Page.captureScreenshot", {
            format: "png",
            clip: { x, y, width, height, scale: 2 }
        });
        const dest = path.join(OUTPUT_DIR, filename);
        fs.writeFileSync(dest, Buffer.from(shot.data, 'base64'));
        console.log(`✓ [${filename}] guardado (${shot.data.length} bytes, ${width*2}x${height*2} px)`);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 1. dropzone_files.png
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n>>> PASO A: dropzone_files.png");
    await evaluate(`(() => {
        const tabAudit = document.querySelector('button[title*="Auditoría"]');
        if (tabAudit) tabAudit.click();
    })()`);
    await new Promise(r => setTimeout(r, 600));

    const dropRect = await evaluate(`(() => {
        const dropzone = document.querySelector('.border-dashed') || 
                         document.querySelector('[data-testid="dropzone"]') ||
                         Array.from(document.querySelectorAll('div')).find(d => (d.innerText || '').includes('Auditoría & Inteligencia Acústica DJ'));
        if (!dropzone) return null;
        const c = dropzone.closest('.max-w-2xl') || dropzone;
        const r = c.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
    })()`);

    if (dropRect) {
        await captureClip('dropzone_files.png', dropRect);
    } else {
        console.warn("Dropzone rect no encontrado, intentando captura estándar...");
        await captureClip('dropzone_files.png', { x: 450, y: 150, width: 1020, height: 750 });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. tabla_biblioteca.png
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n>>> PASO B: tabla_biblioteca.png");
    await evaluate(`(() => {
        const tabCrates = document.querySelector('button[title*="Taxonomía"]') ||
                          Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'CRATES');
        if (tabCrates) tabCrates.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const tableRect = await evaluate(`(() => {
        const table = document.querySelector('table');
        if (!table) return null;
        const r = table.getBoundingClientRect();
        return { x: r.x, y: r.y, width: Math.min(1880, r.width), height: Math.min(580, r.height) };
    })()`);

    if (tableRect) {
        await captureClip('tabla_biblioteca.png', tableRect);
    } else {
        await captureClip('tabla_biblioteca.png', { x: 20, y: 350, width: 1880, height: 550 });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. waveform_cues.png
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n>>> PASO C: waveform_cues.png");
    await evaluate(`(() => {
        const firstRow = document.querySelector('tbody tr');
        if (firstRow) {
            const cueBtn = Array.from(firstRow.querySelectorAll('button')).find(b => b.innerText.includes('🎛️'));
            if (cueBtn) cueBtn.click();
        }
        const tabCues = document.querySelector('button[title*="Hot Cues"]') ||
                        Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'CUES');
        if (tabCues) tabCues.click();
    })()`);
    await new Promise(r => setTimeout(r, 1200));

    const cuesRect = await evaluate(`(() => {
        const cuesSection = document.querySelector('main').children[1];
        if (!cuesSection) return null;
        const r = cuesSection.getBoundingClientRect();
        return { x: 20, y: Math.max(64, r.y), width: 1880, height: Math.min(680, r.height) };
    })()`);

    if (cuesRect) {
        await captureClip('waveform_cues.png', cuesRect);
    } else {
        await captureClip('waveform_cues.png', { x: 20, y: 64, width: 1880, height: 680 });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. panel_shazam.png
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n>>> PASO D: panel_shazam.png");
    await evaluate(`(() => {
        const tabRadar = document.querySelector('button[title*="Radar"]') ||
                         Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'RADAR');
        if (tabRadar) tabRadar.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const shazamRect = await evaluate(`(() => {
        const radarView = document.querySelector('main').children[3];
        if (!radarView) return null;
        const r = radarView.getBoundingClientRect();
        return { x: 20, y: Math.max(64, r.y), width: 1880, height: Math.min(880, r.height) };
    })()`);

    if (shazamRect) {
        await captureClip('panel_shazam.png', shazamRect);
    } else {
        await captureClip('panel_shazam.png', { x: 20, y: 64, width: 1880, height: 880 });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. dashboard_completo.png
    // ─────────────────────────────────────────────────────────────────────────
    console.log("\n>>> PASO E: dashboard_completo.png");
    await evaluate(`(() => {
        const tabCues = document.querySelector('button[title*="Hot Cues"]') ||
                        Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'CUES');
        if (tabCues) tabCues.click();
    })()`);
    await new Promise(r => setTimeout(r, 800));

    const fullShot = await send("Page.captureScreenshot", {
        format: "png",
        clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 2 }
    });
    const destFull = path.join(OUTPUT_DIR, 'dashboard_completo.png');
    fs.writeFileSync(destFull, Buffer.from(fullShot.data, 'base64'));
    console.log(`✓ [dashboard_completo.png] guardado (${fullShot.data.length} bytes, 3840x2160 px) en ${destFull}`);

    console.log("\n✓ Proceso completado exitosamente sin errores.");
    ws.close();
}

run().catch(err => {
    console.error("Error fatal:", err);
    process.exit(1);
});
