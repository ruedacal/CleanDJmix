import os
import re
import difflib

class TrackMatcher:
    """
    Motor inteligente de comparación y verificación de fidelidad entre pistas locales de DJ
    y candidatos devueltos por plataformas de streaming (Spotify, Apple Music, Beatport).
    
    Previene la descarga errónea de Radio Edits, covers acústicos, podcasts, directos
    o temas de artistas homónimos cuando el usuario busca mejorar un Extended/Club Mix local.
    """

    VERSION_KEYWORDS = [
        "extended mix", "club mix", "original mix", "radio edit", "remix", 
        "dub mix", "vip", "acoustic", "live", "instrumental", "vocal mix",
        "edit", "re-edit", "intro clean", "short edit", "outro", "bootleg"
    ]

    @staticmethod
    def limpiar_texto(texto: str) -> str:
        """Limpia caracteres especiales, signos de puntuación y etiquetas irrelevantes de metadata."""
        if not texto:
            return ""
        t = str(texto).lower().strip()
        # Eliminar etiquetas típicas de calidad o subida: [FLAC], (Official Video), 320kbps, etc.
        t = re.sub(r'\[.*?\]', '', t)
        t = re.sub(r'\b(official\s+video|official\s+audio|lyrics?|visualizer|clip\s+officiel|hd|hq|320\s*kbps|flac|wav|lossless|cd\s*rip)\b', '', t, flags=re.IGNORECASE)
        # Normalizar separadores y puntuación
        t = re.sub(r'[\-_/\\|,;:~`!@#$%^&*()]+', ' ', t)
        t = re.sub(r'\s+', ' ', t).strip()
        return t

    @staticmethod
    def extraer_version_info(texto: str) -> str:
        """Detecta si el título contiene información explícita de versión (Original Mix, Extended Mix, Radio Edit, Remix)."""
        t = str(texto).lower()
        for kw in TrackMatcher.VERSION_KEYWORDS:
            if kw in t:
                return kw
        return "original"

    @staticmethod
    def parsear_duracion_a_segundos(dur) -> int:
        """Convierte duraciones en string ('06:34', '394000' ms, o int) a segundos enteros."""
        if not dur:
            return 0
        if isinstance(dur, (int, float)):
            if dur > 10000: # probablemente milisegundos
                return int(dur // 1000)
            return int(dur)
        d_str = str(dur).strip()
        if ":" in d_str:
            parts = d_str.split(":")
            try:
                if len(parts) == 2:
                    return int(parts[0]) * 60 + int(float(parts[1]))
                elif len(parts) == 3:
                    return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(float(parts[2]))
            except Exception:
                pass
        try:
            val = float(d_str)
            if val > 10000:
                return int(val // 1000)
            return int(val)
        except Exception:
            return 0

    @classmethod
    def calcular_similitud_textual(cls, str1: str, str2: str) -> float:
        """Calcula similitud basada en difflib SequenceMatcher y superposición de tokens de palabras."""
        c1 = cls.limpiar_texto(str1)
        c2 = cls.limpiar_texto(str2)
        if not c1 or not c2:
            return 0.0
        if c1 == c2:
            return 1.0

        # Ratio SequenceMatcher
        seq_ratio = difflib.SequenceMatcher(None, c1, c2).ratio()

        # Token set ratio (jaccard sobre palabras)
        tokens1 = set(c1.split())
        tokens2 = set(c2.split())
        if not tokens1 or not tokens2:
            return seq_ratio

        inter = len(tokens1.intersection(tokens2))
        union = len(tokens1.union(tokens2))
        token_ratio = inter / union if union > 0 else 0.0

        # Ponderación
        return 0.55 * seq_ratio + 0.45 * token_ratio

    @classmethod
    def evaluar_coincidencia(cls, pista_origen: dict, candidato: dict) -> dict:
        """
        Evalúa si el candidato de streaming corresponde fielmente a la pista de origen.
        Devuelve un dict con score (0-100), nivel de confianza, alertas de versión y si es seguro descargar.
        """
        orig_title = str(pista_origen.get("title") or pista_origen.get("t") or "")
        orig_artist = str(pista_origen.get("artist") or pista_origen.get("a") or "")
        orig_dur_sec = cls.parsear_duracion_a_segundos(pista_origen.get("duration") or pista_origen.get("d") or pista_origen.get("dur_ms") or 0)
        orig_bpm = float(pista_origen.get("bpm") or pista_origen.get("b") or 0.0) if str(pista_origen.get("bpm") or pista_origen.get("b") or "--") != "--" else 0.0

        cand_title = str(candidato.get("title") or candidato.get("trackName") or candidato.get("name") or "")
        cand_artist = str(candidato.get("artist") or candidato.get("artistName") or "")
        cand_dur_sec = cls.parsear_duracion_a_segundos(candidato.get("duration") or candidato.get("trackTimeMillis") or candidato.get("duration_ms") or 0)
        cand_bpm = float(candidato.get("bpm") or 0.0) if str(candidato.get("bpm") or "--") != "--" else 0.0

        # 1. Similitud de Título (0.0 a 1.0)
        sim_title = cls.calcular_similitud_textual(orig_title, cand_title)

        # 2. Similitud de Artista (0.0 a 1.0)
        sim_artist = cls.calcular_similitud_textual(orig_artist, cand_artist)

        # 3. Análisis de Versión (Extended vs Radio Edit)
        v_orig = cls.extraer_version_info(orig_title)
        v_cand = cls.extraer_version_info(cand_title)
        version_penalty = 0.0
        alerta_version = None

        if v_orig != v_cand:
            # Conflicto crítico: el DJ tiene Extended/Club y el candidato es Radio Edit o viceversa
            if ("extended" in v_orig or "club" in v_orig) and "radio" in v_cand:
                version_penalty = 0.35
                alerta_version = "Conflicto de versión: Se esperaba Extended Mix y el candidato es Radio Edit"
            elif "radio" in v_orig and ("extended" in v_cand or "club" in v_cand):
                version_penalty = 0.20
                alerta_version = "Diferencia de versión: Radio Edit vs Extended Mix"
            elif "remix" in v_orig and "remix" not in v_cand:
                version_penalty = 0.30
                alerta_version = "Falta el Remix solicitado en el candidato"
            elif "remix" not in v_orig and "remix" in v_cand:
                version_penalty = 0.25
                alerta_version = "El candidato es un Remix pero la pista original no lo era"

        # 4. Evaluación de Duración
        diff_dur_sec = abs(orig_dur_sec - cand_dur_sec) if orig_dur_sec > 0 and cand_dur_sec > 0 else 0
        dur_score = 1.0
        alerta_duracion = None

        if orig_dur_sec > 0 and cand_dur_sec > 0:
            if diff_dur_sec <= 8:
                dur_score = 1.0 # Mismo track casi al milisegundo
            elif diff_dur_sec <= 20:
                dur_score = 0.90 # Pequeña variación de intro/outro o silencios
            elif diff_dur_sec <= 45:
                dur_score = 0.70
            elif diff_dur_sec <= 75:
                dur_score = 0.40
                alerta_duracion = f"Diferencia de duración notable ({diff_dur_sec}s)"
            else:
                dur_score = 0.10
                alerta_duracion = f"Diferencia de duración crítica: {orig_dur_sec//60}:{orig_dur_sec%60:02d} vs {cand_dur_sec//60}:{cand_dur_sec%60:02d} ({diff_dur_sec}s)"
        else:
            # Si no hay duración de origen, asumimos neutral
            dur_score = 0.80

        # 5. Evaluación de BPM (si está disponible en ambos)
        bpm_score = 1.0
        if orig_bpm > 20.0 and cand_bpm > 20.0:
            diff_bpm = abs(orig_bpm - cand_bpm)
            if diff_bpm <= 1.5:
                bpm_score = 1.0
            elif diff_bpm <= 3.5:
                bpm_score = 0.85
            elif diff_bpm <= 7.0:
                bpm_score = 0.60
            else:
                bpm_score = 0.25

        # 6. Cálculo Ponderado Global (Base 100)
        # Título: 40%, Artista: 30%, Duración: 20%, BPM: 10%
        score_base = (
            (sim_title * 40.0) +
            (sim_artist * 30.0) +
            (dur_score * 20.0) +
            (bpm_score * 10.0)
        )

        # Si el título no coincide en al menos 45%, no puede considerarse la misma pista
        if sim_title < 0.45:
            score_base = min(score_base, sim_title * 80.0)

        # Aplicar penalización por incompatibilidad de versión
        score_final = max(0, min(100, int(score_base * (1.0 - version_penalty))))

        # 7. Diagnóstico de Confianza
        if score_final >= 80 and diff_dur_sec <= 45 and not alerta_version:
            confianza = "ALTA"
            badge_color = "emerald"
            es_misma_pista = True
            recomendacion = "Match verificado. Misma pista y versión."
        elif score_final >= 55 and diff_dur_sec <= 90:
            confianza = "MEDIA"
            badge_color = "amber"
            es_misma_pista = False # Requiere confirmación opcional o selección manual
            recomendacion = alerta_version or alerta_duracion or "Match probable con diferencias de versión o duración."
        else:
            confianza = "BAJA"
            badge_color = "red"
            es_misma_pista = False
            recomendacion = alerta_version or alerta_duracion or "Discordancia detectada. No coincide con la pista original."

        return {
            "score": score_final,
            "confianza": confianza,
            "badge_color": badge_color,
            "es_misma_pista": es_misma_pista,
            "recomendacion": recomendacion,
            "alerta_version": alerta_version,
            "alerta_duracion": alerta_duracion,
            "diff_duracion_sec": diff_dur_sec,
            "duracion_origen": f"{orig_dur_sec//60}:{orig_dur_sec%60:02d}" if orig_dur_sec > 0 else "--:--",
            "duracion_candidato": f"{cand_dur_sec//60}:{cand_dur_sec%60:02d}" if cand_dur_sec > 0 else "--:--",
            "sim_titulo": round(sim_title * 100, 1),
            "sim_artista": round(sim_artist * 100, 1)
        }
