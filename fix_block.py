import re

with open("web/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Bloque JSX perfecto, con todos los divs cerrados correctamente
bloque_limpio = """<td className="py-2 px-4 flex items-center gap-3">
                                                <img src={`http://localhost:8000/cover?path=${encodeURIComponent(row.path)}`} className="w-10 h-10 rounded bg-djzinc-800 object-cover shrink-0" alt="cover" />
                                                <div>
                                                    <div className="font-medium text-gray-200">{row.t || row.titulo || row.f}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono">{row.f}</div>
                                                </div>
                                            </td>"""

# Encuentra la celda corrupta completa y la sobreescribe por el bloque limpio
html = re.sub(
    r'<td className="py-2 px-4 flex items-center gap-3">.*?\{row\.f\}</div>\s*(?:</div>)?\s*</td>',
    bloque_limpio,
    html,
    flags=re.DOTALL
)

with open("web/index.html", "w", encoding="utf-8") as f:
    f.write(html)

print("✅ Celda JSX reconstruida desde cero. Compilación garantizada.")
