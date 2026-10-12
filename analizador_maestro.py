import os
import csv
import librosa
import numpy as np
import soundfile as sf
import requests
import time
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3

ruta_base = "/Users/admin/Music/mi musica/"
carpetas_a_analizar = ["Cantaditas", "House", "Remember", "Tech House", "Techno", "Trance"]
ruta_archivo_csv = os.path.join(ruta_base, "Libreria_DJ_Maestra.csv")

def obtener_metadatos_basicos(ruta_archivo):
    try:
        audio = EasyID3(ruta_archivo)
        artista = audio.get('artist', [''])[0]
        titulo = audio.get('title', [''])[0]
        return artista, titulo
    except:
        return "", ""

def buscar_en_internet(artista, titulo):
    # Consulta a la API de iTunes para obtener metadatos reales y año de lanzamiento
    if not artista or not titulo:
        return "Desconocido", 2026
        
    query = f"{artista} {titulo}".replace(" ", "+")
    url = f"https://itunes.apple.com/search?term={query}&entity=song&limit=1"
    
    try:
        respuesta = requests.get(url, timeout=5)
        datos = respuesta.json()
        
        if datos['resultCount'] > 0:
            resultado = datos['results'][0]
            genero = resultado.get('primaryGenreName', 'Desconocido')
            fecha = resultado.get('releaseDate', '2026')
            año = int(fecha[:4])
            return genero, año
    except:
        pass
    
    return "Desconocido", 2026

def cerebro_dj_clasificador(bpm, año, genero_net, presencia_vocal, zcr, centroide):
    genero_net_bajo = genero_net.lower()
    
    # 1. REMEMBER: El filtro del tiempo manda sobre todo lo demás
    if año < 2011 and año > 1980:
        if "trance" in genero_net_bajo or "techno" in genero_net_bajo or "dance" in genero_net_bajo:
            return "Remember"
            
    # 2. CANTADITAS: Vocal alta + BPM rápido + Etiqueta Pop/Dance/Vocal
    if presencia_vocal > 3000 and 130 <= bpm <= 145:
        if "dance" in genero_net_bajo or "pop" in genero_net_bajo or "vocal" in genero_net_bajo:
            return "Cantaditas"
            
    # 3. TRANCE: Brillante, melódico, rápido y etiquetado
    if "trance" in genero_net_bajo or (bpm >= 132 and centroide > 2500 and presencia_vocal < 2000):
        return "Trance"
        
    # 4. TECH HOUSE: Etiqueta directa o BPM típico de Tech House sin distorsión
    if "tech house" in genero_net_bajo or (124 <= bpm <= 128 and zcr < 0.08):
        return "Tech House"
        
    # 5. HOUSE: BPM bajo y sonido cálido
    if "house" in genero_net_bajo or (bpm <= 125 and centroide < 2000):
        return "House"
        
    # 6. TECHNO (Incluye Hard Techno y todo lo cañero)
    return "Techno"

