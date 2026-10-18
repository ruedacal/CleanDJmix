import re

with open("web/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 1. Limpiar la corrupción generada por el fallo de zsh/sed
html = re.sub(r'n<img ', r'\n<img ', html)
html = re.sub(r'n<div>', r'\n<div>', html)
html = re.sub(r'n</div>', r'\n</div>', html)

# 2. Asegurar que los IDs del reproductor inferior estén presentes
html = html.replace('<button className="w-12 h-12 rounded bg-djcyan-600', '<button id="global-play-btn" className="w-12 h-12 rounded bg-djcyan-600')
html = html.replace('https://placehold.co/100x100/18181b/22d3ee?text=MB', 'https://placehold.co/100x100/18181b/22d3ee?text=CleanDJ')
if 'id="player-cover"' not in html:
    html = html.replace('<img src="https://placehold.co/100x100/18181b/22d3ee?text=CleanDJ"', '<img id="player-cover" src="https://placehold.co/100x100/18181b/22d3ee?text=CleanDJ"')

# 3. Inyectar de forma segura las carátulas en la tabla de React
if 'http://localhost:8000/cover' not in html:
    html = re.sub(
        r'(<td className="py-2 px-4">)(\s*)(<div className="font-medium text-gray-200">)',
        r'\1\n\2<img src={`http://localhost:8000/cover?path=${encodeURIComponent(row.path)}`} className="w-10 h-10 rounded bg-djzinc-800 object-cover shrink-0" alt="cover" />\n\2<div>\n\2\3',
        html
    )
    html = re.sub(
        r'(<div className="text-[10px] text-gray-500 font-mono">\{row\.f\}</div>)(\s*)(</td>)',
        r'\1\n\2</div>\2\3',
        html
    )

with open("web/index.html", "w", encoding="utf-8") as f:
    f.write(html)
    
print("✅ Interfaz reparada y actualizada con éxito.")
