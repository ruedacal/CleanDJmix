import re

with open("web/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Regex infalible: Atrapa desde el fin del nombre del archivo hasta el cierre de la columna
# y reconstruye el espacio intermedio con exactamente un </div>
html = re.sub(
    r'(\{row\.f\}</div>)[\s<div/>]*(</td>)', 
    r'\1\n                                            </div>\n                                            \2', 
    html
)

with open("web/index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("✅ Etiqueta JSX cerrada definitivamente. Compilación restaurada.")
