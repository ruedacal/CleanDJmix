import re

with open("web/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Cortamos el script anterior y ponemos el nuevo con la lógica de capas corregida
html = re.split(r'<!-- INYECCIÓN: Motor de Audio', html)[0]

nuevo_motor = """<!-- INYECCIÓN: Motor de Audio, CUE, Inspector y Vúmetro Animado -->
<style>
    @keyframes equalize {
        0%, 100% { transform: scaleY(0.3); }
        50% { transform: scaleY(1.0); }
    }
    .vu-meter-bar {
        transform-origin: bottom;
        animation-name: equalize;
        animation-iteration-count: infinite;
    }
    .vu-paused .vu-meter-bar {
        animation-play-state: paused !important;
        transform: scaleY(0.1) !important;
        background-color: #3f3f46 !important;
        transition: transform 0.3s ease, background-color 0.3s ease;
    }
</style>
<script>
    document.body.classList.add('vu-paused'); 
    let pistaActual = null;
    let estaReproduciendo = false;

    function controlarReproduccion(estado, nombreArchivo = null) {
        const btnPlay = document.getElementById('global-play-btn');
        if (estado) {
            window.eel.reproducir_pista_mac(nombreArchivo)();
            pistaActual = nombreArchivo;
            estaReproduciendo = true;
            document.body.classList.remove('vu-paused');
            if(btnPlay) btnPlay.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
        } else {
            window.eel.detener_audio_mac()();
            estaReproduciendo = false;
            document.body.classList.add('vu-paused');
            if(btnPlay) btnPlay.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
        }
    }

    document.addEventListener('click', (e) => {
        const btnCue = e.target.closest('#global-cue-btn');
        if (btnCue && window.eel && pistaActual) {
            window.eel.detener_audio_mac()();
            setTimeout(() => window.eel.reproducir_pista_mac(pistaActual)(), 50);
            if (!estaReproduciendo) controlarReproduccion(true, pistaActual);
            return;
        }

        const btnFooter = e.target.closest('#global-play-btn');
        if (btnFooter && window.eel && pistaActual) {
            controlarReproduccion(!estaReproduciendo, pistaActual);
            return;
        }

        const tr = e.target.closest('tr');
        if (tr && window.eel) {
            const filenameDiv = tr.querySelector('.font-mono');
            if (filenameDiv) {
                const nombreArchivo = filenameDiv.innerText.trim();
                
                if (pistaActual === nombreArchivo && estaReproduciendo) {
                    controlarReproduccion(false);
                } else {
                    const tds = tr.querySelectorAll('td');
                    const tituloEl = tr.querySelector('.font-medium');
                    const rowImg = tr.querySelector('img');
                    
                    document.getElementById('player-title').innerText = tituloEl ? tituloEl.innerText : nombreArchivo;
                    document.getElementById('player-artist').innerText = tds[2] ? tds[2].innerText : 'Desconocido';
                    document.getElementById('player-bpm').innerText = (tds[4] ? tds[4].innerText : '--') + ' BPM';
                    document.getElementById('player-key').innerText = tds[5] ? tds[5].innerText : '--';
                    
                    if(rowImg) {
                        const imgSrc = rowImg.src;
                        document.getElementById('player-cover').src = imgSrc;
                        
                        // Lógica corregida para el Inspector
                        const inspectorBadges = Array.from(document.querySelectorAll('div')).filter(el => el.textContent.includes('ID3v2.4'));
                        if(inspectorBadges.length > 0) {
                            const badge = inspectorBadges[0];
                            const coverContainer = badge.parentElement;
                            
                            // Asegurar que el contenedor sea relativo y la etiqueta flote por encima
                            coverContainer.style.position = 'relative';
                            badge.style.position = 'absolute';
                            badge.style.bottom = '12px'; // Mantener el margen inferior
                            badge.style.right = '12px';  // Mantener el margen derecho
                            badge.style.zIndex = '20';
                            
                            // Ocultar el icono del placeholder (svg)
                            const placeholderIcon = coverContainer.querySelector('svg');
                            if (placeholderIcon) placeholderIcon.style.display = 'none';

                            let inspectorImg = document.getElementById('dynamic-inspector-cover');
                            if (!inspectorImg) {
                                inspectorImg = document.createElement('img');
                                inspectorImg.id = 'dynamic-inspector-cover';
                                // z-0 para que se quede detrás de la etiqueta
                                inspectorImg.className = 'absolute inset-0 w-full h-full object-cover rounded-md z-0';
                                // Insertarlo como primer elemento para que sea el fondo
                                coverContainer.insertBefore(inspectorImg, coverContainer.firstChild);
                            }
                            inspectorImg.src = imgSrc;
                        }
                    }
                    controlarReproduccion(true, nombreArchivo);
                }
            }
        }
    });
</script>
</body>
</html>
"""
html += nuevo_motor

with open("web/index.html", "w", encoding="utf-8") as f:
    f.write(html)
    
print("✅ Jerarquía de capas corregida. Carátula del Inspector ajustada.")
