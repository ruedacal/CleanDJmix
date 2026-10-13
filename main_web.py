import eel
import time
import os
import platform

# 1. Inicializamos Eel indicando la carpeta donde está nuestro HTML
eel.init('web')

# 2. Exponemos funciones de Python para que JavaScript (el HTML) pueda llamarlas

@eel.expose
def seleccionar_directorio():
    """
    Simula la apertura de un diálogo de selección de carpeta.
    En una integración real, usaríamos tkinter o PyQt para abrir un diálogo nativo,
    pero al estar en un hilo separado con Eel, hay que manejarlo con cuidado.
    Por ahora, devolvemos una ruta simulada.
    """
    print("[PYTHON] Solicitud desde la UI: Abrir explorador de archivos...")
    ruta_simulada = "/Users/admin/Music/Techno_Set_2026/"
    # Simula un ligero retraso de procesamiento
    time.sleep(0.5)
    return ruta_simulada

@eel.expose
def iniciar_auditoria(ruta_origen):
    """
    Simula el proceso de auditoría y envía logs a la consola de la UI.
    """
    print(f"[PYTHON] Solicitud desde la UI: Iniciar auditoría en {ruta_origen}")
    
    # Podemos llamar a funciones expuestas en JavaScript desde Python
    eel.log_to_console(f"Iniciando escaneo del directorio: {ruta_origen}")
    eel.log_to_console("Verificando permisos y estructura de archivos...")
    
    time.sleep(1.5)
    eel.log_to_console("[ANALIZANDO] Extrayendo metadatos ID3v2.4...", type="info")
    
    time.sleep(2)
    eel.log_to_console("[WARN] Se encontraron 142 pistas sin clave armónica (Key).", type="warn")
    
    time.sleep(1)
    eel.log_to_console("[ÉXITO] Auditoría completada. Calculando métricas finales.", type="success")
    
    print("[PYTHON] Auditoría simulada terminada.")
    # Devolvemos los resultados al frontend
    return {
        "total": 1783,
        "sin_meta": 142,
        "status": "completado"
    }

# 3. Configuramos y arrancamos la aplicación
if __name__ == '__main__':
    print("Iniciando CleanDJmix PRO (Web UI)...")
    print("Asegúrate de que no haya otra instancia de la aplicación (o puerto 8000) corriendo.")
    
    # Opciones de Chrome para intentar abrir a pantalla completa o tamaño máximo
    chrome_options = {
        'mode': 'chrome', # Usa Chrome/Edge App Mode (sin barra de direcciones)
        'host': 'localhost',
        'port': 8000,
        # Argumentos para Chrome (pueden variar según el SO)
        'cmdline_args': ['--start-maximized', '--disable-http-cache']
    }

    try:
        # Arrancamos la UI.
        eel.start('index.html', size=(1400, 900), **chrome_options)
    except EnvironmentError:
        print("\n[!] No se pudo abrir el modo App de Chrome. Abriendo en el navegador por defecto...")
        eel.start('index.html', size=(1400, 900), mode='default')
    except Exception as e:
        print(f"\n[!] Error fatal al iniciar: {e}")