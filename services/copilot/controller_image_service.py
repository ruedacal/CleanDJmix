"""
Servicio y Daemon en segundo plano para búsqueda y renderizado de imágenes de controladoras DJ.
Descarga, cachea y procesa imágenes con fondo transparente (PNG / RGBA) redimensionadas a máx 190x70 px.
"""

import os
import re
import ssl
import threading
import urllib.request
import urllib.parse
from typing import Optional, Dict
from PIL import Image

CONTROLLERS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "web", "assets", "controllers"))
CACHE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data", "controller_images"))

os.makedirs(CONTROLLERS_DIR, exist_ok=True)
os.makedirs(CACHE_DIR, exist_ok=True)

# Mapeo curado de controladoras con fuentes de imágenes oficiales / transparentes
CURATED_SOURCES = {
    "numark_nv_ii": "https://m.cdn.sera.to/v3/hardware/numark/vii/gallery/top-down-flat/numark-v2-top-down-flat-xl.webp",
    "numark_nv": "https://m.cdn.sera.to/v3/hardware/numark/vii/gallery/top-down-flat/numark-v2-top-down-flat-xl.webp",
    "pioneer_ddj_flx4": "https://m.cdn.sera.to/v3/hardware/pioneer/ddj-flx4/gallery/top-down-flat/pioneer-ddj-flx4-top-down-flat-lg.webp",
    "pioneer_ddj_rev7": "https://m.cdn.sera.to/v3/hardware/pioneer/ddj-rev7/gallery/top-down-flat/pioneer-ddj-rev7-top-down-flat-lg.webp",
    "pioneer_ddj_1000srt": "https://m.cdn.sera.to/v3/hardware/pioneer/ddj-1000srt/gallery/top-down-flat/pioneer-ddj-1000srt-top-down-flat-lg.webp",
    "pioneer_ddj_sb3": "https://m.cdn.sera.to/v3/hardware/pioneer/ddj-sb3/gallery/top-down-flat/pioneer-ddj-sb3-top-down-flat-lg.webp",
    "denon_prime_4": "https://m.cdn.sera.to/v3/hardware/denon-dj/prime-4/gallery/top-down-flat/denon-dj-prime-4-top-down-flat-lg.webp",
    "hercules_inpulse_500": "https://m.cdn.sera.to/v3/hardware/hercules/djcontrol-inpulse-500/gallery/top-down-flat/hercules-djcontrol-inpulse-500-top-down-flat-lg.webp",
    "traktor_kontrol_s4": "https://www.native-instruments.com/typo3temp/pics/img-welcome-s4-mk3-top-transparent-a05e5dfec1d7e2beee2679cf90176fd3-m@2x.png",
    "traktor_kontrol_s2": "https://www.native-instruments.com/typo3temp/pics/img-welcome-s2-mk3-top-transparent-a05e5dfec1d7e2beee2679cf90176fd3-m@2x.png"
}


