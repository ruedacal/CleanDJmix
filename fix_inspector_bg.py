import re

with open("web/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Cortamos el motor anterior
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
                        
                        // LÓGICA CSS PERFECTA PARA EL INSPECTOR
                        const inspectorBadges = Array.from(document.querySelectorAll('div, span')).filter(el => el.textContent.trim() === 'ID3v2.4');
                        if(inspectorBadges.length > 0) {
                            const badge = inspectorBadges[0];
                            // Encontramos el recuadro negro que envuelve al badge
                            const coverContainer = badge.closest('.relative') || badge.parentElement;
                            
                            // Ocultamos el icono cuadriculado central
                            const svgIcon = coverContainer.querySelector('svg');
                            if (svgIcon) svgIcon.style.display = 'none';

                            // Pintamos la imagen como fondo CSS. Esto garantiza que respete el tamaño, 
                            // los bordes redondeados y NUNCA tape a la etiqueta ID3v2.4.
                            coverContainer.style.backgroundImage = `url("${imgSrc}")`;
                            coverContainer.style.backgroundSize = 'cover';
                            coverContainer.style.backgroundPosition = 'center';
                            coverContainer.style.backgroundRepeat = 'no-repeat';
                            
                            // Eliminamos cualquier imagen residual de intentos anteriores
                            const viejaImg = document.getElementById('dynamic-inspector-cover');
                            if (viejaImg) viejaImg.remove();
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
    
print("✅ Carátula del Inspector convertida a Fondo CSS. Encuadre perfecto garantizado.")
