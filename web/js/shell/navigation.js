// Information architecture: every workspace grouped by the DJ's mental workflow.
// Prepare (booth) → Collect (ingest) → Learn (lab). Copilot stays outside groups as the live mode.

export const NAV_GROUPS = [
    {
        id: 'booth',
        label: 'Cabina',
        items: [
            { id: 'audit', labelKey: 'nav_tab_audit', fallback: 'Biblioteca', icon: 'Library', hint: 'Auditoría FFT, tags y exportación' },
            { id: 'hotcues', labelKey: 'nav_tab_cues', fallback: 'Cues', icon: 'Cue', hint: 'Estudio de 8 Hot Cues y waveform' },
            { id: 'setbuilder', labelKey: 'nav_tab_sets', fallback: 'Sets', icon: 'Flow', hint: 'Set Builder y curva de energía' },
            { id: 'map', labelKey: 'nav_tab_map', fallback: 'Mapa', icon: 'Map', hint: 'Mapa 2D de compatibilidad', showTrackCount: true },
        ],
    },
    {
        id: 'ingest',
        label: 'Ingesta',
        items: [
            { id: 'spotify', labelKey: 'nav_tab_pool', fallback: 'Pool', icon: 'Spotify', hint: 'Record Pool y descargas' },
            { id: 'shazam', labelKey: 'nav_tab_radar', fallback: 'Radar', icon: 'Radar', hint: 'Identificación acústica' },
            { id: 'taxonomy', labelKey: 'nav_tab_crates', fallback: 'Crates', icon: 'Routing', hint: 'Taxonomía y subgéneros' },
        ],
    },
    {
        id: 'lab',
        label: 'Lab',
        items: [
            { id: 'trends', labelKey: 'nav_tab_trends', fallback: 'Tendencias', icon: 'Trends', hint: 'Tendencias de géneros' },
            { id: 'knowledge', labelKey: 'nav_tab_knowledge', fallback: 'Conocimiento', icon: 'Knowledge', hint: 'Academia DJ' },
        ],
    },
];

export const COPILOT_ITEM = { id: 'copilot', fallback: 'Copilot', icon: 'Turntable', hint: 'Monitor en vivo de cabina' };
export const LIBRARY_ITEM = { id: 'library', fallback: 'Colección', icon: 'Library', hint: 'Gestor y explorador de colecciones guardadas' };

export const MOBILE_PRIMARY_TABS = ['audit', 'hotcues', 'shazam', 'setbuilder'];

const ALL_ITEMS = [...NAV_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label }))), { ...COPILOT_ITEM, group: 'En vivo' }, { ...LIBRARY_ITEM, group: 'Gestión' }];

export const findNavItem = (id) => ALL_ITEMS.find((item) => item.id === id) || ALL_ITEMS[0];

// t() returns the key itself when a translation is missing, so fall back explicitly.
export const navLabel = (item, t) => {
    if (!item.labelKey || typeof t !== 'function') return item.fallback;
    const translated = t(item.labelKey);
    return translated && translated !== item.labelKey ? translated : item.fallback;
};
