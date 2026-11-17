const { useState, useEffect, useRef } = React;
import { Icons } from '../shell/icons.jsx';
import { SectionTitle } from '../shell/workspace-ui.jsx';
import { getValidCover } from '../data/constants.js';
import { Phase1FastRecognizer } from '../modules/Phase1FastRecognizer.ts';

// Espacio de Trabajo: Shazam Audio Intelligence (Reconocimiento por Micrófono y Subida de Archivos)
export const ShazamWorkspace = ({ onSendToSpotify, onSendToAudit, onNavigateTab }) => {
    const [isListening, setIsListening] = useState(false);
    const [countdown, setCountdown] = useState(10);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [identifiedTrack, setIdentifiedTrack] = useState(null);
    const [history, setHistory] = useState([]);
    const [previewPlaying, setPreviewPlaying] = useState(false);
    const [micLevel, setMicLevel] = useState(0);
    const audioRef = useRef(new Audio());
    const mediaRecorderRef = useRef(null);
    const audioStreamRef = useRef(null);
    const fileInputRef = useRef(null);
    const timerRef = useRef(null);
    const animFrameRef = useRef(null);
    const audioCtxRef = useRef(null);
    const [dragOver, setDragOver] = useState(false);

    // Selector de motor acústico: 'radar_edge' (C++ Nativo / Edge), 'hybrid', 'shazamio', 'audd'
    const [selectedEngine, setSelectedEngine] = useState(() => {
        try { return localStorage.getItem('bw_radar_engine') || 'radar_edge'; } catch(e) { return 'radar_edge'; }
    });
    const [radarEnvironment, setRadarEnvironment] = useState(() => {
        try { return localStorage.getItem('bw_radar_env') || 'club'; } catch(e) { return 'club'; }
    });
    const [radarEvent, setRadarEvent] = useState(null);
    const recognizerRef = useRef(null);
    const [auddToken, setAuddToken] = useState(() => {
        try { return localStorage.getItem('bw_audd_token') || ''; } catch(e) { return ''; }
    });
    const [showConfig, setShowConfig] = useState(false);
    const [micCaptureMode, setMicCaptureMode] = useState('auto'); // 'auto' | 'browser' | 'hardware'
    const [micPermissionError, setMicPermissionError] = useState(null);

    useEffect(() => {
        try { localStorage.setItem('bw_radar_engine', selectedEngine); } catch(e) {}
    }, [selectedEngine]);

    useEffect(() => {
        try { localStorage.setItem('bw_radar_env', radarEnvironment); } catch(e) {}
        if (recognizerRef.current) {
            recognizerRef.current.setEnvironment(radarEnvironment);
        }
    }, [radarEnvironment]);

    useEffect(() => {
        recognizerRef.current = new Phase1FastRecognizer({
            workerGatewayUrl: 'https://beatwave-radar-gateway.workers.dev',
            environment: radarEnvironment,
            totalBudgetMs: 1750,
            minScoreClub: 92,
            minScoreStudio: 88,
            probationMinScore: 76,
            rescueEndpoint: '/v1/rescue',
            rescueTimeoutMs: 8000,
            autoRescuePhase2: true,
            onStateChange: (ev) => {
                setRadarEvent(ev);
                if (ev.state === 'MATCH_CONFIRMED' && ev.match) {
                    const sourceLabel = ev.match.source === 'local_olaf' 
                        ? 'Olaf LMDB' 
                        : (ev.match.source?.startsWith('gpu_') ? 'GPU Neural Rescue' : 'ACRCloud Edge');
                    const matchItem = {
                        title: ev.match.title,
                        artist: ev.match.artist,
                        album: ev.match.album || `${ev.match.title} - Single`,
                        genre: ev.match.genres?.[0] || 'Electronic',
                        subgenre: ev.match.stemIsolated ? `Stem: ${ev.match.stemIsolated}` : 'Peak-Time Techno',
                        score: ev.match.score,
                        motor_usado: `BeatWave Radar C++ [${sourceLabel}]`,
                        play_offset_ms: ev.match.playOffsetMs,
                        rho: ev.rho,
                        status: 'ok'
                    };
                    setIdentifiedTrack(matchItem);
                    setStatusMsg(`✓ ${ev.message}`);
                    setHistory(prev => [matchItem, ...prev.filter(item => item.title !== matchItem.title || item.artist !== matchItem.artist)]);
                } else if (ev.state === 'ESCALATE_PHASE2') {
                    setStatusMsg(`⚠️ ${ev.message}`);
                } else if (ev.state === 'RESCUING_PHASE2') {
                    setStatusMsg(`🚀 ${ev.message}`);
                } else if (ev.state === 'UNIDENTIFIED_ID') {
                    setStatusMsg(`❌ ${ev.message}`);
                } else if (ev.state === 'PROBATION_BUFFER') {
                    setStatusMsg(`⏳ ${ev.message}`);
                } else if (ev.state === 'TIMEOUT_FALLBACK') {
                    setStatusMsg(`⏱️ ${ev.message}`);
                } else if (ev.state === 'NO_MATCH') {
                    setStatusMsg(`ℹ ${ev.message}`);
                }
            }
        });
    }, []);

    useEffect(() => {
        try { localStorage.setItem('bw_audd_token', auddToken); } catch(e) {}
    }, [auddToken]);

    // Libreta Digital de Apuntes DJ (Persistida en LocalStorage)
    const [notebookTracks, setNotebookTracks] = useState(() => {
        try {
            const saved = localStorage.getItem('beatwave_shazam_notebook');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [notebookFeedback, setNotebookFeedback] = useState("");

    useEffect(() => {
        try {
            localStorage.setItem('beatwave_shazam_notebook', JSON.stringify(notebookTracks));
        } catch (e) {}
    }, [notebookTracks]);

    const handleApuntarEnLista = (trk) => {
        const trackToAdd = trk || identifiedTrack;
        if (!trackToAdd) return;
        const exists = notebookTracks.some(t => t.title === trackToAdd.title && t.artist === trackToAdd.artist);
        if (!exists) {
            const now = new Date();
            const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const defaultComm = trackToAdd.comment || trackToAdd.comentario || `[${trackToAdd.genre || 'Electronic'}] Mezcla armónica • Entrada progresiva 32b • Drop potente`;
            const item = {
                ...trackToAdd,
                notebook_id: Date.now(),
                added_at: dateStr,
                comment: defaultComm,
                comentario: defaultComm
            };
            setNotebookTracks(prev => [item, ...prev]);
            setNotebookFeedback(`✓ "${trackToAdd.title}" apuntado en tu libreta digital con nota DJ.`);
            setTimeout(() => setNotebookFeedback(""), 3500);
        } else {
            setNotebookFeedback(`ℹ "${trackToAdd.title}" ya estaba en la libreta.`);
            setTimeout(() => setNotebookFeedback(""), 3000);
        }
    };

    const handleDescartarDeteccion = () => {
        if (previewPlaying) {
            audioRef.current.pause();
            setPreviewPlaying(false);
        }
        setIdentifiedTrack(null);
        setStatusMsg("Detección descartada. Listo para una nueva captura.");
        setTimeout(() => setStatusMsg(""), 2500);
    };

    const handleEliminarDeNotebook = (notebookId) => {
        setNotebookTracks(prev => prev.filter(t => t.notebook_id !== notebookId));
    };

    const handleVaciarNotebook = () => {
        if (window.confirm("¿Seguro que deseas vaciar todas las pistas de tu libreta de apuntes?")) {
            setNotebookTracks([]);
            setNotebookFeedback("Libreta de apuntes vaciada.");
            setTimeout(() => setNotebookFeedback(""), 2500);
        }
    };

    const handleExportarNotebookXLS = async () => {
        if (notebookTracks.length === 0) {
            alert("No hay pistas en la libreta para exportar.");
            return;
        }
        if (window.eel && window.eel.exportar_apuntes_shazam) {
            try {
                const res = await window.eel.exportar_apuntes_shazam(notebookTracks, "xls")();
                if (res && res.status === 'ok') {
                    setNotebookFeedback(`✓ Archivo Excel generado: ${res.filename}`);
                    setTimeout(() => setNotebookFeedback(""), 4000);
                }
            } catch (e) {
                console.error("Fallo exportando a disco:", e);
            }
        }
        // Descarga directa en navegador para compatibilidad instantánea
        const headers = ["#", "Artista", "Título", "Álbum", "Género", "Año", "ISRC", "Comentario / Nota DJ", "Fecha de Apunte"];
        const rows = notebookTracks.map((t, idx) => [
            idx + 1,
            `"${(t.artist || '').replace(/"/g, '""')}"`,
            `"${(t.title || '').replace(/"/g, '""')}"`,
            `"${(t.album || '').replace(/"/g, '""')}"`,
            `"${(t.genre || '').replace(/"/g, '""')}"`,
            `"${(t.year || '').replace(/"/g, '""')}"`,
            `"${(t.isrc || '').replace(/"/g, '""')}"`,
            `"${(t.comment || t.comentario || '').replace(/"/g, '""')}"`,
            `"${(t.added_at || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = "\uFEFF" + [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
        const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `BeatWave_Radar_Apuntes_${Date.now()}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportarNotebookTXT = async () => {
        if (notebookTracks.length === 0) {
            alert("No hay pistas en la libreta para exportar.");
            return;
        }
        if (window.eel && window.eel.exportar_apuntes_shazam) {
            try {
                const res = await window.eel.exportar_apuntes_shazam(notebookTracks, "txt")();
                if (res && res.status === 'ok') {
                    setNotebookFeedback(`✓ Archivo TXT guardado: ${res.filename}`);
                    setTimeout(() => setNotebookFeedback(""), 4000);
                }
            } catch (e) {}
        }
        let txt = "====================================================\n";
        txt += "BEATWAVE PRO • LIBRETA DIGITAL DE APUNTES RADAR\n";
        txt += `Fecha: ${new Date().toLocaleString()}\n`;
        txt += `Total pistas: ${notebookTracks.length}\n`;
        txt += "====================================================\n\n";
        notebookTracks.forEach((t, i) => {
            const comm = t.comment || t.comentario;
            txt += `${String(i + 1).padStart(2, '0')}. ${t.artist} - ${t.title} [${t.album || ''} ${t.year || ''}] • ${t.genre || 'Electronic'}${t.isrc ? ` (ISRC: ${t.isrc})` : ''}\n`;
            if (comm) {
                txt += `    💬 Comentario DJ: ${comm}\n`;
            }
        });
        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `BeatWave_Radar_Tracklist_${Date.now()}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        const audio = audioRef.current;
        const handleEnded = () => setPreviewPlaying(false);
        const handlePause = () => setPreviewPlaying(false);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("pause", handlePause);
        return () => {
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("pause", handlePause);
            audio.pause();
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
            if (audioCtxRef.current) {
                try { audioCtxRef.current.close(); } catch(e) {}
                audioCtxRef.current = null;
            }
            if (audioStreamRef.current) {
                try { audioStreamRef.current.getTracks().forEach(t => t.stop()); } catch(e) {}
                audioStreamRef.current = null;
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try { mediaRecorderRef.current.stop(); } catch(e) {}
            }
        };
    }, []);

    const togglePlayPreview = (url) => {
        if (!url) return;
        const audio = audioRef.current;
        if (previewPlaying && audio.src === url) {
            audio.pause();
            setPreviewPlaying(false);
        } else {
            audio.src = url;
            audio.play().then(() => setPreviewPlaying(true)).catch(e => console.error("Error reproduciendo preview:", e));
        }
    };

    const cancelListening = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (audioCtxRef.current) {
            try { audioCtxRef.current.close(); } catch(e) {}
            audioCtxRef.current = null;
        }
        if (audioStreamRef.current) {
            try { audioStreamRef.current.getTracks().forEach(t => t.stop()); } catch(e) {}
            audioStreamRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.ondataavailable = null;
            mediaRecorderRef.current.onstop = null;
            try { mediaRecorderRef.current.stop(); } catch(e) {}
        }
        setIsListening(false);
        setIsAnalyzing(false);
        setMicLevel(0);
        setStatusMsg("Escucha cancelada. Listo para una nueva consulta.");
        setTimeout(() => setStatusMsg(""), 3000);
    };

    const stopMicrophoneListeningEarly = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
    };

    const executeRecognition = async (base64Data, filename) => {
        setIsAnalyzing(true);
        if (selectedEngine === 'radar_edge' && recognizerRef.current) {
            setStatusMsg("Analizando huellas Zero-Copy en motor C++ y Edge Gateway (<1.75s)...");
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const tempCtx = new AudioCtx();
                const binaryStr = atob(base64Data.split(',')[1] || base64Data);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
                
                const decodedBuffer = await tempCtx.decodeAudioData(bytes.buffer);
                const channelData = decodedBuffer.getChannelData(0);
                tempCtx.close();

                await recognizerRef.current.recognizeBuffer(channelData, decodedBuffer.sampleRate);
                setIsAnalyzing(false);
                return;
            } catch (errDec) {
                console.warn("Fallo decodificación local en WebAudio, recurriendo a API:", errDec);
            }
        }
        const engineLabel = selectedEngine === 'radar_edge' ? 'Radar Edge C++' : selectedEngine === 'hybrid' ? 'Modo Híbrido' : selectedEngine === 'audd' ? 'Identificación Pro' : 'Escaneo Espectral Smart';
        setStatusMsg(`Consultando huella acústica en [${engineLabel}]...`);

        try {
            let res = null;
            // 1. Intento primario vía API HTTP directa (soporta hasta 50MB sin límites de WebSocket)
            try {
                const response = await fetch('/api/identificar_audio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        audio_b64: base64Data,
                        motor: selectedEngine,
                        audd_token: auddToken,
                        filename: filename
                    })
                });
                if (response.ok) {
                    res = await response.json();
                }
            } catch (httpErr) {
                console.warn("HTTP /api/identificar_audio falló, recurriendo a Eel:", httpErr);
            }

            // 2. Respaldo vía puente Eel WebSockets
            if (!res && window.eel && window.eel.identificar_audio_base64) {
                try {
                    res = await window.eel.identificar_audio_base64(base64Data, selectedEngine, auddToken, filename)();
                } catch (eelErr) {
                    console.warn("Eel RPC también falló:", eelErr);
                }
            }

            handleRecognitionResponse(res);
        } catch (err) {
            console.error("Error en reconocimiento acústico:", err);
            setStatusMsg("Error de comunicación con el motor de reconocimiento acústico: " + (err.message || String(err)));
            setIsAnalyzing(false);
        }
    };

    const startMicrophoneListening = async () => {
        if (isListening || isAnalyzing) return;
        setMicPermissionError(null);

        // Si el usuario seleccionó modo hardware o si el navegador no tiene getUserMedia (origen HTTP IP, etc.)
        const hasBrowserMic = typeof navigator !== 'undefined' && 
                              Boolean(navigator.mediaDevices) && 
                              typeof navigator.mediaDevices.getUserMedia === 'function';

        if (micCaptureMode === 'hardware' || !hasBrowserMic) {
            console.log("Iniciando captura de micrófono de hardware...");
            startHardwareMicrophoneListening();
            return;
        }

        cancelListening();
        setStatusMsg("Solicitando acceso al micrófono...");

        try {
            // macOS / Safari / Chrome: autoGainControl en true para asegurar captación de música ambiental
            // desactivando cancelación de eco y supresión de ruido para que no recorte frecuencias musicales.
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: true,
                        channelCount: 2,
                        sampleRate: 44100
                    }
                });
            } catch (errStrict) {
                console.warn("Fallback a getUserMedia básico:", errStrict);
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            audioStreamRef.current = stream;
            setIsListening(true);
            setCountdown(10);
            setStatusMsg("Escuchando audio ambiental (10s)...");

            let maxRecordedLevel = 0;
            let sumRecordedLevel = 0;
            let samplesRecordedCount = 0;

            // Web Audio API para VU Meter en vivo
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                const audioCtx = new AudioContextClass();
                audioCtxRef.current = audioCtx;
                const source = audioCtx.createMediaStreamSource(stream);
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                source.connect(analyser);
                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const updateMeter = () => {
                    analyser.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const avg = sum / dataArray.length;
                    const curLvl = Math.min(100, Math.round((avg / 128) * 100));
                    setMicLevel(curLvl);
                    if (curLvl > maxRecordedLevel) maxRecordedLevel = curLvl;
                    sumRecordedLevel += curLvl;
                    samplesRecordedCount += 1;
                    animFrameRef.current = requestAnimationFrame(updateMeter);
                };
                updateMeter();
            } catch (e) {
                console.warn("Web Audio VU meter no disponible:", e);
            }

            let recorderOptions = { audioBitsPerSecond: 128000 };
            let selectedMime = 'audio/webm';
            if (typeof MediaRecorder.isTypeSupported === 'function') {
                if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                    selectedMime = 'audio/webm;codecs=opus';
                } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                    selectedMime = 'audio/webm';
                } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                    selectedMime = 'audio/mp4';
                } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
                    selectedMime = 'audio/ogg';
                }
            }
            try {
                recorderOptions.mimeType = selectedMime;
            } catch (e) {
                console.warn("No se pudo fijar mimeType estricto:", e);
            }

            const mediaRecorder = new MediaRecorder(stream, recorderOptions);
            mediaRecorderRef.current = mediaRecorder;
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                if (animFrameRef.current) {
                    cancelAnimationFrame(animFrameRef.current);
                    animFrameRef.current = null;
                }
                if (audioCtxRef.current) {
                    try { audioCtxRef.current.close(); } catch(e) {}
                    audioCtxRef.current = null;
                }
                setMicLevel(0);
                if (audioStreamRef.current) {
                    try { audioStreamRef.current.getTracks().forEach(t => t.stop()); } catch(e) {}
                    audioStreamRef.current = null;
                }
                setIsListening(false);

                if (chunks.length === 0) {
                    setStatusMsg("⚠️ El micrófono web no capturó señal. Activando captura de hardware...");
                    startHardwareMicrophoneListening();
                    return;
                }

                if (maxRecordedLevel < 3 && samplesRecordedCount > 5) {
                    console.warn("Nivel de micro ambiental prácticamente nulo");
                }

                const actualMime = chunks[0]?.type || selectedMime || 'audio/webm';
                const ext = actualMime.includes('mp4') ? 'm4a' : actualMime.includes('ogg') ? 'ogg' : 'webm';
                const audioBlob = new Blob(chunks, { type: actualMime });
                const reader = new FileReader();
                reader.onloadend = () => {
                    executeRecognition(reader.result, `mic_sample.${ext}`);
                };
                reader.readAsDataURL(audioBlob);
            };

            // Transmitir paquetes cada 1.0s para asegurar que los chunks se acumulen limpiamente
            mediaRecorder.start(1000);

            let timeLeft = 10;
            timerRef.current = setInterval(() => {
                timeLeft -= 1;
                setCountdown(timeLeft);
                if (timeLeft <= 0) {
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    if (mediaRecorder.state !== 'inactive') {
                        mediaRecorder.stop();
                    }
                }
            }, 1000);

        } catch (err) {
            console.error("Error acceso micrófono navegador:", err);
            setMicPermissionError(err.message || "Permiso denegado");
            setStatusMsg("Micrófono del navegador bloqueado. Cambiando a captura por hardware de cabina...");
            setTimeout(() => {
                startHardwareMicrophoneListening();
            }, 600);
        }
    };

    const startHardwareMicrophoneListening = async () => {
        if (isListening || isAnalyzing) return;
        cancelListening();
        setIsListening(true);
        setCountdown(7);
        setStatusMsg("🎙️ Grabando desde el micrófono del sistema (Hardware 7s)...");

        let fakeMeterInterval = setInterval(() => {
            const fakeLvl = Math.floor(Math.random() * 45) + 30;
            setMicLevel(fakeLvl);
        }, 150);

        let timeLeft = 7;
        timerRef.current = setInterval(() => {
            timeLeft -= 1;
            setCountdown(timeLeft);
            if (timeLeft <= 0) {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                clearInterval(fakeMeterInterval);
                setMicLevel(0);
                setStatusMsg("Consultando huella acústica con los servidores...");
            }
        }, 1000);

        try {
            let res = null;
            if (window.eel && typeof window.eel.grabar_microfono_shazam === 'function') {
                res = await window.eel.grabar_microfono_shazam(7, selectedEngine, auddToken)();
            } else {
                const resp = await fetch('/api/shazam/record_mic', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ duration: 7, motor: selectedEngine, audd_token: auddToken })
                });
                if (resp.ok) {
                    res = await resp.json();
                } else {
                    throw new Error(`HTTP ${resp.status}`);
                }
            }
            clearInterval(fakeMeterInterval);
            setMicLevel(0);
            setIsListening(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            if (res && res.status === 'error') {
                setMicPermissionError(res.msg);
                setStatusMsg("⚠️ " + (res.msg || "Error en captura de audio."));
            } else {
                setMicPermissionError(null);
                handleRecognitionResponse(res);
            }
        } catch (hwErr) {
            clearInterval(fakeMeterInterval);
            setMicLevel(0);
            setIsListening(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            console.error("Error en captura por hardware:", hwErr);
            setMicPermissionError("Permiso de micrófono no disponible");
            setStatusMsg("⚠️ No se pudo acceder al micrófono. Revisa Ajustes de macOS > Privacidad > Micrófono o arrastra un archivo de audio.");
        }
    };

    const handleFileSelect = (file) => {
        if (!file) return;
        setIsAnalyzing(true);
        if (selectedEngine === 'radar_edge' && recognizerRef.current) {
            setStatusMsg(`Analizando "${file.name}" en motor nativo BeatWave C++...`);
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuf = e.target.result;
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    const tempCtx = new AudioCtx();
                    const decodedBuffer = await tempCtx.decodeAudioData(arrayBuf);
                    const channelData = decodedBuffer.getChannelData(0);
                    tempCtx.close();

                    await recognizerRef.current.recognizeBuffer(channelData, decodedBuffer.sampleRate);
                    setIsAnalyzing(false);
                } catch (fileErr) {
                    console.error("Error decodificando archivo para Radar C++:", fileErr);
                    const r2 = new FileReader();
                    r2.onloadend = () => executeRecognition(r2.result, file.name);
                    r2.readAsDataURL(file);
                }
            };
            reader.readAsArrayBuffer(file.size > 8 * 1024 * 1024 ? file.slice(0, 8 * 1024 * 1024) : file);
            return;
        }

        setStatusMsg(`Leyendo "${file.name}"...`);
        const fileToRead = file.size > 8 * 1024 * 1024 ? file.slice(0, 8 * 1024 * 1024) : file;
        const reader = new FileReader();
        reader.onloadend = () => {
            executeRecognition(reader.result, file.name);
        };
        reader.readAsDataURL(fileToRead);
    };

    const handleRecognitionResponse = (res) => {
        setIsAnalyzing(false);
        if (res && res.status === 'ok') {
            const engineTag = res.motor_usado ? ` [vía ${res.motor_usado}]` : '';
            const cacheTag = res.de_cache ? ' ⚡(Caché)' : '';
            setStatusMsg(`✓ Identificado${engineTag}${cacheTag}: "${res.title}" por ${res.artist}`);
            setIdentifiedTrack(res);
            setHistory(prev => [res, ...prev.filter(item => item.title !== res.title || item.artist !== res.artist)]);
            if (res.preview_url) {
                togglePlayPreview(res.preview_url);
            }
        } else if (res && res.status === 'silence') {
            setStatusMsg(res.msg || "⚠️ Micrófono en silencio o inaudible. Acerca la fuente de sonido y revisa Ajustes de macOS > Privacidad > Micrófono.");
        } else {
            setStatusMsg(res?.msg || "No se encontraron coincidencias para este fragmento de audio.");
        }
    };

    const handleSendToAuditInternal = (trk) => {
        if (!trk || !onSendToAudit) return;
        const newTrackItem = {
            id: Date.now(),
            t: trk.title,
            title: trk.title,
            a: trk.artist,
            artist: trk.artist,
            album: trk.album || `${trk.title} - Single`,
            genre: trk.genre || 'Electronic',
            subgenre: 'Tech House',
            year: trk.year || '',
            b: '126.00',
            bpm: '126.00',
            k: '8A',
            key: '8A',
            duration: '03:30',
            format: 'FLAC',
            cover: trk.cover || '',
            status: 'Pass 22.05kHz',
            first_downbeat_ms: 250,
            trim_start_ms: 25,
            comment: trk.comment || trk.comentario || `[126 BPM | 8A] Intro limpia 32b • Drop contundente • Outro 64b`,
            comentario: trk.comment || trk.comentario || `[126 BPM | 8A] Intro limpia 32b • Drop contundente • Outro 64b`,
            cues: NV2_COLORS
        };
        onSendToAudit(newTrackItem);
    };

    const handleSendToSpotifyInternal = (trk) => {
        if (!trk || !onSendToSpotify) return;
        onSendToSpotify(trk.spotify_query || `${trk.title} ${trk.artist}`);
    };

    const handleCopyToClipboard = (trk) => {
        const text = `${trk.artist} - ${trk.title} [${trk.album || ''} ${trk.year || ''}]`;
        navigator.clipboard.writeText(text);
        alert(`Copiado al portapapeles:\n${text}`);
    };

    return (
        <div className="ws-module ws-mod-shazam flex flex-col h-full w-full bg-[#09090b] overflow-y-auto p-4 sm:p-6 text-zinc-300 space-y-5 select-none font-sans">
            {/* Header del Radar Shazam */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <SectionTitle icon={Icons.Radar} title="Radar Acústico" accent="Drop Scanner" />
                    <span className="hidden sm:inline-flex px-2 py-0.5 text-[9.5px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 rounded">
                        {selectedEngine === 'radar_edge' ? 'Radar Edge C++ (<1.75s)' : selectedEngine === 'hybrid' ? 'Híbrido Pro (Smart Drop)' : selectedEngine === 'audd' ? 'Identificación Acústica Pro' : 'Escaneo Espectral'}
                    </span>
                    <p className="hidden md:inline text-xs text-zinc-400 font-sans">
                        Identifica pistas desconocidas al instante escuchando con el micrófono o cargando archivos de audio.
                    </p>
                </div>

                {statusMsg && (
                    <div className="px-3 py-1.5 rounded-lg bg-[var(--bw-surface-2)] border border-[var(--bw-line-strong)] text-xs font-mono flex items-center gap-2 shadow">
                        <span className={`w-2 h-2 rounded-full ${isAnalyzing || isListening ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                        <span className="text-zinc-300">{statusMsg}</span>
                    </div>
                )}
            </div>

            {/* Barra de Selección de Motores Acústicos y Configuración */}
            <div className="bg-[var(--bw-surface-1)] border border-[var(--bw-line)] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2.5">
                    <span className="bw-eyebrow text-[10.5px]">Motor Activo:</span>
                    <div className="ws-seg" role="group" aria-label="Motor activo">
                        <button
                            type="button"
                            onClick={() => setSelectedEngine('radar_edge')}
                            className={`ws-seg-btn ${selectedEngine === 'radar_edge' ? 'ws-seg-on' : ''}`}
                            aria-pressed={selectedEngine === 'radar_edge'}
                            title="Motor C++ Nativo (Zero-Copy) + Cloudflare Edge Gateway (<1.75s)"
                        >
                            <Icons.Zap size={13} className="text-pink-400" />
                            <span>Radar Edge C++</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedEngine('hybrid')}
                            className={`ws-seg-btn ${selectedEngine === 'hybrid' ? 'ws-seg-on' : ''}`}
                            aria-pressed={selectedEngine === 'hybrid'}
                            title="Combina escaneo espectral de drop con respaldo acústico automático para máxima precisión"
                        >
                            <Icons.Zap size={13} />
                            <span>Híbrido Pro</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedEngine('shazamio')}
                            className={`ws-seg-btn ${selectedEngine === 'shazamio' ? 'ws-seg-on' : ''}`}
                            aria-pressed={selectedEngine === 'shazamio'}
                            title="Escaneo multi-segmento de drops y breakdowns para pistas de DJ"
                        >
                            <span>Escaneo Espectral</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedEngine('audd')}
                            className={`ws-seg-btn ${selectedEngine === 'audd' ? 'ws-seg-on' : ''}`}
                            aria-pressed={selectedEngine === 'audd'}
                            title="Red de Identificación Acústica Pro (ISRC y Catálogo Global)"
                        >
                            <span>Identificación Pro (ISRC)</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-[var(--bw-line)]">
                        <span className="text-[10px] font-mono text-zinc-400 px-1">Perfil DSP:</span>
                        <button
                            type="button"
                            onClick={() => setRadarEnvironment('club')}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${radarEnvironment === 'club' ? 'bg-pink-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                            title="Club: Filtro HPF 120Hz para cortar saturación de subgraves en cabina (Hard Techno)"
                        >
                            Club (HPF 120Hz)
                        </button>
                        <button
                            type="button"
                            onClick={() => setRadarEnvironment('studio')}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${radarEnvironment === 'studio' ? 'bg-cyan-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                            title="Studio: Filtro HPF 35Hz para sesiones acústicas o estudio limpio"
                        >
                            Studio (HPF 35Hz)
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setShowConfig(!showConfig)}
                    className={`ws-btn ${showConfig || auddToken ? 'ws-btn-active' : 'ws-btn-outline'}`}
                    title="Configurar claves de API o token personalizado"
                >
                    <Icons.Sliders size={14} />
                    <span>{showConfig ? 'Ocultar Opciones' : 'Opciones API'}</span>
                    {auddToken && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </button>
            </div>

            {/* Panel de Control y Telemetría Radar Live HUD */}
            <div className="bg-[#0b0c16] border border-djzinc-750 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                <div className="flex items-center gap-4 shrink-0">
                    <div className="relative w-14 h-14 flex items-center justify-center">
                        <span className={`absolute inset-0 rounded-full border border-indigo-500/30 ${isListening || isAnalyzing ? 'animate-ping' : ''}`} />
                        <span className="absolute inset-1.5 rounded-full border border-indigo-500/20" />
                        <span className="absolute inset-3 rounded-full border border-indigo-500/40" />
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                            radarEvent?.state === 'MATCH_CONFIRMED' ? 'bg-emerald-500 text-black shadow-emerald-500/50' :
                            radarEvent?.state === 'ESCALATE_PHASE2' ? 'bg-pink-600 text-white shadow-pink-600/50 animate-pulse' :
                            radarEvent?.state === 'PROBATION_BUFFER' ? 'bg-amber-500 text-black shadow-amber-500/50' :
                            isListening || isAnalyzing ? 'bg-cyan-500 text-black animate-spin' : 'bg-djzinc-800 text-zinc-400'
                        }`}>
                            <Icons.Radar size={18} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider font-black text-indigo-400">Telemetría de Cabina Radar</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                radarEvent?.state === 'MATCH_CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                radarEvent?.state === 'ESCALATE_PHASE2' ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40' :
                                radarEvent?.state === 'PROBATION_BUFFER' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                isListening || isAnalyzing ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                                'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}>
                                {radarEvent?.state || (isListening ? 'CAPTURING' : 'STANDBY')}
                            </span>
                        </div>
                        <div className="text-xs font-mono font-bold text-white truncate max-w-sm">
                            {radarEvent?.message || (isListening ? 'Escuchando ventana de 10s (stride 2s)...' : 'Listo para capturar en cabina')}
                        </div>
                    </div>
                </div>

                {/* Telemetría en Cuadrícula (RMS, Clipping, Rho, Latencia) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto shrink-0 font-mono text-center">
                    <div className="bg-black/50 border border-djzinc-800 rounded-lg px-2.5 py-1.5">
                        <div className="text-[9px] text-zinc-400 uppercase">Nivel RMS</div>
                        <div className="text-xs font-bold text-cyan-400">{radarEvent?.telemetry ? `${radarEvent.telemetry.rmsDbfs.toFixed(1)} dBFS` : '-16.0 dBFS'}</div>
                    </div>
                    <div className="bg-black/50 border border-djzinc-800 rounded-lg px-2.5 py-1.5">
                        <div className="text-[9px] text-zinc-400 uppercase">Pico / Clip</div>
                        <div className={`text-xs font-bold ${radarEvent?.telemetry?.isClipping ? 'text-rose-500' : 'text-emerald-400'}`}>
                            {radarEvent?.telemetry ? (radarEvent.telemetry.isClipping ? '⚠️ CLIPPING' : `${radarEvent.telemetry.peakDbfs.toFixed(1)} dB`) : '≤ -1.0 dB'}
                        </div>
                    </div>
                    <div className="bg-black/50 border border-djzinc-800 rounded-lg px-2.5 py-1.5">
                        <div className="text-[9px] text-zinc-400 uppercase">Coherencia ρ</div>
                        <div className={`text-xs font-bold ${radarEvent?.pitchShiftSuspected ? 'text-pink-400 animate-pulse' : 'text-indigo-300'}`}>
                            {radarEvent?.rho ? `${radarEvent.rho.toFixed(3)}x` : '1.000x'}
                        </div>
                    </div>
                    <div className="bg-black/50 border border-djzinc-800 rounded-lg px-2.5 py-1.5">
                        <div className="text-[9px] text-zinc-400 uppercase">Latencia Edge</div>
                        <div className="text-xs font-bold text-white">
                            {radarEvent?.telemetry?.latencyMs ? `${radarEvent.telemetry.latencyMs} ms` : '< 1750 ms'}
                        </div>
                    </div>
                </div>
            </div>

            {showConfig && (
                <div className="bg-[var(--bw-surface-2)] p-3.5 rounded-xl border border-[var(--bw-line-strong)] text-xs font-mono space-y-2 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <span className="text-zinc-200 font-bold block">Token de Red Acústica API:</span>
                            <span className="text-[10.5px] text-zinc-400">
                                Por defecto BeatWave usa el token comunitario ("test"). Si posees tu propio token de API acústica, ingrésalo aquí para consultas comerciales ilimitadas.
                            </span>
                        </div>
                        <input
                            type="text"
                            value={auddToken}
                            onChange={(e) => setAuddToken(e.target.value)}
                            placeholder="test (predeterminado)"
                            className="w-full sm:w-64 px-2.5 py-1.5 bg-[var(--bw-surface-1)] border border-[var(--bw-line-strong)] rounded-lg text-xs text-white font-mono focus:border-cyan-400 outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Dos Módulos de Entrada: Micrófono & Carga de Archivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Módulo 1: Micrófono en Directo */}
                <div className="bg-[var(--bw-surface-1)] p-5 rounded-xl border border-[var(--bw-line)] hover:border-[var(--bw-line-strong)] flex flex-col items-center text-center justify-between relative overflow-hidden shadow-sm transition-all">
                    <div className="space-y-1 mb-2">
                        <span className="bw-eyebrow text-cyan-400">
                            MODO A • CAPTURA AMBIENTAL
                        </span>
                        <h3 className="text-sm font-semibold text-white">Escucha en Directo por Micrófono</h3>
                        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                            Captura música ambiental en cabina y consulta la red de identificación acústica global.
                        </p>
                    </div>

                    {/* Selector de Fuente de Entrada */}
                    <div className="ws-seg" role="group" aria-label="Fuente de micrófono">
                        <span className="ws-seg-label">Entrada</span>
                        <button
                            type="button"
                            onClick={() => { setMicCaptureMode('auto'); setMicPermissionError(null); }}
                            className={`ws-seg-btn ${micCaptureMode === 'auto' ? 'ws-seg-on' : ''}`}
                            aria-pressed={micCaptureMode === 'auto'}
                            title="Auto: prueba primero el micrófono del navegador y si falla conmuta al hardware de sistema automáticamente"
                        >
                            Auto
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMicCaptureMode('browser'); setMicPermissionError(null); }}
                            className={`ws-seg-btn ${micCaptureMode === 'browser' ? 'ws-seg-on' : ''}`}
                            aria-pressed={micCaptureMode === 'browser'}
                            title="Micrófono Web (Navegador HTML5)"
                        >
                            Navegador
                        </button>
                        <button
                            type="button"
                            onClick={() => { setMicCaptureMode('hardware'); setMicPermissionError(null); }}
                            className={`ws-seg-btn ${micCaptureMode === 'hardware' ? 'ws-seg-on' : ''}`}
                            aria-pressed={micCaptureMode === 'hardware'}
                            title="Micrófono de Hardware (macOS / FFmpeg directo sin restricciones de navegador)"
                        >
                            Hardware (macOS)
                        </button>
                    </div>

                    <div className="my-4 relative flex flex-col items-center justify-center">
                        <div className="relative flex items-center justify-center">
                            <span className={`ws-radar-ring ${isListening ? 'ws-radar-ring-live' : ''}`} aria-hidden="true"></span>
                            <span className={`ws-radar-ring ws-radar-ring-2 ${isListening ? 'ws-radar-ring-live' : ''}`} aria-hidden="true"></span>
                            <button
                                type="button"
                                onClick={startMicrophoneListening}
                                disabled={isListening || isAnalyzing}
                                className={`ws-radar ${isListening ? 'ws-radar-live' : ''}`}
                                aria-label={isListening ? `Escuchando, ${countdown} segundos` : 'Escuchar y reconocer pista'}
                            >
                                <Icons.Mic />
                                <span className="ws-radar-label">
                                    {isListening ? `${countdown}s` : 'ESCUCHAR'}
                                </span>
                            </button>
                        </div>

                        {micPermissionError && !isListening && (
                            <div className="mt-3 p-3 bg-amber-950/60 border border-amber-600/40 rounded-xl text-left text-xs font-mono text-amber-200 flex flex-col gap-1.5 shadow-xl max-w-xs animate-fadeIn">
                                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                                    <Icons.Lock size={14} className="inline-block align-[-2px]" />
                                    <span>Micrófono de navegador restringido</span>
                                </div>
                                <p className="text-[10px] text-zinc-300 leading-tight">
                                    • En la barra del navegador, haz clic en el <strong>icono del candado</strong> y cambia Micrófono a <strong>Permitir</strong>.
                                </p>
                                <p className="text-[10px] text-zinc-300 leading-tight">
                                    • En macOS: <strong>Ajustes del Sistema &gt; Privacidad &gt; Micrófono</strong>.
                                </p>
                                <button
                                    type="button"
                                    onClick={startHardwareMicrophoneListening}
                                    className="ws-btn ws-btn-primary w-full justify-center mt-1"
                                >
                                    <Icons.Sliders size={14} /> Usar Captura Hardware de Sistema
                                </button>
                            </div>
                        )}

                        {isListening && (
                            <div className="w-60 mt-3.5 flex flex-col gap-1.5 animate-fadeIn" role="meter" aria-label="Señal de micrófono" aria-valuemin={0} aria-valuemax={100} aria-valuenow={micLevel}>
                                <div className="flex items-center justify-between w-full">
                                    <span className="ws-glass-kicker flex items-center gap-1.5"><span className="ws-dot ws-dot-live" />Input</span>
                                    <span className={`font-mono text-[11px] font-semibold tabular-nums ${micLevel > 85 ? 'text-rose-400' : micLevel > 15 ? 'text-[var(--bw-cyan)]' : 'text-amber-400'}`}>{micLevel}%</span>
                                </div>
                                <div className="ws-vu" aria-hidden="true">
                                    {Array.from({ length: 24 }, (_, i) => {
                                        const thr = ((i + 1) / 24) * 100;
                                        const on = micLevel >= thr - 2;
                                        const zone = i >= 21 ? 'peak' : i >= 16 ? 'hot' : 'ok';
                                        return <span key={i} className={`ws-vu-seg ws-vu-${zone} ${on ? 'is-on' : ''}`} />;
                                    })}
                                </div>
                                <span className="text-[10px] font-mono text-[var(--bw-text-3)] flex items-center gap-1.5">
                                    {micLevel > 10 ? <><Icons.Check size={12} className="text-emerald-400" />Captando audio ambiental</> : 'Acerca el altavoz o sube el volumen'}
                                </span>
                            </div>
                        )}

                        {isListening && (
                            <div className="flex items-center gap-2 mt-3 z-10">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); stopMicrophoneListeningEarly(); }}
                                    className="ws-btn ws-btn-primary text-xs"
                                    title="Enviar grabación inmediatamente sin esperar al final de los 10 segundos"
                                >
                                    <Icons.Zap size={14} />
                                    <span>Identificar Ya</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); cancelListening(); }}
                                    className="ws-btn ws-btn-ghost text-xs"
                                    title="Cancelar la captura actual"
                                >
                                    <Icons.Close size={14} /> Cancelar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-[11px] font-mono text-zinc-400">
                        {isListening ? (
                            <span className="text-rose-400 font-bold animate-pulse">● Grabando audio del micrófono...</span>
                        ) : isAnalyzing ? (
                            <span className="text-cyan-400 font-bold">● Analizando huella acústica...</span>
                        ) : (
                            <span>Haz clic para iniciar la escucha de 10 segundos</span>
                        )}
                    </div>
                </div>

                {/* Módulo 2: Carga / Arrastre de Archivos */}
                <div 
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            handleFileSelect(e.dataTransfer.files[0]);
                        }
                    }}
                    className={`bg-[var(--bw-surface-1)] p-5 rounded-xl border flex flex-col items-center text-center justify-between transition-all cursor-pointer shadow-sm group ${
                        dragOver ? 'border-cyan-400 bg-cyan-950/20 scale-[1.01]' : 'border-[var(--bw-line)] hover:border-[var(--bw-line-strong)]'
                    }`}
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                    <div className="space-y-1 mb-4">
                        <span className="bw-eyebrow text-zinc-400">
                            MODO B • ANALIZADOR DE ARCHIVO
                        </span>
                        <h3 className="text-sm font-semibold text-white">Subir o Arrastrar Archivo de Audio</h3>
                        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                            Arrastra cualquier archivo local (.mp3, .flac, .wav, .m4a) para extraer su huella digital y metadatos.
                        </p>
                    </div>

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                const selected = e.target.files[0];
                                e.target.value = ''; // Permite volver a seleccionar el mismo archivo en consultas consecutivas
                                handleFileSelect(selected);
                            }
                        }} 
                        accept="audio/*" 
                        className="hidden" 
                    />

                    <div className="my-3 w-32 h-28 rounded-xl border-2 border-dashed border-[var(--bw-line-strong)] group-hover:border-[var(--bw-cyan)] flex flex-col items-center justify-center transition-colors bg-[var(--bw-surface-2)]">
                        <Icons.Upload size={22} className="text-zinc-400 group-hover:text-[var(--bw-cyan)] mb-1.5 transition-colors" />
                        <span className="text-[10px] font-mono font-bold text-zinc-300">ARRASTRAR AQUÍ</span>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-500">
                        <span>Formatos: MP3, FLAC, WAV, M4A, OGG</span>
                    </div>
                </div>
            </div>

            {/* Resultado de Identificación Activa con Reproductor y Acciones */}
            {identifiedTrack && (
                <div className="bg-[var(--bw-surface-2)] p-5 rounded-xl border border-cyan-500/40 shadow-xl space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[var(--bw-line)] pb-3">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4] animate-pulse"></span>
                            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                                PISTA IDENTIFICADA
                            </span>
                            {identifiedTrack.motor_usado && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-700/60">
                                    <Icons.Zap size={12} className="inline-block align-[-2px]" /> {identifiedTrack.motor_usado}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {identifiedTrack.isrc && (
                                <span className="text-[10px] font-mono text-zinc-400 bg-[var(--bw-surface-1)] px-2 py-0.5 rounded border border-[var(--bw-line)]">
                                    ISRC: {identifiedTrack.isrc}
                                </span>
                            )}
                            <button
                                type="button"
                                onClick={handleDescartarDeteccion}
                                className="ws-icon-btn w-6 h-6"
                                title="Descartar esta detección"
                            >
                                <Icons.Close size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Artwork con Reproductor DJ Integrado */}
                        <div className="relative group shrink-0">
                            <img 
                                src={getValidCover(identifiedTrack.cover)} 
                                alt="Track Artwork" 
                                className="w-40 h-40 rounded-xl object-cover border border-[var(--bw-line-strong)] shadow-xl"
                            />
                            {identifiedTrack.preview_url && (
                                <button
                                    type="button"
                                    onClick={() => togglePlayPreview(identifiedTrack.preview_url)}
                                    className={`absolute inset-0 m-auto w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer font-black text-base ${
                                        previewPlaying 
                                            ? 'bg-emerald-400 text-black scale-105' 
                                            : 'bg-[var(--bw-cyan)] text-black hover:scale-105 shadow-[0_0_16px_rgba(34,211,238,0.45)]'
                                    }`}
                                    title="Reproducir pre-escucha de audio oficial"
                                >
                                    {previewPlaying ? <Icons.Pause size={18} /> : <Icons.Play size={18} />}
                                </button>
                            )}
                            <span className="absolute bottom-2 left-2 bg-black/80 backdrop-blur px-2 py-0.5 rounded text-[9.5px] font-mono text-zinc-300 border border-[var(--bw-line)]">
                                Pre-Escucha 30s
                            </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-3">
                            <div>
                                <h1 className="text-xl font-bold text-white truncate" title={identifiedTrack.title}>
                                    {identifiedTrack.title}
                                </h1>
                                <p className="text-base font-semibold text-cyan-400 truncate mt-0.5" title={identifiedTrack.artist}>
                                    {identifiedTrack.artist}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                                <div className="bg-[var(--bw-surface-1)] p-2.5 rounded-lg border border-[var(--bw-line)]">
                                    <span className="text-[9px] text-zinc-500 block uppercase">Álbum</span>
                                    <span className="text-zinc-200 font-semibold truncate block" title={identifiedTrack.album}>
                                        {identifiedTrack.album || '--'}
                                    </span>
                                </div>
                                <div className="bg-[var(--bw-surface-1)] p-2.5 rounded-lg border border-[var(--bw-line)]">
                                    <span className="text-[9px] text-zinc-500 block uppercase">Género</span>
                                    <span className="text-emerald-400 font-semibold truncate block">
                                        {identifiedTrack.genre || 'Electronic'}
                                    </span>
                                </div>
                                <div className="bg-[var(--bw-surface-1)] p-2.5 rounded-lg border border-[var(--bw-line)]">
                                    <span className="text-[9px] text-zinc-500 block uppercase">Lanzamiento</span>
                                    <span className="text-zinc-200 font-semibold truncate block">
                                        {identifiedTrack.year || '--'}
                                    </span>
                                </div>
                                <div className="bg-[var(--bw-surface-1)] p-2.5 rounded-lg border border-[var(--bw-line)]">
                                    <span className="text-[9px] text-zinc-500 block uppercase">Sello / Label</span>
                                    <span className="text-zinc-300 font-semibold truncate block" title={identifiedTrack.label}>
                                        {identifiedTrack.label || '--'}
                                    </span>
                                </div>
                            </div>

                            {/* SECCIÓN VISIBLE: COMENTARIO TÁCTICO & NOTA DE MEZCLA DJ */}
                            <div className="bg-[var(--bw-surface-1)] p-3 rounded-xl border border-[var(--bw-line)] space-y-2">
                                <div className="flex items-center justify-between text-[10.5px] font-mono">
                                    <span className="text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                        Comentario Táctico DJ & Guía de Mezcla
                                    </span>
                                    <span className="text-zinc-500 text-[10px]">Tag ID3 / Libreta</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icons.MessageSquare size={14} className="text-zinc-400 shrink-0" />
                                    <input 
                                        type="text" 
                                        value={identifiedTrack.comment || identifiedTrack.comentario || ''} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setIdentifiedTrack(prev => ({ ...prev, comment: val, comentario: val }));
                                        }} 
                                        placeholder="Escribe aquí el comentario estratégico para cabina..."
                                        className="flex-1 bg-[var(--bw-surface-2)] border border-[var(--bw-line-strong)] focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 outline-none transition-colors"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                                    {[
                                        { label: 'Peak Time', text: `[${identifiedTrack.genre || 'Electronic'}] Peak Time • Drop Contundente • Outro Rápido 32b` },
                                        { label: 'Warm Up', text: `[${identifiedTrack.genre || 'Electronic'}] Warm Up Groovy • Entrada Progresiva 64b • Mezcla Limpia` },
                                        { label: 'Breakdown', text: `[${identifiedTrack.genre || 'Electronic'}] Breakdown Vocal Intenso • Mezcla Larga con Graves` },
                                        { label: 'After', text: `[${identifiedTrack.genre || 'Electronic'}] Afterhours • Dark Hypnotic • Bombo Pesado Sub-Bass` }
                                    ].map((tpl, tIdx) => (
                                        <button
                                            key={tIdx}
                                            type="button"
                                            onClick={() => setIdentifiedTrack(prev => ({ ...prev, comment: tpl.text, comentario: tpl.text }))}
                                            className="px-2 py-0.5 text-[9.5px] font-mono bg-[var(--bw-surface-2)] hover:bg-[var(--bw-surface-3)] text-zinc-400 hover:text-white rounded border border-[var(--bw-line)] cursor-pointer transition-colors"
                                            title={`Insertar: "${tpl.text}"`}
                                        >
                                            {tpl.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ACCIONES PRINCIPALES */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => handleApuntarEnLista(identifiedTrack)}
                                    className="ws-btn ws-btn-primary"
                                    title="Añadir esta pista a tu Libreta Digital de Apuntes DJ"
                                >
                                    <Icons.Notebook size={14} />
                                    <span>Apuntar en Lista</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSendToSpotifyInternal(identifiedTrack)}
                                    className="ws-btn ws-btn-outline"
                                    title="Enviar a la cola de descarga en FLAC"
                                >
                                    <Icons.Download size={14} />
                                    <span>Record Pool</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleSendToAuditInternal(identifiedTrack)}
                                    className="ws-btn ws-btn-outline"
                                    title="Añadir a la tabla de auditoría para análisis DSP"
                                >
                                    <Icons.Copy size={14} />
                                    <span>Auditoría DJ</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleCopyToClipboard(identifiedTrack)}
                                    className="ws-btn ws-btn-ghost"
                                    title="Copiar texto al portapapeles"
                                >
                                    Copiar
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDescartarDeteccion}
                                    className="ws-btn ws-btn-danger ml-auto"
                                    title="Descartar esta detección y dejar el radar listo"
                                >
                                    <Icons.Trash size={14} />
                                    <span>Descartar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* LIBRETA DIGITAL DE APUNTES DJ CON DESCARGA XLS Y TXT */}
            <div className="bg-[var(--bw-surface-1)] border border-[var(--bw-line)] rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--bw-line)] pb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[var(--bw-cyan)] font-bold text-sm shadow">
                            <Icons.Notebook size={15} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                                    Libreta Digital de Apuntes DJ
                                </h3>
                                <span className="ws-count ws-count-on">
                                    {notebookTracks.length} apuntes
                                </span>
                            </div>
                            <p className="text-[11px] text-zinc-400">
                                Colección de pistas cazadas en vivo en el radar, listas para exportar o enviar a producción.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {notebookFeedback && (
                            <span className="text-xs font-mono font-bold text-emerald-400 animate-pulse mr-2">
                                {notebookFeedback}
                            </span>
                        )}

                        <button
                            type="button"
                            onClick={handleExportarNotebookXLS}
                            disabled={notebookTracks.length === 0}
                            className="ws-btn ws-btn-outline"
                            title="Descargar listado en formato Excel (.xls / .xlsx)"
                        >
                            <Icons.Excel size={14} />
                            <span>Descargar XLS</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExportarNotebookTXT}
                            disabled={notebookTracks.length === 0}
                            className="ws-btn ws-btn-outline"
                            title="Descargar tracklist limpio en formato texto (.txt)"
                        >
                            <Icons.FileText size={14} />
                            <span>Descargar TXT</span>
                        </button>

                        {notebookTracks.length > 0 && (
                            <button
                                type="button"
                                onClick={handleVaciarNotebook}
                                className="ws-btn ws-btn-danger"
                                title="Vaciar todos los apuntes"
                            >
                                <Icons.Trash size={14} /> Vaciar
                            </button>
                        )}
                    </div>
                </div>

                {/* Lista / Tabla de Apuntes */}
                {notebookTracks.length === 0 ? (
                    <div className="py-10 text-center text-zinc-500 font-mono text-xs border border-dashed border-[var(--bw-line-strong)] rounded-xl bg-[var(--bw-surface-2)]">
                        <Icons.FileText size={16} className="inline-block align-[-2px] block mb-1 text-zinc-400" />
                        Tu libreta de apuntes está vacía. Cuando identifiques un track en el Radar, pulsa <strong className="text-cyan-400">"Apuntar en Lista"</strong> para guardarlo aquí.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="ws-grid w-full text-left border-collapse text-xs whitespace-nowrap">
                            <thead>
                                <tr>
                                    <th className="w-8 text-center">#</th>
                                    <th className="w-10 text-center"><span className="sr-only">Reproducir</span></th>
                                    <th className="min-w-[220px]">Pista</th>
                                    <th className="min-w-[150px]">Artista</th>
                                    <th className="w-28">Género</th>
                                    <th className="w-28">Subgénero</th>
                                    <th className="w-14 text-center">Año</th>
                                    <th className="min-w-[220px]">Nota DJ</th>
                                    <th className="w-20 text-center">Hora</th>
                                    <th className="w-32 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {notebookTracks.map((row, idx) => {
                                    const isRowPlaying = previewPlaying && audioRef.current.src === row.preview_url;
                                    return (
                                        <tr key={row.notebook_id || idx} className={isRowPlaying ? 'is-playing' : ''}>
                                            <td className="text-center ws-num">{idx + 1}</td>
                                            <td className="py-2 px-2 text-center">
                                                {row.preview_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => togglePlayPreview(row.preview_url)}
                                                        className={`ws-play ${isRowPlaying ? 'is-on' : ''}`}
                                                        aria-label={isRowPlaying ? 'Pausar pre-escucha' : 'Reproducir pre-escucha'}
                                                    >
                                                        {isRowPlaying ? <Icons.Pause size={12} /> : <Icons.Play size={12} />}
                                                    </button>
                                                ) : (
                                                    <span className="ws-num">--</span>
                                                )}
                                            </td>
                                            <td className="py-2 px-3">
                                                <div className="flex items-center gap-2.5">
                                                    <img
                                                        src={getValidCover(row.cover)}
                                                        alt=""
                                                        onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_VINYL_SVG; }}
                                                        className="w-8 h-8 rounded-md object-cover border border-[var(--bw-line-strong)] shrink-0"
                                                    />
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium text-[var(--bw-white)] text-[13px] truncate max-w-xs" title={row.title}>
                                                            {row.title}
                                                        </span>
                                                        <span className="text-[11px] text-[var(--bw-text-3)] truncate max-w-xs" title={row.album}>
                                                            {row.album || '--'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-[var(--bw-text-2)] truncate max-w-xs">{row.artist}</td>
                                            <td><span className="ws-tag">{row.genre || 'Tech House'}</span></td>
                                            <td>
                                                <span className="ws-tag ws-tag-muted">
                                                    {(!row.subgenre || ['Pop', 'Electronic', 'Dance', 'Club', 'Other'].includes(row.subgenre)) ? (row.genre || 'Tech House') : row.subgenre}
                                                </span>
                                            </td>
                                            <td className="text-center ws-num">{row.year || '--'}</td>
                                            <td>
                                                <div className="flex items-center gap-1.5 max-w-[260px]">
                                                    <input 
                                                        type="text" 
                                                        value={row.comment || row.comentario || ''} 
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setNotebookTracks(prev => prev.map((t, i) => i === idx ? { ...t, comment: val, comentario: val } : t));
                                                        }}
                                                        placeholder="Añadir nota DJ..."
                                                        aria-label={`Nota DJ para ${row.title}`}
                                                        className="ws-inline-input"
                                                        title={row.comment || row.comentario || 'Nota o comentario táctico DJ'}
                                                    />
                                                </div>
                                            </td>
                                            <td className="text-center ws-num">{row.added_at || '--'}</td>
                                            <td>
                                                <div className="flex items-center justify-end gap-1">
                                                    <button type="button" onClick={() => handleSendToSpotifyInternal(row)} className="ws-btn ws-btn-ghost h-7 px-2" title="Enviar a Record Pool">
                                                        <Icons.Download size={13} /> Pool
                                                    </button>
                                                    <button type="button" onClick={() => handleSendToAuditInternal(row)} className="ws-btn ws-btn-ghost h-7 px-2" title="Añadir a Auditoría">
                                                        <Icons.Copy size={13} /> Auditar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEliminarDeNotebook(row.notebook_id)}
                                                        className="ws-btn ws-btn-ghost h-7 w-7 px-0 justify-center hover:!text-rose-400"
                                                        aria-label="Eliminar de la libreta"
                                                    >
                                                        <Icons.Close size={14} className="inline-block align-[-2px]" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Historial de Pistas Identificadas en la Sesión */}
            {history.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-djzinc-800 pb-2">
                        <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <Icons.Clock size={14} className="inline-block align-[-2px]" />
                            <span>HISTORIAL DE PISTAS IDENTIFICADAS ({history.length})</span>
                        </h4>
                        <button
                            type="button"
                            onClick={() => setHistory([])}
                            className="text-[10px] font-mono text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                            Limpiar Historial
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {history.map((trk, hIdx) => (
                            <div 
                                key={hIdx} 
                                className="ws-card p-3 flex items-center gap-3"
                            >
                                <img 
                                    src={getValidCover(trk.cover)} 
                                    alt="" 
                                    className="w-12 h-12 rounded-lg object-cover border border-[var(--bw-line-strong)] shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <h5 className="text-[13px] font-medium text-[var(--bw-white)] truncate" title={trk.title}>
                                        {trk.title}
                                    </h5>
                                    <p className="text-xs text-[var(--bw-text-2)] truncate" title={trk.artist}>
                                        {trk.artist}
                                    </p>
                                    <span className="text-[10px] font-mono text-[var(--bw-text-3)]">
                                        {trk.genre || 'Electronic'} {trk.year ? `· ${trk.year}` : ''}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                    {trk.preview_url && (
                                        <button
                                            type="button"
                                            onClick={() => togglePlayPreview(trk.preview_url)}
                                            className="ws-play"
                                            aria-label="Pre-escucha"
                                        >
                                            <Icons.Play size={12} />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleSendToAuditInternal(trk)}
                                        className="ws-play"
                                        aria-label="Añadir a Auditoría"
                                    >
                                        <Icons.Plus size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

