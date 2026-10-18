import re

with open("web/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Activar el botón CUE añadiéndole un ID
html = re.sub(
    r'<button([^>]*>CUE</button>)',
    r'<button id="global-cue-btn"\1',
    html
)

# 2. Inyectar la carátula en el Inspector (justo antes de la etiqueta ID3v2.4)
if 'id="inspector-cover"' not in html:
    html = re.sub(
        r'(<div[^>]*>ID3v2\.4</div>)',
        r'<img id="inspector-cover" src="" className="absolute inset-0 w-full h-full object-cover z-10 rounded-md" style={{display: "none"}} />\n\1',
        html
    )

# 3. Limpiar el motor JS anterior y colocar el nuevo con animaciones y lógica CUE
html = re.split(r'<!-- INYECCIÓN:', html)[0]

nuevo_motor = """<!-- INYECCIÓN: Motor de Audio, CUE, Inspector y Vúmetro Animado -->
<style>
    /* Ecualizador simulado: Escala las alturas aleatorias de React para dar vida */
    @keyframes equalize {
        0%, 100% { transform: scaleY(0.3); }
        50% { transform: scaleY(1.0); }
    }
    .vu-meter-bar {
        transform-origin: bottom;
        animation-name: equalize;
        animation-iteration-count: infinite;
        /* La duración se la da React aleatoriamente, nosotros solo aplicamos el keyframe */
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
        // 1. Botón CUE (Reiniciar al inicio)
        const btnCue = e.target.closest('#global-cue-btn');
        if (btnCue && window.eel && pistaActual) {
            window.eel.detener_audio_mac()(); // Detenemos la pista
            setTimeout(() => {
                window.eel.reproducir_pista_mac(pistaActual)(); // La disparamos desde 0
            }, 50);
            
            // Si estaba en pausa, la ponemos en play automáticamente al hacer CUE
            if (!estaReproduciendo) {
                controlarReproduccion(true, pistaActual);
            }
            return;
        }

        // 2. Botón Play/Pause del Footer
        const btnFooter = e.target.closest('#global-play-btn');
        if (btnFooter && window.eel && pistaActual) {
            controlarReproduccion(!estaReproduciendo, pistaActual);
            return;
        }

        // 3. Fila de la Tabla
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
                    // Corrección de índices para que encajen con el nuevo tbody
                    document.getElementById('player-artist').innerText = tds[2] ? tds[2].innerText : 'Desconocido';
                    document.getElementById('player-bpm').innerText = (tds[4] ? tds[4].innerText : '--') + ' BPM';
                    document.getElementById('player-key').innerText = tds[5] ? tds[5].innerText : '--';
                    
                    if(rowImg) {
                        const imgSrc = rowImg.src;
                        // Cargar en el reproductor inferior
                        document.getElementById('player-cover').src = imgSrc;
                        
                        // Cargar en el Inspector lateral derecho
                        const inspectorCover = document.getElementById('inspector-cover');
                        if(inspectorCover) {
                            inspectorCover.src = imgSrc;
                            inspectorCover.style.display = 'block';
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
    
print("✅ Experiencia de Usuario pulida: CUE, Inspector y Animación vinculada.")
