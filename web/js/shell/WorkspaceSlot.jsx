const { useRef, memo, createContext, useContext } = React;

export const WorkspaceActiveContext = createContext(true);

/**
 * Hook para pausar requestAnimationFrame / setInterval cuando la pestaña está oculta.
 */
export const useWorkspaceActive = () => useContext(WorkspaceActiveContext);

const FrozenWorkspace = memo(
    ({ children }) => children,
    (prev, next) => !prev.isActive && !next.isActive
);

/**
 * Contenedor de rendimiento para workspaces:
 * - Lazy-mount: no monta el árbol JSX hasta la primera visita.
 * - Freeze: bloquea re-renders provenientes de app.jsx mientras la pestaña está oculta,
 *   permitiendo exactamente 1 render de transición (true -> false) para pausar loops.
 */
export const WorkspaceSlot = ({ isActive, className = "w-full h-full", children }) => {
    const hasMountedRef = useRef(false);
    if (isActive) hasMountedRef.current = true;

    if (!hasMountedRef.current) return null;

    return (
        <div
            style={{ display: isActive ? 'flex' : 'none' }}
            className={className}
            aria-hidden={!isActive}
        >
            <WorkspaceActiveContext.Provider value={isActive}>
                <FrozenWorkspace isActive={isActive}>
                    {children}
                </FrozenWorkspace>
            </WorkspaceActiveContext.Provider>
        </div>
    );
};
