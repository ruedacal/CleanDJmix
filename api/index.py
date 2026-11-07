"""
Vercel Serverless Function entrypoint para CleanDJmix / BeatWave PRO.
Expone la aplicación WSGI para el backend Serverless en Vercel.
"""
import sys
import os

# Asegurar que el directorio raíz está en sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from main import app, application, handler

__all__ = ["app", "application", "handler"]