class ControllerImageService:
    _lock = threading.Lock()
    _fetching = set()

    @staticmethod
    def slugify(name: str) -> str:
        """Normaliza el nombre de la controladora a un identificador seguro."""
        clean = re.sub(r'\s*\(USB\)\s*', '', str(name or ''), flags=re.IGNORECASE)
        clean = re.sub(r'[^a-zA-Z0-9]+', '_', clean).strip('_').lower()
        if not clean:
            return "generic_controller"
        if "nv" in clean or "mkii" in clean:
            return "numark_nv_ii"
        if "flx4" in clean:
            return "pioneer_ddj_flx4"
        if "rev7" in clean:
            return "pioneer_ddj_rev7"
        if "1000" in clean:
            return "pioneer_ddj_1000srt"
        if "sb3" in clean:
            return "pioneer_ddj_sb3"
        if "s4" in clean:
            return "traktor_kontrol_s4"
        if "s2" in clean:
            return "traktor_kontrol_s2"
        if "prime" in clean:
            return "denon_prime_4"
        if "inpulse" in clean:
            return "hercules_inpulse_500"
        return clean

    @classmethod
    def get_image_path(cls, model_name: str, wait_timeout: float = 5.0) -> Optional[str]:
        """Obtiene la ruta local de la imagen procesada con fondo transparente."""
        slug = cls.slugify(model_name)
        
        # 1. Verificar si existe en caché
        cache_path = os.path.join(CACHE_DIR, f"{slug}.png")
        if os.path.exists(cache_path):
            return cache_path

        # 2. Verificar si existe en assets estáticos
        asset_path = os.path.join(CONTROLLERS_DIR, f"{slug}.png")
        if os.path.exists(asset_path):
            return asset_path
            
        # 3. Lanzar daemon en segundo plano si no se está descargando ya
        fetch_thread = None
        with cls._lock:
            if slug not in cls._fetching:
                cls._fetching.add(slug)
                fetch_thread = threading.Thread(
                    target=cls._fetch_and_process_daemon,
                    args=(slug, model_name),
                    name=f"Controller-Fetch-{slug}",
                    daemon=True
                )
                fetch_thread.start()
                
        if fetch_thread and wait_timeout > 0:
            fetch_thread.join(timeout=wait_timeout)
            if os.path.exists(cache_path):
                return cache_path
            if os.path.exists(asset_path):
                return asset_path
        elif wait_timeout > 0:
            import time
            start = time.time()
            while time.time() - start < wait_timeout:
                if os.path.exists(cache_path):
                    return cache_path
                if os.path.exists(asset_path):
                    return asset_path
                time.sleep(0.1)
                
        fallback = os.path.join(CONTROLLERS_DIR, "numark_nv_ii.png")
        return fallback if os.path.exists(fallback) else None

    @classmethod
    def _fetch_and_process_daemon(cls, slug: str, raw_name: str):
        """Descarga en segundo plano la imagen de internet, elimina fondo y ajusta dimensiones a máx 190x70."""
        target_path = os.path.join(CONTROLLERS_DIR, f"{slug}.png")
        temp_file = os.path.join(CACHE_DIR, f"temp_{slug}.bin")
        
        url = CURATED_SOURCES.get(slug)
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Referer": "https://serato.com/"
        }

        try:
            if url:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
                    with open(temp_file, "wb") as f:
                        f.write(resp.read())
            else:
                # Búsqueda en internet si no está en las fuentes predefinidas
                clean_query = urllib.parse.quote(f"{raw_name} dj controller transparent png")
                search_url = f"https://serato.com/dj/hardware"
                req = urllib.request.Request(search_url, headers=headers)
                with urllib.request.urlopen(req, context=ctx, timeout=8) as resp:
                    html = resp.read().decode("utf-8", errors="ignore")
                    matches = re.findall(r'https?://m\.cdn\.sera\.to/v3/hardware/[^\"\'\s]+\.webp', html)
                    found_url = None
                    for m in matches:
                        if any(token in m for token in slug.split("_")):
                            found_url = m
                            break
                    if found_url:
                        req_img = urllib.request.Request(found_url, headers=headers)
                        with urllib.request.urlopen(req_img, context=ctx, timeout=10) as i_resp:
                            with open(temp_file, "wb") as f:
                                f.write(i_resp.read())

            if os.path.exists(temp_file) and os.path.getsize(temp_file) > 1000:
                im = Image.open(temp_file).convert("RGBA")
                # Eliminar fondo claro / blanco para que sea 100% transparente
                pixels = list(im.getdata())
                new_pixels = [
                    (p[0], p[1], p[2], 0) if (p[0] > 230 and p[1] > 230 and p[2] > 230) else p
                    for p in pixels
                ]
                im.putdata(new_pixels)
                
                # Autocrop al contenido real de la controladora
                bbox = im.getbbox()
                if bbox:
                    im = im.crop(bbox)

                # Guardar en alta definición transparente en el caché del daemon para renderizado nítido a 930x114px en cabina
                cache_file = os.path.join(CACHE_DIR, f"{slug}.png")
                im.save(cache_file, "PNG")
        except Exception:
            pass
        finally:
            if os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except Exception:
                    pass
            with cls._lock:
                cls._fetching.discard(slug)
