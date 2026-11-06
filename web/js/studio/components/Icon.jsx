const PATHS = {
    play: <path d="M7 4.5v15l12-7.5z" fill="currentColor" stroke="none" />,
    pause: (
        <>
            <rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
            <rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
        </>
    ),
    search: (
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </>
    ),
    upload: (
        <>
            <path d="M12 15V3" />
            <path d="m7 8 5-5 5 5" />
            <path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
        </>
    ),
    folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
    library: (
        <>
            <path d="M4 4v16" />
            <path d="M8 4v16" />
            <path d="m12 4 4 16" />
            <path d="M18 4h2v16h-2" />
        </>
    ),
    radar: (
        <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="12" cy="12" r="1" fill="currentColor" />
            <path d="m12 12 6-6" />
        </>
    ),
    cues: (
        <>
            <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
            <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
            <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
        </>
    ),
    check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
    x: (
        <>
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
        </>
    ),
    alert: (
        <>
            <path d="M12 3 2 20h20z" />
            <path d="M12 10v4" />
            <path d="M12 17h.01" />
        </>
    ),
    more: (
        <>
            <circle cx="5" cy="12" r="1.3" fill="currentColor" />
            <circle cx="12" cy="12" r="1.3" fill="currentColor" />
            <circle cx="19" cy="12" r="1.3" fill="currentColor" />
        </>
    ),
    chevronDown: <path d="m6 9 6 6 6-6" />,
    arrowUp: <path d="m6 15 6-6 6 6" />,
    save: (
        <>
            <path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
            <path d="M7 3v5h8V3" />
            <path d="M7 21v-7h10v7" />
        </>
    ),
    download: (
        <>
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M4 19h16" />
        </>
    ),
    refresh: (
        <>
            <path d="M20 11a8 8 0 1 0-2.3 5.7" />
            <path d="M20 4v7h-7" />
        </>
    ),
    zap: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
    lock: (
        <>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </>
    ),
    mic: (
        <>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
        </>
    ),
    target: (
        <>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </>
    ),
    trash: (
        <>
            <path d="M4 7h16" />
            <path d="M9 7V4h6v3" />
            <path d="M6 7l1 13h10l1-13" />
        </>
    ),
    sparkles: (
        <>
            <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
            <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
        </>
    ),
    disc: (
        <>
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="2.5" />
        </>
    ),
};

export function Icon({ name, className = "h-4 w-4", strokeWidth = 1.8 }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            aria-hidden="true"
            focusable="false"
        >
            {PATHS[name]}
        </svg>
    );
}
