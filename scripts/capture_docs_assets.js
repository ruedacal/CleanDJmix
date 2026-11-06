const fs = require('fs');
const path = require('path');

async function main() {
    // 1. Get targets from Chrome
    const res = await fetch('http://127.0.0.1:9222/json');
    const targets = await res.json();
    const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:8000'));
    if (!pageTarget) {
        console.error("No localhost:8000 page target found! Targets:", targets);
        process.exit(1);
    }
    console.log("Connected to page:", pageTarget.title, pageTarget.webSocketDebuggerUrl);

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let idSeq = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && pending.has(msg.id)) {
            const { resolve, reject } = pending.get(msg.id);
            pending.delete(msg.id);
            if (msg.error) reject(msg.error);
            else resolve(msg.result);
        }
    };

    await new Promise((resolve, reject) => {
        ws.onopen = resolve;
        ws.onerror = reject;
    });

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = idSeq++;
            pending.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    // Enable Page and Runtime
    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    console.log("Evaluating page state...");
    // Bypass intro video if visible
    const evalRes = await send('Runtime.evaluate', {
        expression: `
            (() => {
                sessionStorage.setItem('bw_intro_viewed', 'true');
                // Check if intro overlay exists and remove or click skip
                const btn = document.querySelector('button[title*="Saltar"], button:has(svg), .skip-intro-btn');
                const introEl = document.querySelector('.fixed.inset-0.z-50');
                return {
                    title: document.title,
                    url: window.location.href,
                    hasIntro: !!introEl,
                    bodyText: document.body.innerText.slice(0, 200)
                };
            })()
        `,
        returnByValue: true
    });
    console.log("Page state:", evalRes.result.value);

    // If intro was on, let's reload or dispatch key / skip
    await send('Runtime.evaluate', {
        expression: `
            sessionStorage.setItem('bw_intro_viewed', 'true');
            // If there's an intro video or portal, press Escape or click skip
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        `
    });

    await new Promise(r => setTimeout(r, 1500));

    // Check DOM components
    const domCheck = await send('Runtime.evaluate', {
        expression: `
            (() => {
                const dropzone = document.querySelector('[data-testid="dropzone"], .border-dashed, input[type="file"]');
                const table = document.querySelector('table, [role="grid"], .divide-y');
                const canvas = document.querySelector('canvas');
                return {
                    hasDropzone: !!dropzone,
                    hasTable: !!table,
                    hasCanvas: !!canvas,
                    totalButtons: document.querySelectorAll('button').length
                };
            })()
        `,
        returnByValue: true
    });
    console.log("DOM check:", domCheck.result.value);

    ws.close();
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