def procesar_y_limpiar_cancion(ruta_completa, artista, titulo):
    # 1. Consulta a Internet (con pausa para no saturar el servidor)
    genero_internet, año_lanzamiento = buscar_en_internet(artista, titulo)
    time.sleep(0.5) 
    
    try:
        # 2. Análisis Acústico Alta Resolución (Solo cargamos 60 segs para evitar colapsar la RAM)
        y, sr = librosa.load(ruta_completa, sr=44100, duration=60.0)
        
        # 3. Detección y Corte de Silencio Físico
        y_trimmed, indices = librosa.effects.trim(y, top_db=40)
        silencio_inicio_ms = round((indices[0] / sr) * 1000)
        
        if silencio_inicio_ms > 40:
            y_full, sr_full = librosa.load(ruta_completa, sr=None)
            y_full_trimmed, _ = librosa.effects.trim(y_full, top_db=40)
            sf.write(ruta_completa, y_full_trimmed, sr_full)
            y = y_trimmed
            silencio_inicio_ms = 0
            
        # 4. Extracción de BPM, Grid y Tensión Matemática
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        bpm = round(tempo[0], 2) if isinstance(tempo, (list, np.ndarray)) else round(tempo, 2)
        
        beat_times = librosa.frames_to_time(beats, sr=sr)
        beat_intervals = np.diff(beat_times)
        variacion = np.std(beat_intervals) / np.mean(beat_intervals) if len(beat_intervals) > 0 else 0
        estabilidad = "⚠️ INESTABLE" if variacion > 0.04 else "✅ Estable"
        
        energia = int((np.mean(librosa.feature.rms(y=y)) / 0.35) * 100)
        energia = min(100, max(0, energia))
        
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        groove = int(((np.var(onset_env) / np.mean(onset_env)) / 5.0) * 100) if np.mean(onset_env) > 0 else 0
        groove = min(100, max(0, groove))
        
        # Características complejas (Voz, Brillo y Distorsión)
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        presencia_vocal = np.mean(np.var(mfcc[1:13], axis=1))
        zcr = np.mean(librosa.feature.zero_crossing_rate(y))
        centroide = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
        
        # 5. El Cerebro DJ toma la decisión final
        genero_final = cerebro_dj_clasificador(bpm, año_lanzamiento, genero_internet, presencia_vocal, zcr, centroide)
        
        return bpm, energia, groove, estabilidad, silencio_inicio_ms, genero_final, año_lanzamiento, genero_internet

    except Exception as e:
        return 0, 0, 0, "Error", 0, "Desconocido", 2026, "Error"

def analizar_y_exportar():
    todas_las_canciones = []
    for carpeta in carpetas_a_analizar:
        ruta_carpeta = os.path.join(ruta_base, carpeta)
        if os.path.exists(ruta_carpeta):
            archivos_mp3 = [f for f in os.listdir(ruta_carpeta) if f.lower().endswith('.mp3')]
            for archivo in archivos_mp3:
                todas_las_canciones.append((ruta_carpeta, archivo))

    total = len(todas_las_canciones)
    if total == 0:
        print("No se encontraron archivos MP3.")
        return

    archivo_existe = os.path.isfile(ruta_archivo_csv)
    
    with open(ruta_archivo_csv, mode='w' if not archivo_existe else 'a', newline='', encoding='utf-8') as archivo_csv:
        escritor = csv.writer(archivo_csv)
        
        if not archivo_existe:
            escritor.writerow([
                'Archivo', 'Artista', 'Título', 'Año Real', 'Género Internet', 
                'Clasificación DJ Definitiva', 'BPM', 'Energía (%)', 'Groove (%)', 
                'Silencio Recortado (ms)', 'Estabilidad Grid'
            ])

        print(f"🚀 Iniciando Análisis Híbrido (Internet + Acústica) de {total} canciones...")
        print("Este proceso descargará datos pista a pista. Puedes detenerlo con Control+C y continuará donde lo dejaste.")
        print("=" * 80)
        
        for index, (ruta_carpeta, archivo) in enumerate(todas_las_canciones, 1):
            ruta_completa = os.path.join(ruta_carpeta, archivo)
            artista, titulo = obtener_metadatos_basicos(ruta_completa)
            
            # Nombre limpio para mostrar en caso de que no tenga etiquetas ID3
            display_name = f"{artista} - {titulo}" if artista else archivo
            print(f"[{index}/{total}] 🌍 Consultando y analizando: {display_name}...", end=" ", flush=True)
            
            bpm, energia, groove, estabilidad, silencio, genero_final, año, gen_net = procesar_y_limpiar_cancion(ruta_completa, artista, titulo)
            
            escritor.writerow([
                archivo, artista, titulo, año, gen_net, 
                genero_final, bpm, energia, groove, 
                silencio, estabilidad
            ])
            archivo_csv.flush()
            print(f" -> ✅ Clasificado como: {genero_final} ({año})")

    print("=" * 80)
    print("¡Análisis Maestro Finalizado! Revisa el archivo Libreria_DJ_Maestra.csv")

if __name__ == '__main__':
    analizar_y_exportar()