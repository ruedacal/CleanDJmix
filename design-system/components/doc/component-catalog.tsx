'use client'

import { Magnet, Play, Save, Search } from 'lucide-react'
import { ComponentCard, type ComponentSpec } from './component-card'

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

const specs: ComponentSpec[] = [
  {
    name: 'Button / Primary',
    description: 'One per view. Commits a destructive-to-disk or high-value action (save track, export batch).',
    base: `inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80 disabled:pointer-events-none disabled:opacity-40 ${focusRing}`,
    states: {
      hover: 'bg-primary/90',
      active: 'bg-primary/80 translate-y-px',
      focus: 'ring-2 ring-ring ring-offset-2 ring-offset-background',
      disabled: 'pointer-events-none opacity-40',
    },
    render: (className, disabled) => (
      <button type="button" className={className} disabled={disabled}>
        <Save className="size-4" aria-hidden="true" />
        Save track to disk
      </button>
    ),
  },
  {
    name: 'Button / Secondary',
    description: 'Neutral outline button for navigation and reversible actions (change folder, view list).',
    base: `inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-surface-2 active:bg-border disabled:pointer-events-none disabled:opacity-40 ${focusRing}`,
    states: {
      hover: 'bg-surface-2',
      active: 'bg-border',
      focus: 'ring-2 ring-ring ring-offset-2 ring-offset-background',
      disabled: 'pointer-events-none opacity-40',
    },
    render: (className, disabled) => (
      <button type="button" className={className} disabled={disabled}>
        View list (12)
      </button>
    ),
  },
  {
    name: 'Hot Cue Pad',
    description: 'Performance pad. Idle pads stay neutral; colour appears only when the pad is set or triggered.',
    base: `flex w-48 flex-col gap-2 rounded-lg border border-border bg-surface-2 p-3 text-left transition-colors hover:border-destructive/60 active:bg-destructive/15 disabled:pointer-events-none disabled:opacity-40 ${focusRing}`,
    states: {
      hover: 'border-destructive/60',
      active: 'border-destructive bg-destructive/15 shadow-[0_0_0_1px_var(--destructive)]',
      focus: 'ring-2 ring-ring ring-offset-2 ring-offset-background',
      disabled: 'pointer-events-none opacity-40',
    },
    render: (className, disabled) => (
      <button type="button" className={className} disabled={disabled} aria-label="Hot cue pad 1, Intro / Downbeat, 00:01.50, bar 1">
        <span className="flex items-center justify-between">
          <span className="rounded-sm bg-background px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">PAD 1</span>
          <span className="size-2 rounded-full bg-destructive" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-foreground">Intro / Downbeat</span>
        <span className="flex justify-between font-mono text-xs text-muted-foreground">
          <span>00:01.50</span>
          <span>Bar 1</span>
        </span>
      </button>
    ),
  },
  {
    name: 'Transport / Play',
    description: '56px circular transport control. Always visible, always keyboard-reachable (Space).',
    base: `inline-flex size-14 items-center justify-center rounded-full border-2 border-success text-success transition-colors hover:bg-success/10 active:bg-success active:text-background disabled:pointer-events-none disabled:opacity-40 ${focusRing}`,
    states: {
      hover: 'bg-success/10',
      active: 'bg-success text-background',
      focus: 'ring-2 ring-ring ring-offset-2 ring-offset-background',
      disabled: 'pointer-events-none opacity-40',
    },
    render: (className, disabled) => (
      <button type="button" className={className} disabled={disabled} aria-label="Play deck 1">
        <Play className="size-6 fill-current" aria-hidden="true" />
      </button>
    ),
  },
  {
    name: 'Toggle Chip',
    description: 'Binary mode switch for the waveform toolbar (Snap, Grid, Follow). Uses aria-pressed.',
    base: `inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground aria-pressed:border-primary/60 aria-pressed:text-primary disabled:pointer-events-none disabled:opacity-40 ${focusRing}`,
    states: {
      hover: 'text-foreground',
      active: 'border-primary/60 bg-primary/10 text-primary',
      focus: 'ring-2 ring-ring ring-offset-2 ring-offset-background',
      disabled: 'pointer-events-none opacity-40',
    },
    render: (className, disabled) => (
      <button type="button" className={className} disabled={disabled} aria-pressed="true">
        <Magnet className="size-3.5" aria-hidden="true" />
        Snap: On
      </button>
    ),
  },
  {
    name: 'Search Input',
    description: 'Library filter. Visible label for screen readers, 16px text to avoid iOS zoom.',
    base: `h-10 w-64 rounded-md border border-border bg-surface-2 pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground transition-colors hover:border-muted-foreground/50 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`,
    states: {
      hover: 'border-muted-foreground/50',
      active: 'border-primary',
      focus: 'ring-2 ring-ring ring-offset-2 ring-offset-background',
      disabled: 'cursor-not-allowed opacity-40',
    },
    render: (className, disabled) => (
      <div className="relative">
        <label htmlFor="ds-search" className="sr-only">
          Search library
        </label>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input id="ds-search" type="search" placeholder="Artist, title, key…" className={className} disabled={disabled} />
      </div>
    ),
  },
]

const badges = [
  { label: '128.0 BPM', className: 'border-primary/40 bg-primary/10 text-primary' },
  { label: '8A', className: 'border-border bg-surface-2 text-foreground' },
  { label: 'Analyzed', className: 'border-success/40 bg-success/10 text-success' },
  { label: 'Pending', className: 'border-warning/40 bg-warning/10 text-warning' },
  { label: 'Clipping', className: 'border-destructive/40 bg-destructive/10 text-destructive' },
]

export function ComponentCatalog() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {specs.map((spec) => (
          <ComponentCard key={spec.name} spec={spec} />
        ))}
      </div>
      <article className="print-avoid flex flex-col gap-4 rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold text-foreground">Status Badge</h3>
          <p className="text-sm leading-6 text-muted-foreground">
            Non-interactive. Tinted fill at 10%, border at 40%, text at full token. Never rely on colour alone — the label carries meaning.
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <li key={b.label} className={`rounded-sm border px-2 py-0.5 font-mono text-xs font-semibold ${b.className}`}>
              {b.label}
            </li>
          ))}
        </ul>
        <code className="rounded-md bg-surface-2 p-3 font-mono text-xs leading-5 text-foreground">
          rounded-sm border px-2 py-0.5 font-mono text-xs font-semibold border-primary/40 bg-primary/10 text-primary
        </code>
      </article>
    </div>
  )
}
