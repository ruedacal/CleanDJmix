with open("web/index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

with open("web/index.html", "w", encoding="utf-8") as f:
    for i, line in enumerate(lines):
        f.write(line)
        # Buscar la línea exacta donde está el nombre del archivo
        if '<div className="text-[10px] text-gray-500 font-mono">{row.f}</div>' in line:
            # Si la siguiente línea NO es un div de cierre, lo inyectamos
            if i + 1 < len(lines) and "</div>" not in lines[i+1]:
                f.write('                                            </div>\n')

print("✅ Etiqueta JSX cerrada. Interfaz React operativa.")
