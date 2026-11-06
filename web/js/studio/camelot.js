export function parseCamelot(key) {
    const match = /^(\d{1,2})([AB])$/i.exec(String(key || "").trim());
    if (!match) return null;
    const number = Number(match[1]);
    if (number < 1 || number > 12) return null;
    return { number, letter: match[2].toUpperCase() };
}

function wheelDistance(a, b) {
    const diff = Math.abs(a - b) % 12;
    return Math.min(diff, 12 - diff);
}

export function keyRelation(keyA, keyB) {
    const a = parseCamelot(keyA);
    const b = parseCamelot(keyB);
    if (!a || !b) return "unknown";
    const distance = wheelDistance(a.number, b.number);
    if (distance === 0 && a.letter === b.letter) return "perfect";
    if (distance === 0) return "relative";
    if (distance === 1 && a.letter === b.letter) return "adjacent";
    if (distance === 2 && a.letter === b.letter) return "energy";
    return "clash";
}

const KEY_SCORES = { perfect: 1, adjacent: 0.9, relative: 0.85, energy: 0.6, clash: 0.15, unknown: 0.4 };

export function bpmDeltaPercent(refBpm, bpm) {
    if (!refBpm || !bpm) return Infinity;
    const candidates = [bpm, bpm * 2, bpm / 2];
    let best = Infinity;
    for (const value of candidates) {
        const pct = ((value - refBpm) / refBpm) * 100;
        if (Math.abs(pct) < Math.abs(best)) best = pct;
    }
    return best;
}

export function computeMatch(reference, track) {
    if (!reference || !track) return null;
    if (reference.id === track.id) return { score: 100, relation: "perfect", bpmDelta: 0 };
    const relation = keyRelation(reference.key, track.key);
    const bpmDelta = bpmDeltaPercent(reference.bpm, track.bpm);
    const bpmScore = Math.max(0, 1 - Math.abs(bpmDelta) / 8);
    const energyScore = 1 - Math.min(1, Math.abs((reference.energy || 0) - (track.energy || 0)) / 60);
    const score = Math.round(100 * (0.45 * KEY_SCORES[relation] + 0.4 * bpmScore + 0.15 * energyScore));
    return { score, relation, bpmDelta };
}

export function matchTone(score) {
    if (score == null) return "muted";
    if (score >= 80) return "good";
    if (score >= 55) return "warn";
    return "bad";
}

export const RELATION_LABEL = {
    perfect: "Misma clave",
    adjacent: "Adyacente ±1",
    relative: "Relativa A/B",
    energy: "Energy boost +2",
    clash: "Choque armónico",
    unknown: "Clave desconocida",
};
