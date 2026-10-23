import os
import re
from pathlib import Path
from difflib import SequenceMatcher

def normalizar_texto(texto):
    """Limpia prefijos numéricos, extensiones, símbolos y espacios para comparar mejor."""
    texto = re.sub(r'\.(flac|mp3|wav|m4a|aac)$', '', texto, flags=re.IGNORECASE)
    texto = re.sub(r'^\s*\d+[\.\-\_]?\s*', '', texto)
    texto = texto.lower()
    texto = re.sub(r'[\(\)\[\]\_\-\,\.]', ' ', texto)
    texto = re.sub(r'\s+', ' ', texto).strip()
    return texto

def limpiar_txt_inteligente():
    ruta_input = input("Introduce la ruta de tu archivo .txt (o arrástralo aquí): ")
    ruta_txt = ruta_input.strip().strip("'\"").replace('\\', '')
    
    ruta_carpeta_input = input("Introduce la ruta de la carpeta con los archivos (o arrástrala aquí): ")
    ruta_carpeta = ruta_carpeta_input.strip().strip("'\"").replace('\\', '')
    
    txt_path = Path(ruta_txt)
    carpeta_path = Path(ruta_carpeta)
    
    if not txt_path.exists() or not txt_path.is_file():
        print(f"[ERROR] El archivo de texto no es válido: {txt_path}")
        return
        
    if not carpeta_path.exists() or not carpeta_path.is_dir():
        print(f"[ERROR] La carpeta no es válida: {carpeta_path}")
        return

    print(f"\nEscaneando y normalizando carpeta: {carpeta_path.resolve()}")
    ficheros_normalizados = set()
    for archivo in carpeta_path.rglob('*'):
        if archivo.is_file() and not archivo.name.startswith('.'):
            ficheros_normalizados.add(normalizar_texto(archivo.name))
            ficheros_normalizados.add(normalizar_texto(archivo.stem))

    with open(txt_path, 'r', encoding='utf-8') as f:
        lineas = f.readlines()

    lineas_filtradas = []
    eliminados = 0

    print("\n--- PROCESANDO FILTRADO INTELIGENTE ---")
    for linea in lineas:
        linea_limpia = linea.strip()
        if not linea_limpia:
            continue
            
        linea_norm = normalizar_texto(linea_limpia)
        
        encontrado = False
        for f_norm in ficheros_normalizados:
            if not f_norm or len(f_norm) < 3:
                continue
            
            if f_norm in linea_norm or linea_norm in f_norm:
                encontrado = True
                break
            
            if len(f_norm) > 5 and len(linea_norm) > 5:
                similitud = SequenceMatcher(None, f_norm, linea_norm).ratio()
                if similitud >= 0.82:
                    encontrado = True
                    break
        
        if encontrado:
            print(f" [🗑️ Eliminado] {linea_limpia}")
            eliminados += 1
        else:
            lineas_filtradas.append(linea if linea.endswith('\n') else linea + '\n')

    nuevo_txt_path = txt_path.with_name(txt_path.stem + "_depurado_inteligente.txt")
    with open(nuevo_txt_path, 'w', encoding='utf-8') as f:
        f.writelines(lineas_filtradas)

    print(f"\n==========================================")
    print(f" Proceso finalizado.")
    print(f" Total de registros eliminados: {eliminados}")
    print(f" Nuevo archivo guardado como: {nuevo_txt_path.name}")
    print(f"==========================================")

if __name__ == "__main__":
    limpiar_txt_inteligente()
