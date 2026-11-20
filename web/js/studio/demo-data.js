export const CUE_COLORS = ["#f43f5e", "#fb923c", "#facc15", "#4ade80", "#22d3ee", "#22d3ee", "#a855f7", "#ec4899"];

const CUE_TEMPLATE = [
    { name: "Intro / Downbeat", bar: 1 },
    { name: "Percusión", bar: 17 },
    { name: "Bassline", bar: 33 },
    { name: "Breakdown 1", bar: 49 },
    { name: "Drop 1", bar: 65 },
    { name: "Breakdown 2", bar: 97 },
    { name: "Drop 2", bar: 113 },
    { name: "Outro Mix", bar: 145 },
];

export function barSeconds(bpm) {
    return (4 * 60) / (bpm || 128);
}

export function buildClubCues(bpm, duration) {
    const bar = barSeconds(bpm);
    return CUE_TEMPLATE.map((cue, index) => {
        const time = (cue.bar - 1) * bar;
        if (time >= duration - bar) return null;
        return { index, name: cue.name, time, color: CUE_COLORS[index] };
    });
}

const RAW_TRACKS = [
    ["Tales of the Desert", "Charlotte de Witte", "Tales EP", "Techno", "Peak Time", "Original Mix", 132, "8A", 88, 74, 372, "FLAC", "verified", 2],
    ["Burning Sky", "Chlär", "Burning Sky", "Techno", "Hard Techno", "Original Mix", 138, "9A", 93, 70, 341, "WAV", "verified", 4],
    ["Singularity", "Jon Hopkins", "Singularity", "Electronica", "Melodic", "Original Mix", 120, "7A", 61, 55, 394, "AIFF", "verified", 3],
    ["Starlight", "Kellie Allen", "Starlight", "House", "Tech House", "Extended Mix", 127, "8B", 76, 82, 318, "MP3", "verified", 1],
    ["Planet XX", "YellowHeads", "Planet XX", "Techno", "Peak Time", "Extended Mix", 133, "8A", 90, 72, 356, "FLAC", "fake", 5],
    ["Daytime", "4 Strings", "Daytime", "Trance", "Progressive", "Original Mix", 128, "10A", 72, 68, 402, "M4A", "verified", 6],
    ["W", "Cobblestone Jazz", "23 Seconds", "House", "Minimal", "Original Mix", 124, "8A", 64, 79, 498, "FLAC", "verified", 6],
    ["How Far Do We Go", "Drunken Kong", "How Far", "Techno", "Groove", "Original Mix", 130, "9B", 81, 77, 333, "WAV", "verified", 4],
    ["Room Mode", "Truncate", "Room Mode (Remixes)", "Techno", "Raw", "Allana Letm Remix", 131, "5A", 85, 71, 361, "MP3", "corrupt", 1],
    ["Eyes On Me", "Faye Wong", "Edits Vol. 2", "House", "Deep House", "Club Edit", 122, "8A", 58, 80, 287, "OGG", "verified", 2],
    ["Mirage", "Kölsch", "Mirage", "Techno", "Melodic", "Original Mix", 126, "7A", 69, 66, 455, "FLAC", "verified", 3],
    ["Redline", "Amelie Lens", "Redline EP", "Techno", "Peak Time", "Original Mix", 134, "11A", 92, 69, 310, "FLAC", "fake", 5],
];

const BITRATE = { FLAC: "24-bit / 44.1k", WAV: "24-bit / 48k", AIFF: "16-bit / 44.1k", MP3: "320 kbps", M4A: "256 kbps AAC", OGG: "320 kbps" };

export const DEMO_TRACKS = RAW_TRACKS.map((row, i) => {
    const [title, artist, album, genre, subgenre, version, bpm, key, energy, dance, duration, format, quality, cover] = row;
    return {
        id: `trk_${String(i + 1).padStart(3, "0")}`,
        title, artist, album, genre, subgenre, version,
        bpm, key, energy, dance, duration, format,
        bitrate: BITRATE[format],
        quality,
        cover: `/assets/studio/cover-${cover}.png`,
        cues: buildClubCues(bpm, duration),
        comment: `[${bpm} BPM | ${key}] Intro 32b · ${subgenre}`,
        path: `~/Music/DJ/${artist} - ${title}.${format.toLowerCase()}`,
    };
});

export const DEMO_CANDIDATES = (track) => [
    {
        id: "cand_1",
        confidence: 97,
        title: track.title,
        artist: track.artist,
        album: track.album,
        label: "KNTXT",
        year: 2024,
        genre: track.genre,
        bpm: track.bpm,
        key: track.key,
        isrc: "BE-A12-24-00031",
        cover: track.cover,
    },
    {
        id: "cand_2",
        confidence: 71,
        title: `${track.title} (Extended)`,
        artist: track.artist,
        album: `${track.album} (Deluxe)`,
        label: "Drumcode",
        year: 2023,
        genre: track.genre,
        bpm: track.bpm,
        key: track.key,
        isrc: "SE-D44-23-00912",
        cover: "/assets/studio/cover-4.png",
    },
    {
        id: "cand_3",
        confidence: 38,
        title: `${track.title} (Radio Edit)`,
        artist: `${track.artist} & Friends`,
        album: "Club Compilation 2022",
        label: "Afterlife",
        year: 2022,
        genre: "House",
        bpm: Math.round(track.bpm * 0.97),
        key: track.key,
        isrc: "GB-AFT-22-00117",
        cover: "/assets/studio/cover-5.png",
    },
];
