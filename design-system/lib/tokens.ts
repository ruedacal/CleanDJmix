/**
 * Single source of truth for documented token values.
 * These hex values MUST mirror the CSS custom properties in app/globals.css.
 */

export type SemanticToken = {
  token: string
  tailwind: string
  role: string
  light: string
  dark: string
}

export const semanticTokens: SemanticToken[] = [
  { token: '--background', tailwind: 'bg-background', role: 'App canvas, page body', light: '#FAFAFA', dark: '#09090B' },
  { token: '--surface', tailwind: 'bg-surface', role: 'Cards, decks, panels', light: '#FFFFFF', dark: '#121216' },
  { token: '--surface-2', tailwind: 'bg-surface-2', role: 'Nested wells, inputs, code', light: '#F4F4F5', dark: '#18181F' },
  { token: '--border', tailwind: 'border-border', role: 'Hairlines, dividers, outlines', light: '#E4E4E7', dark: '#2A2A35' },
  { token: '--foreground', tailwind: 'text-foreground', role: 'Primary text, icons', light: '#09090B', dark: '#F4F4F5' },
  { token: '--muted-foreground', tailwind: 'text-muted-foreground', role: 'Secondary text, labels', light: '#52525B', dark: '#A1A1AA' },
  { token: '--primary', tailwind: 'bg-primary / text-primary', role: 'Brand cyan — active, BPM, focus', light: '#0E7490', dark: '#22D3EE' },
  { token: '--primary-foreground', tailwind: 'text-primary-foreground', role: 'Text on primary fills', light: '#FFFFFF', dark: '#09090B' },
  { token: '--success', tailwind: 'bg-success / text-success', role: 'Analyzed, saved, mix-match', light: '#15803D', dark: '#4ADE80' },
  { token: '--warning', tailwind: 'bg-warning / text-warning', role: 'CUE, pending, attention', light: '#B45309', dark: '#FBBF24' },
  { token: '--destructive', tailwind: 'bg-destructive / text-destructive', role: 'Errors, delete, clipping', light: '#B91C1C', dark: '#F87171' },
]

export type Ramp = { name: string; tailwind: string; steps: { step: string; hex: string }[] }

export const ramps: Ramp[] = [
  {
    name: 'DJ Zinc (Neutral)',
    tailwind: 'djzinc',
    steps: [
      { step: '950', hex: '#09090B' },
      { step: '925', hex: '#101014' },
      { step: '900', hex: '#121216' },
      { step: '850', hex: '#18181F' },
      { step: '800', hex: '#202028' },
      { step: '750', hex: '#2A2A35' },
      { step: '700', hex: '#32323F' },
      { step: '600', hex: '#484858' },
    ],
  },
  {
    name: 'DJ Cyan (Primary)',
    tailwind: 'djcyan',
    steps: [
      { step: '200', hex: '#A5F3FC' },
      { step: '300', hex: '#67E8F9' },
      { step: '400', hex: '#22D3EE' },
      { step: '500', hex: '#06B6D4' },
      { step: '600', hex: '#0891B2' },
      { step: '700', hex: '#0E7490' },
      { step: '800', hex: '#155E75' },
      { step: '900', hex: '#164E63' },
    ],
  },
]

export const signalColors = [
  { name: 'Sub / Bass', band: '< 150 Hz', hex: '#3B82F6' },
  { name: 'Low-Mid / Drums', band: '150–800 Hz', hex: '#EF4444' },
  { name: 'Mid-High / Vocals', band: '800 Hz–4 kHz', hex: '#F59E0B' },
  { name: 'Treble / Hats', band: '> 4 kHz', hex: '#22D3EE' },
]

export function hexToRgb(hex: string) {
  const v = hex.replace('#', '')
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  }
}

export function rgbString(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${r} ${g} ${b})`
}

export const typeScale = [
  { name: 'Display', className: 'text-5xl font-semibold tracking-tight', px: 48, rem: '3rem', lineHeight: '1', usage: 'Hero / document title' },
  { name: 'H1', className: 'text-4xl font-semibold tracking-tight', px: 36, rem: '2.25rem', lineHeight: '1.11', usage: 'Page titles' },
  { name: 'H2', className: 'text-3xl font-semibold tracking-tight', px: 30, rem: '1.875rem', lineHeight: '1.2', usage: 'Section headers' },
  { name: 'H3', className: 'text-2xl font-semibold', px: 24, rem: '1.5rem', lineHeight: '1.33', usage: 'Panel titles' },
  { name: 'H4', className: 'text-xl font-medium', px: 20, rem: '1.25rem', lineHeight: '1.4', usage: 'Card titles, track names' },
  { name: 'Body L', className: 'text-lg leading-relaxed', px: 18, rem: '1.125rem', lineHeight: '1.625', usage: 'Lead paragraphs' },
  { name: 'Body', className: 'text-base leading-relaxed', px: 16, rem: '1rem', lineHeight: '1.625', usage: 'Default UI copy' },
  { name: 'Small', className: 'text-sm leading-6', px: 14, rem: '0.875rem', lineHeight: '1.5', usage: 'Dense tables, inputs' },
  { name: 'Label', className: 'font-mono text-xs uppercase tracking-widest', px: 12, rem: '0.75rem', lineHeight: '1.33', usage: 'Hardware labels, meta (non-body)' },
]

export const spacingScale = [
  { token: '0.5', px: 2, rem: '0.125rem', usage: 'Hairline offsets' },
  { token: '1', px: 4, rem: '0.25rem', usage: 'Icon ↔ text in badges' },
  { token: '2', px: 8, rem: '0.5rem', usage: 'Inline gaps, button icon gap' },
  { token: '3', px: 12, rem: '0.75rem', usage: 'Compact control padding' },
  { token: '4', px: 16, rem: '1rem', usage: 'Default component padding' },
  { token: '6', px: 24, rem: '1.5rem', usage: 'Card padding, grid gaps' },
  { token: '8', px: 32, rem: '2rem', usage: 'Panel padding' },
  { token: '12', px: 48, rem: '3rem', usage: 'Section rhythm (mobile)' },
  { token: '16', px: 64, rem: '4rem', usage: 'Section rhythm (desktop)' },
  { token: '24', px: 96, rem: '6rem', usage: 'Page-level separation' },
]

export const radiusScale = [
  { token: 'rounded-sm', value: 'calc(var(--radius) - 4px)', px: 2 },
  { token: 'rounded-md', value: 'calc(var(--radius) - 2px)', px: 4 },
  { token: 'rounded-lg', value: 'var(--radius)', px: 6 },
  { token: 'rounded-xl', value: 'calc(var(--radius) + 4px)', px: 10 },
]

export const breakpoints = [
  { name: 'base', min: 0, container: '100% · px-4', layout: 'Single column, bottom tab bar (Library · Acoustic · Cue Editor)' },
  { name: 'sm', min: 640, container: '100% · px-6', layout: 'Single column, wider controls' },
  { name: 'md', min: 768, container: '100% · px-6', layout: 'Two columns: library + inspector drawer' },
  { name: 'lg', min: 1024, container: 'max-w-7xl · px-8', layout: 'Three-column dashboard, side panels visible' },
  { name: 'xl', min: 1280, container: 'max-w-7xl · px-8', layout: 'Full deck + waveform + hot-cue grid' },
  { name: '2xl', min: 1536, container: 'max-w-screen-2xl · px-8', layout: 'Club-booth widescreen, dual deck' },
]
