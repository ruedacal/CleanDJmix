export const TaxonomyWorkspace = () => {
    return React.createElement("div", {className: "flex flex-col h-full p-6 w-full overflow-auto bg-djzinc-950 text-gray-300"},
        React.createElement("div", {className: "mb-6 flex justify-between items-end border-b border-djzinc-800 pb-4"},
            React.createElement("div", null,
                React.createElement("h2", {className: "text-xl font-bold text-white mb-1"}, "Ruteo de Destinos (Serato Crates)"),
                React.createElement("p", {className: "text-gray-400 text-sm"}, "Define dónde se guardan los archivos físicos basándose en su género principal.")
            ),
            React.createElement("button", {className: "bg-djzinc-800 hover:bg-djzinc-700 border border-djzinc-600 text-white px-4 py-2 rounded text-sm font-medium cursor-pointer"}, "Añadir Nueva Regla")
        ),
        React.createElement("div", {className: "bg-djzinc-900 border border-djzinc-700 rounded-xl mb-6 shadow-lg overflow-hidden"},
            React.createElement("div", {className: "bg-gradient-to-r from-djzinc-800 to-djzinc-900 px-5 py-3 border-b border-djzinc-700 flex items-center gap-3"},
                React.createElement("div", {className: "w-3 h-3 rounded-full bg-djcyan-500 shadow-[0_0_8px_#06b6d4]"}),
                React.createElement("h3", {className: "font-bold text-white tracking-wide"}, "TECHNO ", React.createElement("span", {className: "font-normal text-gray-500 text-xs ml-2"}, "(Raíz Serato)"))
            ),
            React.createElement("div", {className: "p-2"},
                ['Hard Techno', 'Melodic Techno', 'Peak Time'].map(sub => 
                    React.createElement("div", {key: sub, className: "flex gap-4 items-center p-3 hover:bg-djzinc-800/50 rounded-lg group transition-colors"},
                        React.createElement("div", {className: "w-6 h-6 border-l-2 border-b-2 border-djzinc-700 rounded-bl-lg ml-2 opacity-50"}),
                        React.createElement("div", {className: "w-32 text-sm font-bold text-gray-300"}, sub),
                        React.createElement("div", {className: "flex-1 flex items-center gap-2"},
                            React.createElement("span", {className: "text-xs text-gray-600 uppercase font-mono"}, "➡ Ruta Fija:"),
                            React.createElement("input", {type: "text", defaultValue: `/Music/Serato/Techno/${sub}/`, className: "flex-1 bg-djzinc-950 border border-djzinc-800 rounded px-3 py-2 text-xs font-mono text-gray-400 focus:border-djcyan-500 outline-none transition-colors"}),
                            React.createElement("button", {className: "bg-djzinc-800 hover:bg-djzinc-700 border border-djzinc-600 rounded p-2 text-gray-400 cursor-pointer"}, "📁")
                        )
                    )
                )
            )
        )
    );
};
