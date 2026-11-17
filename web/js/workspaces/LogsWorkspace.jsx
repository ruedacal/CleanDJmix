const { useState } = React;
import { Icons } from '../shell/icons.jsx';

// Espacio de Trabajo: Consola de Sistema / Logs
export const LogsWorkspace = ({ logs, setLogs }) => (
    <div className="flex flex-col h-full p-6 w-full bg-black font-mono">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <Icons.Terminal />
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">System Console</h2>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={() => setLogs([])} className="text-xs text-djcyan-400 hover:text-white transition-colors cursor-pointer">[ Clear ]</button>
                <button className="text-xs text-gray-500 hover:text-white transition-colors cursor-pointer">[ Export .log ]</button>
            </div>
        </div>
        <div className="flex-1 border border-djzinc-800 rounded p-4 text-xs overflow-auto flex flex-col-reverse shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
            <div>
                {logs.map((log, idx) => (
                    <div key={idx} className={`mb-1 ${log.type === 'info' ? 'text-djcyan-500' : log.type === 'success' ? 'text-djgreen-400' : log.type === 'warn' ? 'text-amber-400' : log.type === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                        {log.text}
                    </div>
                ))}
                <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-4 bg-djcyan-400 animate-pulse"></span>
                </div>
            </div>
        </div>
    </div>
);

