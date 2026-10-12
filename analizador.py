import os
import csv
import librosa
import numpy as np
from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3
from concurrent.futures import ProcessPoolExecutor, as_completed

ruta_base = "/Users/admin/Music/mi musica/"
carpetas_a_analizar = ["Cantaditas", "House", "Remember", "Tech House", "Techno", "Trance"]
ruta_archivo_csv = os.path.join(ruta_base, "Libreria_DJ_Completa.csv")

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
        genero = tags.get('genre', ['Desconocido'])[0]
        
        return artista, titulo, album, genero, duracion_formato, frecuencia
    except:
        return "Desconocido", "Desconocido", "Desconocido", "Desconocido", "0:00", 0

def generar_opinion_dj(bpm, energia, bailabilidad, ratio_percusivo):
    opinion = []
    es_alta_energia = energia > 0.20
    es_baja_energia = energia < 0.12
    es_muy_bailable = bailabilidad > 2.5
    
    if bpm < 122 and es_baja_energia:
        opinion.append("Ideal para el inicio (warmup) o crear atmósfera.")
    elif bpm >= 126 and es_alta_energia and es_muy_bailable:
        opinion.append("Rompepistas total (Peak time). Mucho groove y pegada.")
    elif 122 <= bpm <= 128 and es_muy_bailable:
        opinion.append("Pista con mucho groove, perfecta para calentar o mantener a mitad de sesión.")
    elif es_alta_energia and not es_muy_bailable:
        opinion.append("Contundente y lineal (muro de sonido). Ideal para tramos cañeros.")
    elif bpm > 132 and es_alta_energia:
        opinion.append("Súper enérgica, orientada al cierre o clímax del set.")
    else:
        opinion.append("Pista de transición equilibrada.")
        
    if ratio_percusivo > 1.3:
        opinion.append("Destaca el peso de la percusión/bombo.")
    elif ratio_percusivo < 0.8:
        opinion.append("Fuerte carga melódica o vocal.")
        
    return " ".join(opinion)

def procesar_cancion(datos):
    # Esta función ahora ocurre de forma independiente en cada núcleo del procesador
    carpeta, ruta_completa, archivo = datos
    artista, titulo, album, genero, duracion, frecuencia = obtener_metadatos_basicos(ruta_completa)
    
    try:
        y, sr = librosa.load(ruta_completa, sr=None)
        
        y_trimmed, indices = librosa.effects.trim(y, top_db=40)
        silencio_inicio_ms = round((indices[0] / sr) * 1000)
        silencio_final_ms = round(((len(y) - indices[1]) / sr) * 1000)
        
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        bpm = round(tempo[0], 2) if isinstance(tempo, (list, np.ndarray)) else round(tempo, 2)
        
        beat_times = librosa.frames_to_time(beats, sr=sr)
        beat_intervals = np.diff(beat_times)
        variacion = np.std(beat_intervals) / np.mean(beat_intervals) if len(beat_intervals) > 0 else 0
        estabilidad_grid = "⚠️ INESTABLE" if variacion > 0.04 else "✅ Estable"
        
        y_corto = y[:sr*60]
        energia_rms = round(float(np.mean(librosa.feature.rms(y=y_corto))), 3)
        
        onset_env = librosa.onset.onset_strength(y=y_corto, sr=sr)
        bailabilidad = round(float(np.var(onset_env) / np.mean(onset_env)), 2) if np.mean(onset_env) > 0 else 0
        
        y_armonico, y_percusivo = librosa.effects.hpss(y_corto)
        energia_perc = np.mean(librosa.feature.rms(y=y_percusivo))
        energia_arm = np.mean(librosa.feature.rms(y=y_armonico))
        ratio_percusivo = energia_perc / (energia_arm + 0.0001)
        
        comentario = generar_opinion_dj(bpm, energia_rms, bailabilidad, ratio_percusivo)
        
    except Exception as e:
        bpm, energia_rms, bailabilidad = "Error", 0, 0
        silencio_inicio_ms, silencio_final_ms, estabilidad_grid = 0, 0, "Error"
        comentario = "No se pudo analizar matemáticamente."

    return [carpeta, archivo, ruta_completa, artista, titulo, album, genero, duracion, frecuencia, bpm, energia_rms, bailabilidad, silencio_inicio_ms, silencio_final_ms, estabilidad_grid, comentario]

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
                'Carpeta Principal', 'Archivo', 'Ubicación', 'Artista', 'Título', 'Álbum', 'Género ID3',
                'Duración', 'Frecuencia (Hz)', 'BPM', 'Energía (0-1)', 'Bailabilidad',
                'Silencio Inicial (ms)', 'Silencio Final (ms)', 'Estabilidad Grid', 'Opinión Profesional'
            ])

        print(f"🚀 Iniciando análisis MULTINÚCLEO de {total_canciones} canciones...")
        print("=" * 70)
        
        procesadas = 0
        # Inicia el administrador de multiprocesamiento
        with ProcessPoolExecutor() as executor:
            futuros = {executor.submit(procesar_cancion, cancion): cancion for cancion in todas_las_canciones}
            
            # Recoge y guarda los resultados conforme los núcleos van terminando
            for futuro in as_completed(futuros):
                procesadas += 1
                resultado = futuro.result()
                archivo_nombre = resultado[1]
                carpeta_nombre = resultado[0]
                
                escritor.writerow(resultado)
                archivo_csv.flush()
                print(f"[{procesadas}/{total_canciones}] [{carpeta_nombre}] ✅ Completada: {archivo_nombre}")

    print("=" * 70)
    print("¡Proceso masivo finalizado!")

if __name__ == '__main__':
    analizar_y_exportar()
