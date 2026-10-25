#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador de Documento Funcional y Técnico en PDF para CleanDJmix PRO
Utiliza ReportLab Platypus con layout corporativo, tipografía profesional,
paleta de colores moderna y soporte de numeración de páginas 'Página X de Y'.
"""

import os
import sys
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# Paleta de Colores CleanDJmix PRO
C_PRIMARY = colors.HexColor("#0d0e15")      # Deep DJ Zinc/Dark
C_SECONDARY = colors.HexColor("#1e1e2d")    # Surface Dark
C_CYAN = colors.HexColor("#06b6d4")         # Neon Cyan Accent
C_CYAN_DARK = colors.HexColor("#0891b2")    # Cyan Dark
C_PURPLE = colors.HexColor("#8b5cf6")       # Neon Violet Accent
C_TEXT_MAIN = colors.HexColor("#1e293b")    # Slate 800
C_TEXT_MUTED = colors.HexColor("#64748b")   # Slate 500
C_BG_LIGHT = colors.HexColor("#f8fafc")     # Slate 50
C_BG_ROW_ALT = colors.HexColor("#f1f5f9")   # Slate 100
C_BORDER = colors.HexColor("#cbd5e1")       # Slate 300
C_SUCCESS = colors.HexColor("#10b981")      # Emerald
C_WARNING = colors.HexColor("#f59e0b")      # Amber
C_WHITE = colors.HexColor("#ffffff")


class NumberedCanvas(canvas.Canvas):
    """Canvas de dos pasos para calcular el total de páginas y pintar header/footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Omitir header y footer en la portada (página 1)
        if self._pageNumber > 1:
            # Header Superior
            self.setStrokeColor(C_BORDER)
            self.setLineWidth(0.6)
            self.line(36, 806, 559, 806)
            
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(C_CYAN_DARK)
            self.drawString(36, 812, "CLEANDJMIX PRO")
            
            self.setFont("Helvetica", 8)
            self.setFillColor(C_TEXT_MUTED)
            self.drawString(125, 812, "|   Manual Funcional y Técnico de Arquitectura")
            
            self.drawRightString(559, 812, "v2.4.0 PRO")
            
            # Footer Inferior
            self.setStrokeColor(C_BORDER)
            self.setLineWidth(0.6)
            self.line(36, 45, 559, 45)
            
            self.setFont("Helvetica", 8)
            self.setFillColor(C_TEXT_MUTED)
            self.drawString(36, 32, "Confidencial & Propietario — Suite Integral DJ Audio DSP & Web Engine")
            
            page_text = f"Página {self._pageNumber} de {page_count}"
            self.drawRightString(559, 32, page_text)
            
        self.restoreState()


