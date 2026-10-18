import re

with open("web/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Patrón infalible: Busca el final de la columna del botón Play (</button> </td>)
# y mira hasta el inicio de la columna del artista ({row.a}).
# Extrae toda la basura que haya en medio y planta un bloque JSX inmaculado.
pattern = r'(</button>\s*</td>\s*)<td[^>]*>[\s\S]*?(?=\s*<td[^>]*>\{row\.a)'

bloque_inmaculado = r'''\1<td className="py-2 px-4 flex items-center gap-3">
                                                <img src={`http://localhost:8000/cover?path=${encodeURIComponent(row.path)}`} className="w-10 h-10 rounded bg-djzinc-800 object-cover shrink-0" alt="cover" />
                                                <div className="flex flex-col">
                                                    <div className="font-medium text-gray-200">{row.t || row.f}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono">{row.f}</div>
                                                </div>
                                            </td>'''

new_html = re.sub(pattern, bloque_inmaculado, html)

with open("web/index.html", "w", encoding="utf-8") as f:
    f.write(new_html)

print("✅ Infección JSX erradicada. Código React reconstruido.")
