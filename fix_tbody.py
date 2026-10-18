import re

with open("web/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# El bloque tbody inmaculado y perfectamente cerrado
nuevo_tbody = """<tbody className="divide-y divide-djzinc-800/50">
                                    {tracks.length === 0 && !isAuditing && (
                                        <tr>
                                            <td colSpan="8" className="py-10 text-center text-gray-500 text-sm">
                                                No hay pistas cargadas. Haz clic en "Auditar Directorio" o selecciona tu carpeta.
                                            </td>
                                        </tr>
                                    )}
                                    {isAuditing && (
                                        <tr>
                                            <td colSpan="8" className="py-10 text-center text-djcyan-500 text-sm animate-pulse">
                                                Analizando archivos en disco...
                                            </td>
                                        </tr>
                                    )}
                                    {tracks.map((row) => (
                                        <tr
                                            key={row.id}
                                            onClick={() => setSelectedTrack(row.id === selectedTrack ? null : row.id)}
                                            className={`group hover:bg-djzinc-800/50 transition-colors cursor-pointer ${selectedTrack === row.id ? 'bg-djzinc-800/80' : ''}`}
                                        >
                                            <td className="py-2 px-4 text-center relative w-10">
                                                {selectedTrack === row.id ? (
                                                    <span className="text-djcyan-400 animate-pulse flex justify-center"><Icons.Play /></span>
                                                ) : (
                                                    <span className="text-djzinc-600 text-xs group-hover:hidden">{row.id}</span>
                                                )}
                                                <button className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-300 hover:text-white ${selectedTrack === row.id ? 'hidden' : 'hidden group-hover:block'}`}>
                                                    <Icons.Play />
                                                </button>
                                            </td>
                                            <td className="py-2 px-4 flex items-center gap-3">
                                                <img src={`http://localhost:8000/cover?path=${encodeURIComponent(row.path || '')}`} className="w-10 h-10 rounded bg-djzinc-800 object-cover shrink-0" alt="cover" />
                                                <div className="flex flex-col text-left">
                                                    <div className="font-medium text-gray-200 truncate w-64" title={row.t || row.titulo || row.f}>{row.t || row.titulo || row.f || 'Desconocido'}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono truncate w-64" title={row.f}>{row.f || ''}</div>
                                                </div>
                                            </td>
                                            <td className="py-2 px-4 text-gray-400">{row.a || row.artist || row.artista || 'Desconocido'}</td>
                                            <td className="py-2 px-4 text-gray-400 font-mono text-xs">{row.duration || row.duracion || '0:00'}</td>
                                            <td className="py-2 px-4">
                                                <span className="bg-djzinc-800 text-gray-300 px-2 py-1 rounded text-xs font-mono">{row.b || row.bpm || '--'}</span>
                                            </td>
                                            <td className="py-2 px-4">
                                                <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${(row.k || row.key) ? 'bg-djcyan-900/30 text-djcyan-400' : 'bg-djzinc-800 text-gray-500'}`}>
                                                    {row.k || row.key || '--'}
                                                </span>
                                            </td>
                                            <td className="py-2 px-4 w-32">
                                                <div className="flex gap-0.5 items-end h-4">
                                                    {[...Array(5)].map((_, i) => (
                                                        <div key={i} className={`w-1.5 rounded-t-sm ${i < (row.e || row.energy || 0) / 20 ? 'bg-djgreen-500' : 'bg-djzinc-700'}`} style={{ height: `${Math.max(20, (i + 1) * 20)}%` }}></div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-2 px-4">
                                                {(row.s === 'Ready' || row.status === 'Ready') ? (
                                                    <span className="flex items-center gap-1 text-djgreen-500 text-xs font-medium"><Icons.Check /> Ready</span>
                                                ) : (row.s === 'Missing Meta' || row.status === 'Missing Meta') ? (
                                                    <span className="flex items-center gap-1 text-amber-500 text-xs font-medium"><Icons.Warning /> Meta</span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-gray-500 text-xs font-medium">{row.s || row.status || 'Pending'}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>"""

# Sustituir todo el tbody antiguo por el nuevo
html_corregido = re.sub(r'<tbody className="divide-y divide-djzinc-800/50">.*?</tbody>', nuevo_tbody, html, flags=re.DOTALL)

with open("web/index.html", "w", encoding="utf-8") as f:
    f.write(html_corregido)

print("✅ Tabla JSX reconstruida con precisión quirúrgica. Babel está feliz.")
