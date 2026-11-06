import { Icon } from "./Icon.jsx";
import { cx } from "./primitives.jsx";

const { useRef, useState } = React;

const AUDIO_EXT = /\.(flac|wav|aiff?|mp3|m4a|aac|ogg|alac)$/i;
const FORMATS = ["FLAC", "WAV", "AIFF", "MP3", "M4A", "OGG"];

export function FileDropzone({ onFiles, compact = false }) {
    const [dragging, setDragging] = useState(false);
    const filesInput = useRef(null);
    const folderInput = useRef(null);

    const handleList = (fileList) => {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        const accepted = [];
        const rejected = [];
        files.forEach((file) => (AUDIO_EXT.test(file.name) ? accepted : rejected).push(file));
        onFiles(accepted, rejected);
    };

    return (
        <div
            onDragEnter={(e) => {
                e.preventDefault();
                setDragging(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
            }}
            onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleList(e.dataTransfer.files);
            }}
            className={cx(
                "group relative flex flex-col items-center justify-center rounded-2xl border border-dashed text-center transition-all",
                compact ? "gap-3 px-4 py-6" : "gap-4 px-5 py-8",
                dragging
                    ? "border-cyan-400 bg-cyan-400/5 shadow-[inset_0_0_40px_-10px_rgba(34,211,238,0.5)]"
                    : "border-zinc-800 bg-zinc-950 hover:border-zinc-700"
            )}
        >
            <div
                className={cx(
                    "flex h-12 w-12 items-center justify-center rounded-xl border transition-colors",
                    dragging ? "border-cyan-400 text-cyan-300" : "border-zinc-800 bg-zinc-900 text-zinc-400 group-hover:text-cyan-300"
                )}
            >
                <Icon name="upload" className="h-5 w-5" />
            </div>
            <div>
                <p className="text-sm font-semibold text-white">{dragging ? "Suelta para analizar" : "Arrastra carpetas o pistas"}</p>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">BPM, Key Camelot, Hot Cues y certificación lossless.</p>
            </div>
            <div className="flex w-full gap-2">
                <button
                    type="button"
                    onClick={() => filesInput.current && filesInput.current.click()}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-400 text-sm font-semibold text-zinc-950 transition-colors hover:bg-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                    Pistas
                </button>
                <button
                    type="button"
                    onClick={() => folderInput.current && folderInput.current.click()}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-800 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                    <Icon name="folder" className="h-4 w-4" />
                    Carpeta
                </button>
            </div>
            <ul className="flex flex-wrap justify-center gap-1" aria-label="Formatos compatibles">
                {FORMATS.map((format) => (
                    <li key={format} className="rounded border border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500">
                        {format}
                    </li>
                ))}
            </ul>
            <input
                ref={filesInput}
                type="file"
                multiple
                accept="audio/*,.flac,.aiff,.aif"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                    handleList(e.target.files);
                    e.target.value = "";
                }}
            />
            <input
                ref={folderInput}
                type="file"
                multiple
                webkitdirectory=""
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                    handleList(e.target.files);
                    e.target.value = "";
                }}
            />
        </div>
    );
}
