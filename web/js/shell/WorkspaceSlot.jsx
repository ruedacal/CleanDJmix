const { useRef, memo } = React;

const FrozenWorkspace = memo(
    ({ children }) => children,
    (prev, next) => !prev.isActive && !next.isActive
);

/**
 * Contenedor de rendimiento para workspaces:
 * - Lazy-mount: no monta el árbol JSX hasta la primera visita.
 * - Freeze: bloquea re-renders provenientes de app.jsx mientras la pestaña está oculta,
 *   conservando intacto el estado interno del workspace.
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
            <FrozenWorkspace isActive={isActive}>
                {children}
            </FrozenWorkspace>
        </div>
    );
};
