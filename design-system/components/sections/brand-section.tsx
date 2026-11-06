import { Contrast, Eye, Gauge, MonitorSmartphone } from 'lucide-react'
import { ScreenFigure } from '@/components/doc/screen-figure'
import { SubHeading } from '@/components/doc/doc-section'
import { DOC_DATE, DOC_ID, DOC_VERSION } from '@/lib/sections'

const principles = [
  {
    icon: Contrast,
    title: 'True low-light',
    rule: 'Dark mode is the primary environment. Canvas is #09090B, never pure black, so surfaces can step up in luminance without halos.',
    dont: 'Do not use white fills larger than a button in dark mode.',
  },
  {
    icon: Eye,
    title: 'Selective exposure',
    rule: 'Only the active deck, playhead and the focused control carry saturated color. Everything else stays in the zinc ramp.',
    dont: 'Do not colour idle pads, inactive tabs or static labels.',
  },
  {
    icon: Gauge,
    title: 'Data before decoration',
    rule: 'BPM, key, time and dB are the product. They render in tabular mono so values never jitter while a track plays.',
    dont: 'Do not animate numbers or add icons that are not actionable.',
  },
  {
    icon: MonitorSmartphone,
    title: 'One codebase, every booth',
    rule: 'Desktop booth, laptop and tablet remote share components. Layout adapts; controls keep a 44px minimum touch target.',
    dont: 'Do not hide core transport controls behind menus on small screens.',
  },
]

const meta = [
  { label: 'Product', value: 'BeatWave PRO (CleanDJmix)' },
  { label: 'Target stack', value: 'Next.js App Router · React · Tailwind v4 · TS' },
  { label: 'Document', value: `${DOC_ID} · ${DOC_VERSION}` },
  { label: 'Revision', value: DOC_DATE },
]

export function BrandSection() {
  return (
    <section id="brand" aria-labelledby="brand-title" className="print-break flex flex-col gap-14 pb-16 pt-10">
      <header className="flex flex-col gap-6">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Technical Handover Specification · § 01 / 07</p>
        <h1 id="brand-title" className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
          Precision audio intelligence, designed for the dark booth.
        </h1>
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          This document is the single source of truth for the BeatWave PRO interface: tokens, components, accessibility rules and the
          frontend architecture. Every value here maps 1:1 to a CSS variable or Tailwind class in the codebase.
        </p>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
          {meta.map((m) => (
            <div key={m.label} className="flex flex-col gap-1 bg-surface p-4">
              <dt className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{m.label}</dt>
              <dd className="text-sm font-medium leading-6 text-foreground">{m.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <ScreenFigure
        src="/screens/dashboard_completo.webp"
        alt="BeatWave PRO Cue Editor: vinyl deck with BPM and key badges, 3-band EQ, eight hot-cue pads, a full-width multiband waveform and the DJ tactical comment panel."
        figure="Fig. 1"
        caption="Production Cue Editor. Note how saturated colour is reserved for the waveform, the active pad and the primary actions — the rest of the chrome stays neutral."
      />

      <div className="flex flex-col gap-6">
        <SubHeading>Design principles</SubHeading>
        <ul className="grid gap-4 md:grid-cols-2">
          {principles.map(({ icon: Icon, title, rule, dont }) => (
            <li key={title} className="print-avoid flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
              <div className="flex items-center gap-3">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              </div>
              <p className="leading-relaxed text-foreground">{rule}</p>
              <p className="border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                <span className="font-mono text-xs font-semibold uppercase tracking-widest text-destructive">{"Don't · "}</span>
                {dont}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SubHeading>Voice &amp; tone</SubHeading>
          <p className="leading-relaxed text-foreground">
            Short, technical, booth-ready. Labels read like hardware silkscreen — <span className="font-mono text-sm">CUE</span>,{' '}
            <span className="font-mono text-sm">SYNC</span>, <span className="font-mono text-sm">SNAP: ON</span> — and help text explains
            outcomes, not features.
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <SubHeading>Wordmark</SubHeading>
          <div className="flex items-center justify-between rounded-lg border border-border bg-djzinc-950 p-6">
            <span className="text-2xl font-black tracking-tight text-djcyan-400">
              BEAT<span className="text-djzinc-600"> </span>
              <span className="text-[#F4F4F5]">WAVE</span>
            </span>
            <span className="rounded-sm border border-djcyan-400/50 px-1.5 py-0.5 font-mono text-xs font-semibold text-djcyan-400">PRO</span>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">Always on the dark canvas. Minimum clear space equals the cap height of “B”.</p>
        </div>
      </div>
    </section>
  )
}
