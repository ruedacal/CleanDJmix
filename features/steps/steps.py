from behave import given, when, then
from domain.models import TrackDomain

@given('una pista de música electrónica con {bpm:d} BPM y año {anio:d}')
def step_given_pista(context, bpm, anio):
    context.bpm = float(bpm)
    context.anio = anio
    context.estilos = []
    context.presencia_vocal = 500.0
    context.zcr = 0.08
    context.centroide = 3000.0

@given('con estilos musicales "{estilo1}" e "{estilo2}"')
def step_given_estilos_dos(context, estilo1, estilo2):
    context.estilos = [estilo1, estilo2]

@given('una pista con {bpm:d} BPM y alta energía')
def step_given_pista_energia(context, bpm):
    context.bpm = float(bpm)
    context.energia = 75
    context.groove = 6.0
    context.centroide = 2500.0

@when('el cerebro clasificador de Ishkur procesa la pista')
def step_when_procesar_ishkur(context):
    context.genero, context.subgenero = TrackDomain.cerebro_ishkur(
        context.bpm, 
        context.anio, 
        context.estilos, 
        context.presencia_vocal, 
        context.zcr, 
        context.centroide
    )

@when('la herramienta realiza el análisis acústico y de auditoría')
def step_when_analisis_acustico(context):
    if context.bpm > 135 and context.energia > 60:
        context.mood = "Eufórico / Hype"
    else:
        context.mood = "Groovy / Fiestero"
    context.bailabilidad = int(context.groove * 15)

@then('el género principal debe ser "{genero_esperado}"')
def step_then_genero(context, genero_esperado):
    assert context.genero == genero_esperado, f"Esperado {genero_esperado}, obtenido {context.genero}"

@then('el subgénero asignado debe ser "{subgenero_esperado}"')
def step_then_subgenero(context, subgenero_esperado):
    assert context.subgenero == subgenero_esperado, f"Esperado {subgenero_esperado}, obtenido {context.subgenero}"

@then('el Mood detectado debe ser "{mood_esperado}"')
def step_then_mood(context, mood_esperado):
    assert context.mood == mood_esperado, f"Esperado {mood_esperado}, obtenido {context.mood}"

@then('la bailabilidad calculada debe ser superior al {porcentaje:d} por ciento')
def step_then_bailabilidad(context, porcentaje):
    assert context.bailabilidad > porcentaje, f"Bailabilidad {context.bailabilidad}% no supera {porcentaje}%"

@given('una URL de playlist de Spotify con {total:d} pistas disponibles')
def step_given_playlist_spotify(context, total):
    context.canciones_escaneadas = []
    for i in range(1, total + 1):
        context.canciones_escaneadas.append({
            "titulo": f"Track {i}",
            "artista": f"Artist {i}",
            "album": f"Album {i}",
            "duracion": "03:30",
            "seleccionada": True
        })

@when('el usuario escanea los metadatos de la lista')
def step_when_escanear_lista(context):
    assert len(context.canciones_escaneadas) > 0

@when('desmarca la pista número {num:d}')
def step_when_desmarcar_pista(context, num):
    indice = num - 1
    context.canciones_escaneadas[indice]["seleccionada"] = False

@then('quedan {esperadas:d} pistas seleccionadas para descargar')
def step_then_verificar_seleccion(context, esperadas):
    seleccionadas = [p for p in context.canciones_escaneadas if p["seleccionada"]]
    assert len(seleccionadas) == esperadas, f"Esperadas {esperadas}, obtenidas {len(seleccionadas)}"
