export const LogsWorkspace = ({ logs, setLogs }) => {
    return React.createElement("div", {className: "flex flex-col h-full p-6 w-full bg-black font-mono"},
        React.createElement("div", {className: "flex justify-between items-center mb-4"},
            React.createElement("div", {className: "flex items-center gap-3"},
                React.createElement("span", {className: "text-djcyan-400 font-bold"}, "⚡"),
                React.createElement("h2", {className: "text-sm font-bold text-gray-400 uppercase tracking-widest"}, "System Console")
            ),
            React.createElement("div", {className: "flex gap-3"},
                React.createElement("button", {onClick: () => setLogs([]), className: "text-xs text-djcyan-400 hover:text-white transition-colors cursor-pointer"}, "[ Clear ]"),
                React.createElement("button", {className: "text-xs text-gray-500 hover:text-white transition-colors cursor-pointer"}, "[ Export .log ]")
            )
        ),
        React.createElement("div", {className: "flex-1 border border-djzinc-800 rounded p-4 text-xs overflow-auto flex flex-col-reverse shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]"},
            React.createElement("div", null,
                logs.map((log, idx) => 
                    React.createElement("div", {key: idx, className: `mb-1 ${log.type === 'info' ? 'text-djcyan-500' : log.type === 'success' ? 'text-djgreen-400' : log.type === 'warn' ? 'text-amber-400' : 'text-gray-300'}`},
                        log.text
                    )
                ),
                React.createElement("div", {className: "flex items-center gap-2 mt-2"},
                    React.createElement("span", {className: "w-2 h-4 bg-djcyan-400 animate-pulse"})
                )
            )
        )
    );
};
