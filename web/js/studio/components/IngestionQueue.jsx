import { Icon } from "./Icon.jsx";
import { ProgressBar, SectionLabel, cx } from "./primitives.jsx";

const STATUS = {
    cola: { label: "En cola", tone: "muted", text: "text-zinc-500" },
    analizando: { label: "Analizando", tone: "cyan", text: "text-cyan-300" },
    listo: { label: "Listo", tone: "green", text: "text-emerald-400" },
    error: { label: "Error", tone: "red", text: "text-rose-400" },
};

export function IngestionQueue({ items, onClearDone, onRetry }) {
    const active = items.filter((item) => item.estado === "cola" || item.estado === "analizando");
    const errors = items.filter((item) => item.estado === "error");
    const done = items.filter((item) => item.estado === "listo");
    const overall = items.length ? items.reduce((sum, item) => sum + (item.progreso || 0), 0) / items.length : 0;

    return (
        <section aria-labelledby="queue-title" className="flex min-h-0 flex-col gap-3">
            <div className="flex items-center justify-between">
                <SectionLabel>
                    <span id="queue-title">Cola de ingesta</span>
                </SectionLabel>
                {done.length > 0 && (
                    <button type="button" onClick={onClearDone} className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 hover:text-zinc-200">
                        Limpiar ({done.length})
                    </button>
                )}
            </div>

            {items.length === 0 ? (
                <p className="rounded-xl border border-zinc-900 px-3 py-4 text-center text-xs text-zinc-600">Sin procesos en segundo plano.</p>
            ) : (
                <>
                    <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-3">
                        <div className="mb-2 flex items-baseline justify-between">
                            <span className="text-xs text-zinc-400">
                                {active.length > 0 ? `${active.length} en proceso` : "Lote completado"}
                            </span>
                            <span className="font-mono text-xs tabular-nums text-white">{Math.round(overall)}%</span>
                        </div>
                        <ProgressBar value={overall} tone={active.length ? "cyan" : "green"} label="Progreso total del lote" />
                    </div>

                    <ul className="flex flex-col gap-1.5" aria-live="polite">
                        {items.map((item) => {
                            const status = STATUS[item.estado] || STATUS.cola;
                            return (
                                <li
                                    key={item.id}
                                    className={cx(
                                        "rounded-lg border px-3 py-2",
                                        item.estado === "error" ? "border-rose-500/30 bg-rose-500/5" : "border-zinc-900 bg-zinc-950"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="min-w-0 flex-1 truncate text-xs text-zinc-200" title={item.nombre}>
                                            {item.nombre}
                                        </span>
                                        <span className={cx("shrink-0 font-mono text-[10px] uppercase", status.text)}>{status.label}</span>
                                    </div>
                                    {item.estado === "error" ? (
                                        <div className="mt-1 flex items-center justify-between gap-2">
                                            <p className="flex items-center gap-1 text-[11px] text-rose-400/80">
                                                <Icon name="alert" className="h-3 w-3" />
                                                {item.mensaje || "Archivo corrupto"}
                                            </p>
                                            {onRetry && item.ruta && (
                                                <button type="button" onClick={() => onRetry(item)} className="font-mono text-[10px] uppercase text-zinc-400 hover:text-white">
                                                    Reintentar
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        item.estado !== "listo" && <ProgressBar value={item.progreso} tone={status.tone} label={`Progreso de ${item.nombre}`} className="mt-2" />
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    {errors.length > 0 && (
                        <p className="text-[11px] text-rose-400">
                            {errors.length > 1 ? `${errors.length} archivos no se pudieron leer.` : "1 archivo no se pudo leer."}
                        </p>
                    )}
                </>
            )}
        </section>
    );
}
