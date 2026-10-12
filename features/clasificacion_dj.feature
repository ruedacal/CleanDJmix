# language: es
Característica: Gestión y clasificación inteligente de biblioteca musical para DJs
  Como DJ profesional
  Quiero que la aplicación analice, clasifique y asigne metadatos a mis pistas
  Para tener mi biblioteca perfectamente ordenada y lista para Serato

  Escenario: Clasificación automática de una pista de techno industrial
    Dada una pista de música electrónica con 145 BPM y año 2025
    Y con estilos musicales "hard techno" e "industrial"
    Cuando el cerebro clasificador de Ishkur procesa la pista
    Entonces el género principal debe ser "Techno"
    Y el subgénero asignado debe ser "Hard Techno"

  Escenario: Auditoría y cálculo de estado de ánimo (Mood)
    Dada una pista con 138 BPM y alta energía
    Cuando la herramienta realiza el análisis acústico y de auditoría
    Entonces el Mood detectado debe ser "Eufórico / Hype"
    Y la bailabilidad calculada debe ser superior al 50 por ciento
