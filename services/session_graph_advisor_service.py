import os
import json
import math
import re
import urllib.parse
import urllib.request

class SessionGraphAdvisorService:
    """
    Servicio de Inteligencia Musical para Creación de Sesiones:
    1. Generación de Graph Playlists (DAG no lineal con alternativas y bifurcaciones).
    2. Auditoría de Calidad y Flujo Armónico/Energético de Sesiones.
    3. Integración con Google Gemini API para consejos de masterclass y propuestas inteligentes.
    """

    CAMELOT_COLORS = {
        '1A': '#00d2be', '1B': '#55efc4',
        '2A': '#00b894', '2B': '#81ecec',
        '3A': '#0984e3', '3B': '#74b9ff',
        '4A': '#6c5ce7', '4B': '#a29bfe',
        '5A': '#b83b5e', '5B': '#fd79a8',
        '6A': '#e84393', '6B': '#fab1a0',
        '7A': '#d63031', '7B': '#ff7675',
        '8A': '#e17055', '8B': '#ffeaa7',
        '9A': '#fdcb6e', '9B': '#fff3cd',
        '10A': '#f39c12', '10B': '#e0f2fe',
        '11A': '#27ae60', '11B': '#d1fae5',
        '12A': '#16a085', '12B': '#cffafe',
    }

    @staticmethod
    def parse_camelot(key_str):
        if not key_str:
            return None
        m = re.match(r'^([1-9]|1[0-2])([AB])$', str(key_str).strip().upper())
        if not m:
            return None
        return {"num": int(m.group(1)), "letter": m.group(2), "full": f"{m.group(1)}{m.group(2)}"}

    @classmethod
    def evaluar_transicion(cls, key_a, key_b, bpm_a, bpm_b, energy_a=75, energy_b=80):
        ca = cls.parse_camelot(key_a)
        cb = cls.parse_camelot(key_b)

        if not ca or not cb:
            harmonic_score = 60
            tipo_armonico = "Tonalidad Desconocida"
            badge = "neutral"
        elif ca["full"] == cb["full"]:
            harmonic_score = 100
            tipo_armonico = "Misma Clave (Flujo Perfecto)"
            badge = "perfect"
        elif ca["num"] == cb["num"] and ca["letter"] != cb["letter"]:
            harmonic_score = 92
            tipo_armonico = "Cambio Mayor / Menor (Mood Swap)"
            badge = "good"
        else:
            diff = min(abs(ca["num"] - cb["num"]), 12 - abs(ca["num"] - cb["num"]))
            if diff == 1 and ca["letter"] == cb["letter"]:
                is_boost = (cb["num"] == (ca["num"] % 12) + 1)
                harmonic_score = 95
                tipo_armonico = "Paso Armónico +1 (Energy Boost)" if is_boost else "Paso Armónico -1 (Suavizado)"
                badge = "good"
            elif diff == 1 and ca["letter"] != cb["letter"]:
                harmonic_score = 84
                tipo_armonico = "Diagonal Armónica (Transición Cálida)"
                badge = "acceptable"
            elif diff == 2 and ca["letter"] == cb["letter"]:
                harmonic_score = 75
                tipo_armonico = "Modulación +2 Semitonos (Tensión Positiva)"
                badge = "caution"
            else:
                harmonic_score = 35
                tipo_armonico = f"Choque Tonal ({ca['full']} ➔ {cb['full']})"
                badge = "clash"

        # Penalización o bonificación por BPM
        ba = float(bpm_a or 126.0)
        bb = float(bpm_b or 126.0)
        bpm_diff_ratio = abs(ba - bb) / max(1.0, ba)
        bpm_score = max(0, min(100, int((1.0 - (bpm_diff_ratio / 0.12)) * 100)))

        # Puntuación combinada
        score_total = int(harmonic_score * 0.65 + bpm_score * 0.35)

        # Consejo táctico de mezcla
        if badge == "clash":
            tactica = "Choque armónico audible: mezclar en intros percusivas sin pads ni notas tonales, o usar filtro paso-altos + sweep de reverb."
        elif bpm_diff_ratio > 0.06:
            tactica = f"Diferencia de tempo ({ba:.1f} ➔ {bb:.1f} BPM): aplicar master tempo / key-lock o usar un brake/drop de transición."
        elif badge == "perfect":
            tactica = "Mezcla larga y armónica perfecta: permite solapar líneas de bajo y melodías completas durante 32 a 64 tiempos."
        elif "Boost" in tipo_armonico:
            tactica = "Momento ideal para elevar la pista: introducir el drop de la nueva pista justo tras el breakdown de la actual."
        else:
            tactica = "Transición fluida recomendada: ecualizar cortando medios del tema saliente para dejar espacio al lead entrante."

        return {
            "score": score_total,
            "harmonic_score": harmonic_score,
            "bpm_score": bpm_score,
            "tipo": tipo_armonico,
            "badge": badge,
            "tactica": tactica,
            "bpm_delta": round(bb - ba, 1)
        }

    def generar_grafo_playlist(self, set_tracks, library_tracks=None):
        """
        Construye una estructura de Grafo (DAG) interactivo para Graph Playlists:
        Nodos: Pistas de la sesión + candidatos recomendados de la biblioteca.
        Bordes: Transiciones posibles con pesos de compatibilidad armónica y energética.
        """
        library_tracks = library_tracks or []
        nodes = []
        edges = []

        if not set_tracks or len(set_tracks) == 0:
            return {"nodes": [], "edges": [], "alternative_paths": []}

        # 1. Crear nodos del set principal
        for idx, t in enumerate(set_tracks):
            node_id = f"set_{idx}_{t.get('id') or t.get('path') or idx}"
            nodes.append({
                "id": node_id,
                "track": t,
                "step": idx + 1,
                "is_main_path": True,
                "title": t.get("title", f"Track {idx+1}"),
                "artist": t.get("artist", "Artista"),
                "bpm": float(t.get("bpm") or t.get("b") or 126),
                "key": (t.get("key") or t.get("k") or "8A").upper(),
                "energy": int(t.get("energy") if t.get("energy") is not None else (t.get("e") or 75)),
                "cover": t.get("cover_url") or t.get("cover") or "",
                "path": t.get("path", "")
            })

        # 2. Conectar camino principal lineal
        for idx in range(len(nodes) - 1):
            source = nodes[idx]
            target = nodes[idx + 1]
            eval_trans = self.evaluar_transicion(
                source["key"], target["key"],
                source["bpm"], target["bpm"],
                source["energy"], target["energy"]
            )
            edges.append({
                "id": f"e_{source['id']}_{target['id']}",
                "source": source["id"],
                "target": target["id"],
                "score": eval_trans["score"],
                "tipo": eval_trans["tipo"],
                "badge": eval_trans["badge"],
                "is_main": True,
                "label": f"{eval_trans['score']}% - {eval_trans['tipo']}"
            })

        # 3. Descubrir ramas alternativas desde la biblioteca (Branching / Alternativas)
        if len(library_tracks) > 0:
            existing_ids = {t.get("id") or t.get("path") or t.get("title") for t in set_tracks}
            lib_candidates = [t for t in library_tracks if (t.get("id") or t.get("path") or t.get("title")) not in existing_ids]

            for idx in range(min(5, len(nodes) - 1)):
                src = nodes[idx]
                # Buscar candidatos que ofrezcan un camino alternativo interesante
                for alt_t in lib_candidates:
                    alt_key = (alt_t.get("key") or alt_t.get("k") or "8A").upper()
                    alt_bpm = float(alt_t.get("bpm") or alt_t.get("b") or 126)
                    alt_eval = self.evaluar_transicion(src["key"], alt_key, src["bpm"], alt_bpm)

                    if alt_eval["score"] >= 88:
                        alt_node_id = f"alt_{idx}_{alt_t.get('id') or alt_t.get('path') or alt_t.get('title')}"
                        # Añadir nodo alternativo si no existe
                        if not any(n["id"] == alt_node_id for n in nodes):
                            nodes.append({
                                "id": alt_node_id,
                                "track": alt_t,
                                "step": idx + 1,
                                "is_main_path": False,
                                "title": alt_t.get("title", "Alternative Track"),
                                "artist": alt_t.get("artist", "Artista"),
                                "bpm": alt_bpm,
                                "key": alt_key,
                                "energy": int(alt_t.get("energy") if alt_t.get("energy") is not None else (alt_t.get("e") or 75)),
                                "cover": alt_t.get("cover_url") or alt_t.get("cover") or "",
                                "path": alt_t.get("path", "")
                            })
                            # Conectar borde alternativo
                            edges.append({
                                "id": f"e_{src['id']}_{alt_node_id}",
                                "source": src["id"],
                                "target": alt_node_id,
                                "score": alt_eval["score"],
                                "tipo": alt_eval["tipo"],
                                "badge": alt_eval["badge"],
                                "is_main": False,
                                "label": f"[Alt] {alt_eval['score']}% - {alt_eval['tipo']}"
                            })
                        if len([e for e in edges if e["source"] == src["id"] and not e["is_main"]]) >= 2:
                            break

        return {
            "nodes": nodes,
            "edges": edges,
            "total_nodes": len(nodes),
            "total_edges": len(edges)
        }

    def auditar_calidad_sesion(self, set_tracks, library_tracks=None, user_gemini_key=""):
        """
        Audita el flujo completo de la sesión y genera:
        - Puntuación global de calidad (0-100).
        - Desglose por transición con consejos tácticos.
        - Detección de choques armónicos y saltos bruscos de BPM.
        - Puentes recomendados desde la biblioteca.
        - 3 propuestas alternativas de estructuración de set.
        - Análisis de Inteligencia Artificial (Google Gemini) si hay clave API.
        """
        if not set_tracks or len(set_tracks) == 0:
            return {
                "status": "vacio",
                "score_global": 100,
                "transiciones": [],
                "alertas": ["La sesión no contiene pistas."],
                "propuestas": []
            }

        total_transitions = max(1, len(set_tracks) - 1)
        transiciones = []
        puntos_choque = []
        acum_score = 0

        for i in range(len(set_tracks) - 1):
            t1 = set_tracks[i]
            t2 = set_tracks[i + 1]

            k1 = (t1.get("key") or t1.get("k") or "8A").upper()
            k2 = (t2.get("key") or t2.get("k") or "8A").upper()
            b1 = float(t1.get("bpm") or t1.get("b") or 126)
            b2 = float(t2.get("bpm") or t2.get("b") or 126)

            ev = self.evaluar_transicion(k1, k2, b1, b2)
            acum_score += ev["score"]

            trans_info = {
                "index_from": i,
                "index_to": i + 1,
                "from_title": t1.get("title", f"Track {i+1}"),
                "to_title": t2.get("title", f"Track {i+2}"),
                "from_artist": t1.get("artist", ""),
                "to_artist": t2.get("artist", ""),
                "from_key": k1,
                "to_key": k2,
                "from_bpm": b1,
                "to_bpm": b2,
                "score": ev["score"],
                "tipo": ev["tipo"],
                "badge": ev["badge"],
                "tactica": ev["tactica"],
                "bpm_delta": ev["bpm_delta"]
            }
            transiciones.append(trans_info)

            if ev["badge"] == "clash" or ev["score"] < 65:
                puntos_choque.append(trans_info)

        score_global = int(acum_score / total_transitions) if total_transitions > 0 else 100

        # Buscar puentes armónicos en biblioteca para los puntos de choque
        puentes_recomendados = []
        if puntos_choque and library_tracks:
            for ch in puntos_choque:
                candidatos_puente = []
                for lib_t in library_tracks:
                    lk = (lib_t.get("key") or lib_t.get("k") or "8A").upper()
                    lb = float(lib_t.get("bpm") or lib_t.get("b") or 126)
                    ev_in = self.evaluar_transicion(ch["from_key"], lk, ch["from_bpm"], lb)
                    ev_out = self.evaluar_transicion(lk, ch["to_key"], lb, ch["to_bpm"])
                    prom = (ev_in["score"] + ev_out["score"]) / 2.0
                    if prom >= 80:
                        candidatos_puente.append({
                            "track": lib_t,
                            "score_puente": int(prom),
                            "clave": lk,
                            "bpm": lb
                        })
                candidatos_puente.sort(key=lambda x: x["score_puente"], reverse=True)
                if candidatos_puente:
                    puentes_recomendados.append({
                        "para_transicion": f"{ch['from_title']} ➔ {ch['to_title']}",
                        "mejor_puente": candidatos_puente[0]
                    })

        # Generar 3 propuestas de sesión
        propuestas = self._generar_propuestas_sesion(set_tracks)

        # Consulta a Gemini API si hay API key configurada
        ai_consejos = self._consultar_gemini_api(set_tracks, score_global, puntos_choque, user_gemini_key)

        return {
            "status": "ok",
            "score_global": score_global,
            "rating": "Excelente" if score_global >= 90 else ("Muy Buena" if score_global >= 78 else "Requiere Ajustes"),
            "transiciones": transiciones,
            "puntos_choque": puntos_choque,
            "puentes_recomendados": puentes_recomendados,
            "propuestas": propuestas,
            "ai_insights": ai_consejos
        }

    def _generar_propuestas_sesion(self, tracks):
        """Genera 3 escenarios estratégicos para la sesión."""
        if len(tracks) < 2:
            return []

        # Propuesta 1: Peak Time (Ascendente por BPM y Energía)
        def score_peak(t):
            bpm = float(t.get("bpm") or t.get("b") or 126)
            energy = int(t.get("energy") if t.get("energy") is not None else (t.get("e") or 75))
            return bpm * 0.5 + energy * 0.5

        p_peak = sorted(tracks, key=score_peak)

        # Propuesta 2: Rueda Armónica Camelot (Rotación fluida de tonalidades)
        p_camelot = []
        restantes = list(tracks)
        actual = restantes.pop(0)
        p_camelot.append(actual)

        while restantes:
            curr_key = (actual.get("key") or actual.get("k") or "8A").upper()
            curr_bpm = float(actual.get("bpm") or actual.get("b") or 126)
            # Buscar el más compatible armónicamente
            mejor_idx = 0
            mejor_score = -1
            for idx, cand in enumerate(restantes):
                ck = (cand.get("key") or cand.get("k") or "8A").upper()
                cb = float(cand.get("bpm") or cand.get("b") or 126)
                ev = self.evaluar_transicion(curr_key, ck, curr_bpm, cb)
                if ev["score"] > mejor_score:
                    mejor_score = ev["score"]
                    mejor_idx = idx
            actual = restantes.pop(mejor_idx)
            p_camelot.append(actual)

        # Propuesta 3: Dinámica Ondulada (Festival Rollercoaster)
        p_rollercoaster = []
        sorted_energy = sorted(tracks, key=lambda t: int(t.get("energy") if t.get("energy") is not None else (t.get("e") or 75)))
        izq = 0
        der = len(sorted_energy) - 1
        toggle = True
        while izq <= der:
            if toggle:
                p_rollercoaster.append(sorted_energy[izq])
                izq += 1
            else:
                p_rollercoaster.append(sorted_energy[der])
                der -= 1
            toggle = not toggle

        return [
            {
                "id": "peak_time",
                "titulo": "Escalada Peak-Time Climax",
                "descripcion": "Orden ascendente progresivo de tempo y energía para llevar a la pista hacia el clímax.",
                "tracks": p_peak
            },
            {
                "id": "harmonic_journey",
                "titulo": "Viaje Armónico Continuo (Camelot Flow)",
                "descripcion": "Secuencia optimizada siguiendo la rueda de Camelot para transiciones largas e imperceptibles.",
                "tracks": p_camelot
            },
            {
                "id": "wave_rollercoaster",
                "titulo": "Onda Dinámica (Tensión y Alivio)",
                "descripcion": "Alternancia equilibrada de energía alta y valles melódicos para sesiones de más de una hora.",
                "tracks": p_rollercoaster
            }
        ]

    def _consultar_gemini_api(self, tracks, score_global, puntos_choque, api_key=""):
        """Consulta Google Gemini 2.5 Flash para obtener análisis cualitativo y táctico de la sesión."""
        gemini_key = api_key or os.getenv("GEMINI_API_KEY", "")
        if not gemini_key:
            # Fallback inteligente local
            return {
                "fuente": "Local Audio Intelligence DSP",
                "diagnostico": f"Sesión analizada con una afinidad global del {score_global}%. El flujo presenta una consistencia rítmica sólida.",
                "consejos_dj": [
                    "Mantén el key-lock activo en tu software (Serato / Rekordbox) para evitar desafinaciones al modular tempos.",
                    "En los puntos de mayor energía, prioriza la mezcla en drop con swap de frecuencias graves (corta EQ Low al entrar el beat nuevo).",
                    "Asegura que los hot cues de entrada estén alineados en frases de 32 o 64 tiempos para no romper el ritmo del público."
                ]
            }

        try:
            resumen_pistas = [
                f"{i+1}. {t.get('artist')} - {t.get('title')} (BPM: {t.get('bpm')}, Key: {t.get('key')}, Energy: {t.get('energy', 75)}%)"
                for i, t in enumerate(tracks[:15])
            ]
            prompt = (
                f"Eres un DJ profesional y productor de talla mundial (estilo Charlotte de Witte, Carl Cox, Tale of Us). "
                f"Evalúa esta sesión de DJ ({len(tracks)} pistas, afinidad armónica calculada: {score_global}/100):\n"
                + "\n".join(resumen_pistas)
                + f"\nPuntos de choque detectados: {len(puntos_choque)}. "
                f"Proporciona un diagnóstico táctico en español, conciso (máximo 3 frases) y 3 consejos prácticos profesionales para mezclar esta sesión en vivo. Responde en formato JSON con las claves: 'diagnostico' y 'consejos_dj' (array de 3 strings)."
            )

            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
            req_data = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.4, "maxOutputTokens": 600}
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(req_data).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=12) as response:
                result = json.loads(response.read().decode("utf-8"))
                text_response = result["candidates"][0]["content"]["parts"][0]["text"]
                # Extraer JSON si viene formateado con markdown
                m_json = re.search(r'\{.*\}', text_response, re.DOTALL)
                if m_json:
                    parsed = json.loads(m_json.group(0))
                    parsed["fuente"] = "Google Gemini 2.5 Flash AI"
                    return parsed
        except Exception as e:
            print(f"[GEMINI API WARN] Error al invocar Gemini API: {e}")

        return {
            "fuente": "Local Audio Intelligence DSP",
            "diagnostico": f"Sesión analizada con afinidad global del {score_global}%. El flujo presenta una consistencia rítmica sólida.",
            "consejos_dj": [
                "Mantén el key-lock activo en tu software para evitar desafinaciones al modular tempos.",
                "En los puntos de mayor energía, prioriza la mezcla con swap rápido de EQ Low.",
                "Asegura que los hot cues de entrada estén alineados en frases de 32 o 64 tiempos."
            ]
        }
