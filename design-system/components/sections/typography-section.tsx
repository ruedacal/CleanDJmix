import { DocSection, SubHeading } from '@/components/doc/doc-section'
import { radiusScale, spacingScale, typeScale } from '@/lib/tokens'

const families = [
  { name: 'Inter', token: 'font-sans', role: 'UI, headings, body copy', sample: 'Cobblestone Jazz — W', className: 'font-sans' },
  { name: 'JetBrains Mono', token: 'font-mono', role: 'BPM, key, time, dB, labels, code', sample: '128.0 BPM · 8A · 00:01.50', className: 'font-mono' },
]

export function TypographySection() {
  return (
    <DocSection
      id="typography"
      title="Typography & spacing"
      description="Two families, a 1.2 modular type scale and a 4px base grid. Body text never drops below 14px; mono labels at 12px are reserved for hardware-style meta, never paragraphs."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {families.map((f) => (
          <div key={f.name} className="print-avoid flex flex-col gap-4 rounded-lg border border-border bg-surface p-6">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-semibold text-foreground">{f.name}</h3>
              <code className="font-mono text-xs text-primary">{f.token}</code>
            </div>
            <p className={`${f.className} text-3xl font-semibold tracking-tight text-foreground`}>{f.sample}</p>
            <p className="text-sm leading-6 text-muted-foreground">{f.role}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <SubHeading>Modular type scale</SubHeading>
        <ol className="flex flex-col divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
          {typeScale.map((t) => (
            <li key={t.name} className="print-avoid grid gap-3 p-4 md:grid-cols-[8rem_1fr_14rem] md:items-center">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{t.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {t.px}px · {t.rem} · lh {t.lineHeight}
                </span>
              </div>
              <p className={`${t.className} truncate text-foreground`}>Peak time selection</p>
              <div className="flex flex-col gap-0.5">
                <code className="font-mono text-xs text-primary">{t.className}</code>
                <span className="text-xs leading-5 text-muted-foreground">{t.usage}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <SubHeading>Spacing grid (4px base)</SubHeading>
          <ol className="flex flex-col gap-2">
            {spacingScale.map((s) => (
              <li key={s.token} className="grid grid-cols-[3rem_5rem_1fr] items-center gap-4 text-sm sm:grid-cols-[3rem_7rem_1fr_12rem]">
                <code className="font-mono text-xs font-semibold text-foreground">{s.token}</code>
                <span className="font-mono text-xs text-muted-foreground">
                  {s.px}px / {s.rem}
                </span>
                <span className="h-3 rounded-sm bg-primary" style={{ width: `${Math.min(s.px * 2, 100)}%`, maxWidth: `${s.px * 2}px` }} aria-hidden="true" />
                <span className="hidden text-xs leading-5 text-muted-foreground sm:block">{s.usage}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm leading-6 text-muted-foreground">
            Spacing is always applied with <code className="font-mono text-xs text-foreground">gap-*</code> on flex/grid parents. Never mix
            margin/padding with gap on the same element, and never use <code className="font-mono text-xs text-foreground">space-*</code>.
          </p>
        </div>
        <div className="flex flex-col gap-6">
          <SubHeading>Corner radius</SubHeading>
          <ul className="grid grid-cols-2 gap-3">
            {radiusScale.map((r) => (
              <li key={r.token} className="flex flex-col items-center gap-2 rounded-lg border border-border bg-surface p-4">
                <span className="size-12 border-2 border-primary bg-primary/10" style={{ borderRadius: r.px }} aria-hidden="true" />
                <code className="font-mono text-xs text-foreground">{r.token}</code>
                <span className="font-mono text-[11px] text-muted-foreground">{r.px}px</span>
              </li>
            ))}
          </ul>
          <p className="text-sm leading-6 text-muted-foreground">
            Base <code className="font-mono text-xs text-foreground">--radius: 0.375rem</code>. Circular controls (play, CUE, knobs) use{' '}
            <code className="font-mono text-xs text-foreground">rounded-full</code>.
          </p>
        </div>
      </div>
    </DocSection>
  )
}