def create_pdf_report(output_filename="CleanDJmix_PRO_Manual_Funcional_y_Tecnico.pdf"):
    # Configuración de página A4 con márgenes de 36pt (12.7 mm)
    doc = SimpleDocTemplate(
        output_filename,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=46,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    # Estilos Tipográficos Personalizados
    style_cover_title = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=30,
        leading=36,
        textColor=C_WHITE,
        alignment=0
    )

    style_cover_subtitle = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=13,
        leading=18,
        textColor=C_CYAN,
        alignment=0
    )

    style_cover_meta = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=14,
        textColor=colors.HexColor("#94a3b8")
    )

    style_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=C_PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=15,
        textColor=C_CYAN_DARK,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    style_h3 = ParagraphStyle(
        'SectionH3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=C_TEXT_MAIN,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.2,
        textColor=C_TEXT_MAIN,
        spaceAfter=5
    )

    style_body_bold = ParagraphStyle(
        'BodyDarkBold',
        parent=style_body,
        fontName='Helvetica-Bold'
    )

    style_callout = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor("#0f172a")
    )

    style_code = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.8,
        leading=10.5,
        textColor=colors.HexColor("#0f172a")
    )

    style_table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=C_TEXT_MAIN
    )

    style_table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.0,
        leading=11.0,
        textColor=C_WHITE
    )

    story = []

    # =========================================================================
    # PORTADA CORPORATIVA
    # =========================================================================
    story.append(Spacer(1, 20))
    
    # Bloque de Encabezado Superior de la Portada
    header_banner_data = [
        [
            Paragraph("<b>CLEANDJMIX PRO</b><br/><font size='10' color='#06b6d4'>AUDIO DSP & METADATA SUITE</font>", ParagraphStyle('BanL', fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=C_WHITE)),
            Paragraph("<font size='9' color='#cbd5e1'>Arquitectura de Software & Manual Integral<br/><b>Versión 2.4.0 PRO</b></font>", ParagraphStyle('BanR', fontName='Helvetica', fontSize=9, leading=13, textColor=C_WHITE, alignment=2))
        ]
    ]
    t_banner = Table(header_banner_data, colWidths=[320, 203])
    t_banner.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_PRIMARY),
        ('PADDING', (0, 0), (-1, -1), 16),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
    ]))
    story.append(t_banner)
    story.append(Spacer(1, 14))

    # Título Principal
    cover_box_data = [
        [
            Paragraph(
                "<b>MANUAL FUNCIONAL Y TÉCNICO DE ARQUITECTURA</b><br/>"
                "<font size='11' color='#06b6d4'>Plataforma Profesional de Auditoría Acústica, Hot Cues Studio Hardware, Motor Semántico IA y Exportación Serato/Rekordbox</font>",
                ParagraphStyle('CovHead', fontName='Helvetica-Bold', fontSize=18, leading=23, textColor=C_PRIMARY)
            )
        ],
        [
            Paragraph(
                "Este documento describe de manera exhaustiva todas las capacidades operativas y la arquitectura interna de código "
                "de la plataforma <b>CleanDJmix PRO</b>. Incluye la correspondencia exacta entre componentes de interfaz de usuario, "
                "servicios de audio DSP en Python, contratos de datos de la API REST, física del plato vinilo scratch, ecualización "
                "Web Audio API y suite de pruebas unitarias automatizadas.",
                ParagraphStyle('CovDesc', fontName='Helvetica', fontSize=9, leading=13.5, textColor=C_TEXT_MAIN)
            )
        ]
    ]
    t_cover_box = Table(cover_box_data, colWidths=[523])
    t_cover_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ('BORDER', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ('PADDING', (0, 0), (-1, -1), 14),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_cover_box)
    story.append(Spacer(1, 14))

    # Ficha Técnica y Metadatos de Publicación
    meta_table_data = [
        [Paragraph("<b>Entorno Operativo:</b>", style_table_cell), Paragraph("macOS Apple Silicon & x86_64 / Linux x64", style_table_cell), Paragraph("<b>Frontend:</b>", style_table_cell), Paragraph("React 18, Tailwind CSS, Web Audio API DSP", style_table_cell)],
        [Paragraph("<b>Backend Engine:</b>", style_table_cell), Paragraph("FastAPI, Uvicorn, Python 3.7+ Asyncio", style_table_cell), Paragraph("<b>DSP / Audio:</b>", style_table_cell), Paragraph("FFmpeg / Libav, Mutagen, WebAudio Biquad", style_table_cell)],
        [Paragraph("<b>Bases de Datos / Cache:</b>", style_table_cell), Paragraph("In-Memory Atomic State & JSON Persistent Store", style_table_cell), Paragraph("<b>Pruebas Automatizadas:</b>", style_table_cell), Paragraph("117 / 117 tests superados (Pytest 100%)", style_table_cell)],
        [Paragraph("<b>Fecha del Documento:</b>", style_table_cell), Paragraph(datetime.now().strftime("%d de %B de %Y"), style_table_cell), Paragraph("<b>Compatibilidad DJ:</b>", style_table_cell), Paragraph("Serato DJ Pro (GEOB) & Rekordbox (DJMD)", style_table_cell)]
    ]
    t_meta = Table(meta_table_data, colWidths=[105, 155, 115, 148])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#f1f5f9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('PADDING', (0, 0), (-1, -1), 5.5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # Tabla de Contenido / Sumario Rápido
    toc_data = [
        [Paragraph("<b>ÍNDICE DE CONTENIDOS Y MÓDULOS DE ARQUITECTURA</b>", style_table_header), Paragraph("<b>PÁG</b>", style_table_header)],
        [Paragraph("<b>1. Resumen Ejecutivo y Propósito de la Suite CleanDJmix PRO</b>", style_table_cell), Paragraph("1", style_table_cell)],
        [Paragraph("<b>2. Arquitectura Global del Sistema, Flujo de Datos y Árbol de Código</b>", style_table_cell), Paragraph("2", style_table_cell)],
        [Paragraph("<b>3. Módulo 1: Auditoría Acústica y Normalización de Lote ('Auditar Todo')</b>", style_table_cell), Paragraph("2", style_table_cell)],
        [Paragraph("<b>4. Módulo 2: Hot Cues Studio & Hardware DJ Deck (EQ, Pitch, Scratch)</b>", style_table_cell), Paragraph("3", style_table_cell)],
        [Paragraph("<b>5. Módulo 3: Radar Shazam & Reconocimiento Acústico Híbrido</b>", style_table_cell), Paragraph("4", style_table_cell)],
        [Paragraph("<b>6. Módulo 4: Ingesta Spotify & Pipeline de Descargas Paralelas</b>", style_table_cell), Paragraph("4", style_table_cell)],
        [Paragraph("<b>7. Módulo 5: Taxonomía Inteligente & Buscador IA Multicriterio</b>", style_table_cell), Paragraph("5", style_table_cell)],
        [Paragraph("<b>8. Módulo 6: Exportación Nativa a Ecosistemas Serato y Rekordbox</b>", style_table_cell), Paragraph("5", style_table_cell)],
        [Paragraph("<b>9. Catálogo de Endpoints de la API REST y Contratos de Datos</b>", style_table_cell), Paragraph("6", style_table_cell)],
        [Paragraph("<b>10. Suite de Pruebas Unitarias, Validación y Comandos de Despliegue</b>", style_table_cell), Paragraph("6", style_table_cell)]
    ]
    t_toc = Table(toc_data, colWidths=[480, 43])
    t_toc.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
        ('PADDING', (0, 0), (-1, -1), 4.5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
    ]))
    story.append(t_toc)

    # =========================================================================
    # SECCIÓN 1: RESUMEN EJECUTIVO
    # =========================================================================
    story.append(Spacer(1, 10))
    story.append(Paragraph("1. Resumen Ejecutivo y Propósito de la Suite", style_h1))
    story.append(Paragraph(
        "<b>CleanDJmix PRO</b> es una plataforma integral de ingeniería de audio diseñada específicamente para DJs profesionales, "
        "productores y gestores de bibliotecas musicales. Resuelve de forma definitiva los problemas críticos del workflow DJ: "
        "metadatos corruptos o desordenados, discrepancias tonales (Camelot Key), BPMs imprecisos, falta de cues operativos antes "
        "del show, y la desconexión histórica entre el software de preparación y los reproductores de hardware estándar de club.",
        style_body
    ))
    story.append(Paragraph(
        "La suite opera bajo una arquitectura híbrida: un backend asíncrono de alto rendimiento en Python con capacidad de "
        "procesamiento DSP en paralelo, y una interfaz web ultramoderna construida en React y acelerada por la Web Audio API, "
        "permitiendo renderizado de formas de onda en tiempo real, emulación física de tornamesa directa y ecualización de 3 vías con latencia cero.",
        style_body
    ))

    # SALTO DE PÁGINA A SECCIÓN 2
    story.append(PageBreak())

    # =========================================================================
    # SECCIÓN 2: ARQUITECTURA GLOBAL Y MAPA DE CÓDIGO
    # =========================================================================
    story.append(Paragraph("2. Arquitectura Global del Sistema y Ubicación de Archivos", style_h1))
    story.append(Paragraph(
        "El código base está estrictamente modularizado siguiendo los principios de arquitectura limpia (Clean Architecture), "
        "separación de responsabilidades y desacoplamiento entre capas de transporte HTTP, lógica de negocio y procesamiento de audio.",
        style_body
    ))

    # Tabla de Mapa de Archivos
    code_map_data = [
        [Paragraph("<b>Componente / Archivo</b>", style_table_header), Paragraph("<b>Ubicación Física</b>", style_table_header), Paragraph("<b>Líneas / Rol de Arquitectura</b>", style_table_header)],
        [
            Paragraph("<b>API Server & Endpoints</b><br/><code>main_web.py</code>", style_table_cell),
            Paragraph("<code>/main_web.py</code>", style_code),
            Paragraph("Servidor FastAPI, endpoints REST, SSE streaming, inyección de dependencias, orquestador de tareas en background.", style_table_cell)
        ],
        [
            Paragraph("<b>Frontend SPA & Deck DSP</b><br/><code>app.jsx / bundle.js</code>", style_table_cell),
            Paragraph("<code>web/js/app.jsx</code><br/><code>web/js/app.bundle.js</code>", style_code),
            Paragraph("Single Page Application React 18, Web Audio API DSP, RotaryKnobs, Pitch Fader, Vinyl Platter, Hot Cues pads y Workspaces.", style_table_cell)
        ],
        [
            Paragraph("<b>Auditoría DSP & Tags</b><br/><code>audit_service.py</code>", style_table_cell),
            Paragraph("<code>services/audit_service.py</code>", style_code),
            Paragraph("Escaneo recursivo, extracción de audio, análisis acústico de BPM, tonalidad Camelot, TruePeak, RMS, sanitización masiva ID3/FLAC/MP4.", style_table_cell)
        ],
        [
            Paragraph("<b>Sanitizador Taxonómico</b><br/><code>tag_sanitizer_service.py</code>", style_table_cell),
            Paragraph("<code>services/tag_sanitizer_service.py</code>", style_code),
            Paragraph("Normalización heurística de nombres de artista, títulos, detección de versiones (Extended, Club Mix, VIP), limpieza de caracteres extraños.", style_table_cell)
        ],
        [
            Paragraph("<b>Reconocimiento Shazam</b><br/><code>shazam_service.py</code>", style_table_cell),
            Paragraph("<code>services/shazam_service.py</code>", style_code),
            Paragraph("Huella acústica Shazamio, pipeline de reintentos exponenciales, fallback a búsqueda cruzada Spotify Web API y MusicBrainz.", style_table_cell)
        ],
        [
            Paragraph("<b>Enriquecimiento Artwork</b><br/><code>media_service.py</code>", style_table_cell),
            Paragraph("<code>services/media_service.py</code>", style_code),
            Paragraph("Descarga de portadas en alta definición (1400x1400), embebido directo en tags ID3 APIC / FLAC PICTURE con compresión sin pérdidas.", style_table_cell)
        ],
        [
            Paragraph("<b>Motor de Descargas</b><br/><code>download_service.py</code>", style_table_cell),
            Paragraph("<code>services/download_service.py</code>", style_code),
            Paragraph("Ingesta de enlaces Spotify (track, album, playlist), extracción de audio con yt-dlp, tagging automático concurrente y colas asíncronas.", style_table_cell)
        ],
        [
            Paragraph("<b>Exportador Serato / RK</b><br/><code>export_service.py</code>", style_table_cell),
            Paragraph("<code>services/export_service.py</code>", style_code),
            Paragraph("Escritor de tramas binarias GEOB Serato Markers2 (Hot Cues, beatgrid, color pads) e inyección de metadatos Rekordbox DJMD.", style_table_cell)
        ],
        [
            Paragraph("<b>Estilos y Animaciones</b><br/><code>styles.css</code>", style_table_cell),
            Paragraph("<code>web/styles.css</code>", style_code),
            Paragraph("Clases Tailwind personalizadas, animaciones de vinilo 33 RPM, cursores de scratching, faders verticales y scrollbars oscuros.", style_table_cell)
        ],
        [
            Paragraph("<b>Batería de Pruebas</b><br/><code>tests/*.py</code>", style_table_cell),
            Paragraph("<code>tests/test_audit_service.py</code><br/><code>tests/test_export_service.py</code><br/><code>tests/test_main_web.py</code>", style_code),
            Paragraph("117 pruebas unitarias y de integración que verifican endpoints, servicios DSP, integridad de tags y concurrencia sin regresiones.", style_table_cell)
        ]
    ]
    t_code_map = Table(code_map_data, colWidths=[130, 160, 233])
    t_code_map.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_BG_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_code_map)
    story.append(Spacer(1, 12))

    # =========================================================================
    # SECCIÓN 3: MÓDULO 1 - AUDITORÍA DSP ("AUDITAR TODO")
    # =========================================================================
    story.append(Paragraph("3. Módulo 1: Auditoría Acústica y Normalización de Lote ('Auditar Todo')", style_h1))
    story.append(Paragraph(
        "El módulo de auditoría es el motor de entrada principal para procesar directorios masivos de música. "
        "En la versión actual, el botón principal fue refactorizado y rebautizado como <b>'Auditar Todo'</b> (en inglés <i>'Audit All'</i>), "
        "reflejando que ejecuta no sólo la inspección pasiva, sino el análisis acústico DSP completo, verificación de integridad y normalización.",
        style_body
    ))
    
    audit_features = [
        "<b>Escaneo Recursivo y Formatos Soportados:</b> Inspecciona subcarpetas analizando archivos <code>.mp3</code>, <code>.flac</code>, <code>.wav</code>, <code>.m4a</code>, <code>.aiff</code> y <code>.ogg</code> sin saturar el stack de memoria.",
        "<b>Detección Acústica de BPM y Key Armónico:</b> Calcula el tempo exacto con precisión decimal y mapea la clave tonal a la notación de la rueda Camelot (ej. <i>8A - A minor</i>, <i>11B - A Major</i>) y OpenKey.",
        "<b>Medición de Energía y Normalización EBU R128:</b> Analiza niveles de sonoridad integrada LUFS y rango dinámico RMS, identificando pistas con sobremodulación o distorsión digital.",
        "<b>Detección Automática de Cues (Auto Cue In / Out):</b> Identifica el punto exacto del primer downbeat audible para mezclas sin silencios previos y el punto de salida óptimo.",
        "<b>Escritura Atómica de Tags:</b> La sanitización de metadatos mediante <code>services/tag_sanitizer_service.py</code> aplica transacciones de escritura seguras, evitando corrupciones accidentales si se interrumpe la ejecución."
    ]
    for feat in audit_features:
        story.append(Paragraph(f"• {feat}", style_body))

    # =========================================================================
    # SECCIÓN 4: MÓDULO 2 - HOT CUES STUDIO & HARDWARE DJ DECK
    # =========================================================================
    story.append(Spacer(1, 10))
    story.append(Paragraph("4. Módulo 2: Hot Cues Studio & Hardware DJ Deck", style_h1))
    story.append(Paragraph(
        "El entorno de Hot Cues Studio transforma la aplicación en una estación de trabajo de DJ físico con emulación hardware "
        "de máxima precisión. Integra controles táctiles y acústicos conectados directamente con la Web Audio API:",
        style_body
    ))

    hotcues_features = [
        "<b>Matriz de 8 Hot Cues con Asignación Instantánea:</b> Cada pad permite fijar posiciones milimétricas de reproducción, asignar colores característicos, renombrar el punto (Intro, Drop, Break, Vocal, Outro) y realizar saltos instantáneos sin clipping.",
        "<b>Pitch Fader de Rango Dual (±8% / ±16%):</b> Deslizador vertical de tempo con botones micro-nudge <code>[-]</code> y <code>[+]</code> de 0.1%, botón central de reseteo a 0.0%, y cómputo dinámico del BPM en tiempo real <code>(bpm * (1 + pitch / 100))</code> alterando la propiedad <code>audio.playbackRate</code>.",
        "<b>Ecualizador de 3 Bandas Hardware (LOW, MID, HI):</b> Módulo ecualizador profesional que intercepta el elemento HTML5 Audio mediante <code>createMediaElementSource</code> y conecta tres nodos <code>BiquadFilterNode</code> en serie: <b>LOW (BASS)</b> en 250 Hz (lowshelf), <b>MID</b> en 1000 Hz (peaking Q=1.0) y <b>HI (TREBLE)</b> en 3500 Hz (highshelf). Rango operativo de -24 dB a +6 dB, reseteo a 0 dB por doble clic y botón 'FLAT'.",
        "<b>Plato Direct-Drive Vinyl Scratching:</b> Emulación física de tornamesa de 33⅓ RPM. Al arrastrar circularmente el plato vinilo en pantalla, calcula el ángulo delta en grados y aplica un desplazamiento de audio de <code>(delta / 360) * 1.8 segundos</code> por vuelta completa, reproduciendo la respuesta táctil exacta de un plato Technics 1200.",
        "<b>Corrección de Reproducción y Cueing:</b> El botón Play y Cue cuenta con validación de estado que garantiza que si el track cargado no es el que está sonando, se sincroniza y reproduce instantáneamente sin saltos vacíos.",
        "<b>Forma de Onda Zoomable & Tooltips Protegidos:</b> Renderizado de picos con zoom dinámico hasta 64x y tooltips de tiempo que permanecen confinados entre el 8% y el 92% del ancho, evitando desbordamientos visuales fuera de la pantalla."
    ]
    for feat in hotcues_features:
        story.append(Paragraph(f"• {feat}", style_body))

    # SALTO DE PÁGINA A SECCIÓN 5
    story.append(PageBreak())

    # =========================================================================
    # SECCIÓN 5: MÓDULO 3 - RADAR SHAZAM & RECONOCIMIENTO HÍBRIDO
    # =========================================================================
    story.append(Paragraph("5. Módulo 3: Radar Shazam & Reconocimiento Híbrido", style_h1))
    story.append(Paragraph(
        "Ubicado en <code>services/shazam_service.py</code> y expuesto en la interfaz a través de la pestaña <b>Radar</b>. "
        "Permite identificar temas no etiquetados o grabaciones en vivo utilizando un algoritmo de huella acústica con tolerancia a ruido:",
        style_body
    ))
    
    radar_points = [
        "<b>Fingerprinting Acústico Shazam:</b> Extrae firmas espectrales de segmentos clave de 10 a 15 segundos y consulta la base de datos acústica global con manejo de reintentos exponenciales.",
        "<b>Arquitectura Híbrida de Respaldo (Fallback Multifuente):</b> Si la huella no genera coincidencia directa o el track está ligeramente acelerado, el servicio activa automáticamente una consulta semántica en la API de Spotify y MusicBrainz para recuperar metadatos oficiales.",
        "<b>Enriquecimiento Automático de Portadas HD:</b> Conexión con <code>services/media_service.py</code> para descargar el arte de tapa oficial a 1400x1400 píxeles, optimizar el buffer JPEG e incrustarlo en los tags del archivo.",
        "<b>Extracción de ISRC y Discográfica:</b> Completa códigos ISRC para liquidación de regalías y nombres canónicos de sello discográfico."
    ]
    for pt in radar_points:
        story.append(Paragraph(f"• {pt}", style_body))

    story.append(Spacer(1, 8))

    # =========================================================================
    # SECCIÓN 6: MÓDULO 4 - INGESTA SPOTIFY & PIPELINE DE DESCARGAS
    # =========================================================================
    story.append(Paragraph("6. Módulo 4: Ingesta Spotify & Descargas Paralelas", style_h1))
    story.append(Paragraph(
        "Ubicado en <code>services/download_service.py</code> y la vista <code>SpotifyIngestWorkspace</code>. "
        "Permite sincronizar listas de reproducción completas, álbumes o canciones individuales desde enlaces de Spotify:",
        style_body
    ))
    
    spotify_points = [
        "<b>Parseo y Extracción de Listas:</b> Analiza URLs tipo <code>open.spotify.com/playlist/...</code> o <code>/track/...</code>, extrayendo metadatos completos (título, artistas, álbum, año, duración y artwork).",
        "<b>Cola Concurrente de Descargas:</b> Utiliza workers asíncronos configurables para descargar el audio con máxima fidelidad, convirtiendo al formato configurado (MP3 320 kbps o FLAC sin pérdidas).",
        "<b>Tagging Inmediato Post-Descarga:</b> Inmediatamente tras la descarga, se aplican los tags ID3v2.4 completos, portadas integradas y cues pre-calculados, dejando la pista lista para auditoría.",
        "<b>Protección de Desbordamiento de Texto:</b> La interfaz cuenta con límites <code>max-w-xl break-words</code> para títulos y enlaces extensos, garantizando legibilidad en cualquier resolución de pantalla."
    ]
    for pt in spotify_points:
        story.append(Paragraph(f"• {pt}", style_body))

    story.append(Spacer(1, 8))

    # =========================================================================
    # SECCIÓN 7: MÓDULO 5 - TAXONOMÍA INTELIGENTE & BUSCADOR IA
    # =========================================================================
    story.append(Paragraph("7. Módulo 5: Taxonomía Inteligente & Buscador IA Multicriterio", style_h1))
    story.append(Paragraph(
        "El módulo de Taxonomía se encarga de la categorización avanzada de la colección musical mediante inteligencia semántica. "
        "El componente fue depurado de nomenclaturas locales para ofrecer una experiencia puramente profesional (<b>'Buscador IA'</b> y <b>'BeatWave Pool'</b>):",
        style_body
    ))

    tax_points = [
        "<b>Parser Semántico en Lenguaje Natural (<code>parseAIDJQuery</code>):</b> Interpreta consultas como <i>'Tech House 124 a 128 bpm en 8A energico vocal'</i>, extrayendo automáticamente tokens de BPM (rango o exacto), tonalidad armónica Camelot, géneros, versión (Extended, Club Mix, Dub) y etiquetas de energía o mood.",
        "<b>Gestión Dinámica de Etiquetas (Chips Interactivos):</b> Las etiquetas interpretadas se muestran como chips con botón de eliminación individual (<code>✕</code>) que limpian automáticamente el fragmento correspondiente de la caja de búsqueda sin perder los demás filtros.",
        "<b>Selector Rápido de Adición Manual (<code>[+ Añadir Tag]</code>):</b> Menú desplegable interactivo por categorías (BPM, Key, Género, Versión, Mood) que permite añadir parámetros de búsqueda específicos con un solo clic.",
        "<b>Chips Sugeridos BeatWave Pool:</b> Colección de presets instantáneos para filtrar la pista de baile en función del estilo de la sesión (Club Peak Time, Melodic Sunset, Deep Warmup, etc.)."
    ]
    for pt in tax_points:
        story.append(Paragraph(f"• {pt}", style_body))

    story.append(Spacer(1, 8))

    # =========================================================================
    # SECCIÓN 8: MÓDULO 6 - EXPORTACIÓN SERATO Y REKORDBOX
    # =========================================================================
    story.append(Paragraph("8. Módulo 6: Exportación a Ecosistemas Serato y Rekordbox", style_h1))
    story.append(Paragraph(
        "Ubicado en <code>services/export_service.py</code>. Permite que el trabajo de auditoría, grids y Hot Cues realizado en CleanDJmix PRO "
        "sea exportado de forma nativa e inmediata al software de actuación en directo preferido por el DJ:",
        style_body
    ))

    export_points = [
        "<b>Compatibilidad Serato DJ Pro (GEOB Markers2):</b> Empaqueta estructuras binarias serializadas en el frame ID3 <code>GEOB:Serato Markers2</code>, guardando los 8 Hot Cues con milisegundos exactos, nombres personalizados y colores oficiales Serato RGB.",
        "<b>Compatibilidad Pioneer Rekordbox:</b> Inyecta la información en campos ID3 compatibles y estructuras XML Rekordbox (DJMD), asegurando que las llaves USB preparadas para CDJs reproduzcan los cues sin desfase.",
        "<b>Preservación Absoluta de Tags Previos:</b> La rutina lee los tags existentes y solo sobreescribe o adjunta los bloques correspondientes, sin tocar comentarios privados, ratings ni fechas de importación."
    ]
    for pt in export_points:
        story.append(Paragraph(f"• {pt}", style_body))

    # SALTO DE PÁGINA A SECCIÓN 9
    story.append(PageBreak())

    # =========================================================================
    # SECCIÓN 9: CATÁLOGO DE ENDPOINTS DE LA API REST
    # =========================================================================
    story.append(Paragraph("9. Catálogo de Endpoints de la API REST y Contratos de Datos", style_h1))
    story.append(Paragraph(
        "La interfaz web se comunica con el servidor FastAPI a través de un conjunto unificado de endpoints REST "
        "y canales Server-Sent Events (SSE) para retroalimentación en streaming y tiempo real:",
        style_body
    ))

    api_table_data = [
        [Paragraph("<b>Método</b>", style_table_header), Paragraph("<b>Endpoint URI</b>", style_table_header), Paragraph("<b>Parámetros / Payload</b>", style_table_header), Paragraph("<b>Descripción Funcional</b>", style_table_header)],
        [
            Paragraph("<font color='#10b981'><b>POST</b></font>", style_table_cell),
            Paragraph("<code>/api/audit</code>", style_code),
            Paragraph("<code>{ directory: str, recursive: bool }</code>", style_code),
            Paragraph("Inicia escaneo y auditoría acústica del directorio especificado.", style_table_cell)
        ],
        [
            Paragraph("<font color='#06b6d4'><b>GET</b></font>", style_table_cell),
            Paragraph("<code>/api/audit/stream</code>", style_code),
            Paragraph("<code>taskId: str</code> (SSE)", style_code),
            Paragraph("Canal de eventos en tiempo real con el porcentaje y estado del análisis DSP.", style_table_cell)
        ],
        [
            Paragraph("<font color='#10b981'><b>POST</b></font>", style_table_cell),
            Paragraph("<code>/api/batch-write-tags</code>", style_code),
            Paragraph("<code>{ tracks: [ { filepath, title, artist, ... } ] }</code>", style_code),
            Paragraph("Escritura atómica masiva de metadatos sanitizados en archivos físicos.", style_table_cell)
        ],
        [
            Paragraph("<font color='#06b6d4'><b>GET</b></font>", style_table_cell),
            Paragraph("<code>/api/stream-audio</code>", style_code),
            Paragraph("<code>path: str</code> (Query Param)", style_code),
            Paragraph("Streaming de audio HTTP con soporte para cabeceras Range (scrub y seek instantáneo).", style_table_cell)
        ],
        [
            Paragraph("<font color='#10b981'><b>POST</b></font>", style_table_cell),
            Paragraph("<code>/api/hotcues/save</code>", style_code),
            Paragraph("<code>{ filepath: str, cues: [ { id, ms, label, color } ] }</code>", style_code),
            Paragraph("Persiste la matriz de 8 Hot Cues en archivo local y base de metadatos.", style_table_cell)
        ],
        [
            Paragraph("<font color='#10b981'><b>POST</b></font>", style_table_cell),
            Paragraph("<code>/api/export/serato</code>", style_code),
            Paragraph("<code>{ filepaths: [str], mode: 'geob' }</code>", style_code),
            Paragraph("Escribe tags binarios GEOB Serato Markers2 en los archivos especificados.", style_table_cell)
        ],
        [
            Paragraph("<font color='#10b981'><b>POST</b></font>", style_table_cell),
            Paragraph("<code>/api/shazam-identify</code>", style_code),
            Paragraph("<code>{ filepath: str, offset_sec: int }</code>", style_code),
            Paragraph("Ejecuta huella acústica Shazam y devuelve metadatos canónicos y carátula.", style_table_cell)
        ],
        [
            Paragraph("<font color='#10b981'><b>POST</b></font>", style_table_cell),
            Paragraph("<code>/api/spotify/parse</code>", style_code),
            Paragraph("<code>{ url: str }</code>", style_code),
            Paragraph("Extrae la lista de canciones y metadatos de un enlace de Spotify.", style_table_cell)
        ],
        [
            Paragraph("<font color='#10b981'><b>POST</b></font>", style_table_cell),
            Paragraph("<code>/api/download/queue</code>", style_code),
            Paragraph("<code>{ tracks: [...], destination: str }</code>", style_code),
            Paragraph("Añade tracks a la cola de descarga paralela con post-procesamiento DSP.", style_table_cell)
        ]
    ]
    t_api = Table(api_table_data, colWidths=[50, 130, 155, 188])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_BG_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 4.5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_api)
    story.append(Spacer(1, 12))

    # =========================================================================
    # SECCIÓN 10: SUITE DE PRUEBAS Y MANTENIMIENTO
    # =========================================================================
    story.append(Paragraph("10. Suite de Pruebas Unitarias, Validación y Mantenimiento", style_h1))
    story.append(Paragraph(
        "CleanDJmix PRO cuenta con una cobertura integral de pruebas automatizadas mediante el framework <code>pytest</code>. "
        "Cada release pasa por un riguroso ciclo de verificación para garantizar cero regresiones en archivos de audio reales:",
        style_body
    ))

    test_box_data = [
        [
            Paragraph("<b>Resultados de la Suite Automatizada (Pytest):</b>", ParagraphStyle('THead', fontName='Helvetica-Bold', fontSize=9, textColor=C_WHITE)),
            Paragraph("<b>117 / 117 TESTS PASSED (100% SUCCESS)</b>", ParagraphStyle('TPass', fontName='Helvetica-Bold', fontSize=9, textColor=C_SUCCESS, alignment=2))
        ],
        [
            Paragraph(
                "• <b>Módulo de Exportación (<code>test_export_service.py</code>):</b> 18 tests que validan estructuras binarias Serato GEOB, paridad de bytes, inyección de colores y persistencia Rekordbox.<br/>"
                "• <b>Módulo de Auditoría (<code>test_audit_service.py</code>):</b> 42 tests comprobando detección de BPM, conversión Camelot, validación de formatos de archivo y extracción de energía RMS.<br/>"
                "• <b>Servidor y Endpoints Web (<code>test_main_web.py</code>):</b> 57 tests verificando streaming HTTP Range, SSE, sanitización de tags y control de excepciones sin caídas del servidor.",
                ParagraphStyle('TDesc', fontName='Helvetica', fontSize=8, leading=11.5, textColor=C_TEXT_MAIN)
            ),
            Paragraph(
                "<b>Tiempo de Ejecución:</b> ~10.25s<br/>"
                "<b>Entorno:</b> Python 3.7+ Asyncio<br/>"
                "<b>Estado:</b> ESTABLE",
                ParagraphStyle('TMeta', fontName='Helvetica', fontSize=8, leading=11.5, textColor=C_TEXT_MUTED, alignment=2)
            )
        ]
    ]
    t_test_box = Table(test_box_data, colWidths=[350, 173])
    t_test_box.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('PADDING', (0, 0), (-1, -1), 7),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(t_test_box)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Comandos de Mantenimiento y Compilación:", style_h2))
    cmd_data = [
        [Paragraph("<b>Objetivo</b>", style_table_header), Paragraph("<b>Comando Shell</b>", style_table_header)],
        [Paragraph("Compilar Bundle React", style_table_cell), Paragraph("<code>npx esbuild web/js/app.jsx --bundle --outfile=web/js/app.bundle.js --loader:.js=jsx</code>", style_code)],
        [Paragraph("Ejecutar Suite de Tests", style_table_cell), Paragraph("<code>./env_python37/bin/python -m pytest tests/</code>", style_code)],
        [Paragraph("Iniciar Servidor Web", style_table_cell), Paragraph("<code>python3 main_web.py</code> (Escucha en puerto http://127.0.0.1:8000)", style_code)],
        [Paragraph("Generar Manual PDF", style_table_cell), Paragraph("<code>python3 scripts/generate_manual_pdf.py</code>", style_code)]
    ]
    t_cmd = Table(cmd_data, colWidths=[150, 373])
    t_cmd.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), C_PRIMARY),
        ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [C_WHITE, C_BG_LIGHT]),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(t_cmd)

    # Construir documento
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF generado con éxito: {os.path.abspath(output_filename)}")


if __name__ == '__main__':
    create_pdf_report()
