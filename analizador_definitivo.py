
import os
import csv
import librosa
import numpy as np
import soundfile as sf
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3
from concurrent.futures import ProcessPoolExecutor, as_completed

ruta_base = "/Users/admin/Music/mi musica/"
carpetas_a_analizar = ["Cantaditas", "House", "Remember", "Tech House", "Techno", "Trance"]
ruta_archivo_csv = os.path.join(ruta_base, "Libreria_DJ_UltraRapida.csv")

def obtener_metadatos_basicos(ruta_archivo):
    try:
        audio_info = MP3(ruta_archivo)
        duracion_segundos = audio_info.info.length
        minutos = int(duracion_segundos // 60)
        segundos = int(duracion_segundos % 60)
        duracion_formato = f"{minutos}:{segundos:02d}"
        frecuencia = audio_info.info.sample_rate
        
        tags = EasyID3(ruta_archivo)
        artista = tags.get('artist', ['Desconocido'])[0]
        titulo = tags.get('title', ['Desconocido'])[0]
        album = tags.get('album', ['Desconocido'])[0]
        
        return artista, titulo, album, duracion_formato, frecuencia
    except:
        return "Desconocido", "Desconocido", "Desconocido", "0:00", 0

def corregir_escala_1_100(valor, maximo_esperado):
    porcentaje = (valor / maximo_esperado) * 100
    return min(100, max(0, int(porcentaje)))

def clasificador_ia_dj(bpm, ratio_percusivo, centroide, zcr, presencia_vocal, groove):
    es_vocal = presencia_vocal > 3500
    es_distorsionado = zcr > 0.08
    es_brillante = centroide > 2500
    
    if 125 <= bpm <= 138 and es_vocal:
        return "Cantaditas (Vocal Tech House)" if groove > 3.0 else "Cantaditas (Classic Vocal)"
    elif bpm >= 138 and es_distorsionado:
        return "Hard Techno / Industrial" if zcr > 0.12 and bpm > 145 else "Hard Techno / Peak"
    elif bpm >= 132 and ratio_percusivo < 0.9 and es_brillante:
        return "Psy-Trance" if bpm >= 140 else "Trance / Progressive"
    elif 135 <= bpm <= 150 and not es_distorsionado and ratio_percusivo > 1.0:
        return "Remember / Classic Techno"
    elif 124 <= bpm <= 130 and groove > 2.8 and not es_vocal:
        return "Tech House / Minimal" if ratio_percusivo > 1.5 else "Tech House / Groove"
    elif bpm <= 126 and not es_distorsionado:
        return "Deep House" if centroide < 1800 else "House / Jackin"
    elif 128 <= bpm <= 135:
        return "Techno / Raw Deep" if centroide < 2000 and ratio_percusivo < 1.2 else "Techno / Peak Time"
    else:
        return "Electrónica General"

def procesar_cancion(datos):
    carpeta, ruta_completa, archivo = datos
    artista, titulo, album, duracion, frecuencia = obtener_metadatos_basicos(ruta_completa)
    
    try:
        # 1. DETECCIÓN ULTRA RÁPIDA DE SILENCIO INICIAL (Carga 5 segs a 11kHz)
        y_inicio, sr_fast = librosa.load(ruta_completa, sr=11025, duration=5.0)
        y_trimmed_ini, indices = librosa.effects.trim(y_inicio, top_db=40)
        silencio_inicio_ms = round((indices[0] / sr_fast) * 1000)
        
        # 2. AUTO-RECORTE SOLO SI ES NECESARIO
        if silencio_inicio_ms > 40:
            y_full, sr_full = librosa.load(ruta_completa, sr=None)
            y_trimmed_full, _ = librosa.effects.trim(y_full, top_db=40)
            sf.write(ruta_completa, y_trimmed_full, sr_full)
            silencio_inicio_ms = 0
            
        # 3. EXTRACCIÓN DEL NÚCLEO (Segundo 45 a 90) PARA IA Y BPM
        try:
            y_core, sr_core = librosa.load(ruta_completa, sr=11025, offset=45.0, duration=45.0)
        except:
            y_core, sr_core = librosa.load(ruta_completa, sr=11025, duration=45.0)

        # 4. MATEMÁTICAS OPTIMIZADAS
        tempo, beats = librosa.beat.beat_track(y=y_core, sr=sr_core)
        bpm = round(tempo[0], 2) if isinstance(tempo, (list, np.ndarray)) else round(tempo, 2)
        
        beat_times = librosa.frames_to_time(beats, sr=sr_core)
        beat_intervals = np.diff(beat_times)
        variacion = np.std(beat_intervals) / np.mean(beat_intervals) if len(beat_intervals) > 0 else 0
        estabilidad_grid = "⚠️ INESTABLE" if variacion > 0.04 else "✅ Estable"
        
        energia_cruda = np.mean(librosa.feature.rms(y=y_core))
        energia_100 = corregir_escala_1_100(energia_cruda, 0.35)
        
        onset_env = librosa.onset.onset_strength(y=y_core, sr=sr_core)
        groove_crudo = np.var(onset_env) / np.mean(onset_env) if np.mean(onset_env) > 0 else 0
        groove_100 = corregir_escala_1_100(groove_crudo, 5.0)
        
        y_armonico, y_percusivo = librosa.effects.hpss(y_core)
        ratio_percusivo = np.mean(librosa.feature.rms(y=y_percusivo)) / (np.mean(librosa.feature.rms(y=y_armonico)) + 0.0001)
        centroide = np.mean(librosa.feature.spectral_centroid(y=y_core, sr=sr_core))
        zcr = np.mean(librosa.feature.zero_crossing_rate(y_core))
        
        mfcc = librosa.feature.mfcc(y=y_core, sr=sr_core, n_mfcc=13)
        presencia_vocal = np.mean(np.var(mfcc[1:13], axis=1))
        
        genero_ia = clasificador_ia_dj(bpm, ratio_percusivo, centroide, zcr, presencia_vocal, groove_crudo)
        
    except Exception as e:
        bpm, energia_100, groove_100 = "Error", 0, 0
        silencio_inicio_ms, estabilidad_grid = 0, "Error"
        genero_ia = "Error de Análisis"

    return [carpeta, archivo, ruta_completa, artista, titulo, album, genero_ia, duracion, frecuencia, bpm, energia_100, groove_100, silencio_inicio_ms, estabilidad_grid]

def analizar_y_exportar():
    todas_las_canciones = []
    for carpeta in carpetas_a_analizar:
        ruta_carpeta = os.path.join(ruta_base, carpeta)
        if os.path.exists(ruta_carpeta):
            archivos_mp3 = [f for f in os.listdir(ruta_carpeta) if f.lower().endswith('.mp3')]
            for archivo in archivos_mp3:
                todas_las_canciones.append((carpeta, os.path.join(ruta_carpeta, archivo), archivo))

    total_canciones = len(todas_las_canciones)
    if total_canciones == 0:
        print("No se encontraron archivos MP3.")
        return

    archivo_existe = os.path.isfile(ruta_archivo_csv)
    
    with open(ruta_archivo_csv, mode='w' if not archivo_existe else 'a', newline='', encoding='utf-8') as archivo_csv:
        escritor = csv.writer(archivo_csv)
        
        if not archivo_existe:
            escritor.writerow([
                'Carpeta Principal', 'Archivo', 'Ubicación', 'Artista', 'Título', 'Álbum', 'Género IA',
                'Duración', 'Frecuencia (Hz)', 'BPM', 'Energía (%)', 'Groove (%)',
                'Silencio Inicial (ms)', 'Estabilidad Grid'
            ])

        print(f"🚀 Iniciando análisis ULTRA RÁPIDO de {total_canciones} canciones...")
        print("=" * 70)
        
        procesadas = 0
        with ProcessPoolExecutor() as executor:
            futuros = {executor.submit(procesar_cancion, cancion): cancion for cancion in todas_las_canciones}
            
            for futuro in as_completed(futuros):
                procesadas += 1
                resultado = futuro.result()
                archivo_nombre = resultado[1]
                genero_asignado = resultado[6]
                
                escritor.writerow(resultado)
                archivo_csv.flush()
                print(f"[{procesadas}/{total_canciones}] ⚡️ {archivo_nombre} -> {genero_asignado}")

    print("=" * 70)
    print("¡Proceso finalizado! Revisa Libreria_DJ_UltraRapida.csv")

if __name__ == '__main__':
    analizar_y_exportar()
