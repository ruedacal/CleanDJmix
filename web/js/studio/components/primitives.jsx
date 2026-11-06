import { Icon } from "./Icon.jsx";

const { useEffect, useRef, useState } = React;

export function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

const PROGRESS_TONES = {
    cyan: "bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]",
    green: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]",
    red: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]",
    muted: "bg-zinc-500",
};

export function ProgressBar({ value, tone = "cyan", label, className }) {
    const clamped = Math.max(0, Math.min(100, value || 0));
    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(clamped)}
            aria-label={label}
            className={cx("h-1 w-full overflow-hidden rounded-full bg-zinc-800", className)}
        >
            <div className={cx("h-full rounded-full transition-[width] duration-300", PROGRESS_TONES[tone])} style={{ width: `${clamped}%` }} />
        </div>
    );
}

const BUTTON_VARIANTS = {
    primary: "bg-cyan-400 text-zinc-950 hover:bg-cyan-300 shadow-[0_0_24px_-6px_rgba(34,211,238,0.8)]",
    success: "bg-emerald-400 text-zinc-950 hover:bg-emerald-300 shadow-[0_0_24px_-6px_rgba(52,211,153,0.8)]",
    ghost: "text-zinc-300 hover:text-white hover:bg-zinc-900",
    outline: "border border-zinc-800 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900",
    danger: "border border-rose-500/40 text-rose-400 hover:bg-rose-500/10",
};

export function Button({ variant = "outline", size = "md", className, children, ...props }) {
    const sizes = { sm: "h-8 px-2.5 text-xs gap-1.5", md: "h-10 px-3.5 text-sm gap-2", lg: "h-12 px-5 text-sm gap-2" };
    return (
        <button
            type="button"
            className={cx(
                "inline-flex select-none items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-40",
                sizes[size],
                BUTTON_VARIANTS[variant],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}

export function IconButton({ label, icon, className, iconClassName = "h-4 w-4", ...props }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            className={cx(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                className
            )}
            {...props}
        >
            <Icon name={icon} className={iconClassName} />
        </button>
    );
}

export function Toggle({ pressed, onChange, children, icon }) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(!pressed)}
            className={cx(
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                pressed ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-300" : "border-zinc-800 text-zinc-500 hover:text-zinc-200"
            )}
        >
            {icon && <Icon name={icon} className="h-3.5 w-3.5" />}
            {children}
        </button>
    );
}

export function Segmented({ value, onChange, options, label, className }) {
    return (
        <div role="tablist" aria-label={label} className={cx("flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5", className)}>
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(option.value)}
                        className={cx(
                            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400",
                            active ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-200"
                        )}
                    >
                        {option.icon && <Icon name={option.icon} className="h-3.5 w-3.5" />}
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

export function Menu({ label, items, align = "right", trigger }) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onPointer = (event) => {
            if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
        };
        const onKey = (event) => event.key === "Escape" && setOpen(false);
        document.addEventListener("pointerdown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div ref={rootRef} className="relative">
            {trigger ? (
                trigger({ open, toggle: () => setOpen((v) => !v) })
            ) : (
                <IconButton label={label} icon="more" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} />
            )}
            {open && (
                <div
                    role="menu"
                    className={cx(
                        "absolute z-40 mt-1 min-w-[220px] rounded-xl border border-zinc-800 bg-zinc-950/95 p-1 shadow-2xl shadow-black backdrop-blur",
                        align === "right" ? "right-0" : "left-0"
                    )}
                >
                    {items.map((item) =>
                        item.separator ? (
                            <div key={item.key} className="my-1 h-px bg-zinc-800" />
                        ) : (
                            <button
                                key={item.key}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setOpen(false);
                                    item.onSelect();
                                }}
                                className={cx(
                                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-zinc-900 focus-visible:bg-zinc-900 focus-visible:outline-none",
                                    item.danger ? "text-rose-400" : "text-zinc-200"
                                )}
                            >
                                {item.icon && <Icon name={item.icon} className="h-4 w-4 text-zinc-500" />}
                                <span className="flex-1">{item.label}</span>
                                {item.hint && <span className="font-mono text-[10px] text-zinc-600">{item.hint}</span>}
                            </button>
                        )
                    )}
                </div>
            )}
        </div>
    );
}

export function Sheet({ open, onClose, title, children }) {
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (event) => event.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={title}>
            <button type="button" aria-label="Cerrar" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-zinc-800 bg-zinc-950 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3">
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-700" aria-hidden="true" />
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white">{title}</h2>
                    <IconButton label="Cerrar" icon="x" onClick={onClose} />
                </div>
                {children}
            </div>
        </div>
    );
}

export function SectionLabel({ children, className }) {
    return <p className={cx("font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500", className)}>{children}</p>;
}

export function formatTime(seconds) {
    const total = Math.max(0, seconds || 0);
    const m = Math.floor(total / 60);
    const s = Math.floor(total % 60);
    const cs = Math.floor((total * 100) % 100);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}
