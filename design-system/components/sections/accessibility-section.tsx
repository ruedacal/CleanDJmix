import { Check, X } from 'lucide-react'
import { DocSection, SubHeading } from '@/components/doc/doc-section'
import { contrastRatio, wcagGrades } from '@/lib/contrast'
import { semanticTokens } from '@/lib/tokens'

const tokenHex = Object.fromEntries(semanticTokens.map((t) => [t.token, { light: t.light, dark: t.dark }]))

const pairs = [
  { fg: '--foreground', bg: '--background', use: 'Body text on canvas' },
  { fg: '--foreground', bg: '--surface', use: 'Text in cards & decks' },
  { fg: '--muted-foreground', bg: '--background', use: 'Labels, captions' },
  { fg: '--muted-foreground', bg: '--surface-2', use: 'Labels in wells / inputs' },
  { fg: '--primary', bg: '--background', use: 'BPM readout, links' },
  { fg: '--primary-foreground', bg: '--primary', use: 'Primary button label' },
  { fg: '--success', bg: '--surface', use: 'Analyzed status' },
  { fg: '--warning', bg: '--surface', use: 'CUE, pending status' },
  { fg: '--destructive', bg: '--surface', use: 'Error, clipping' },
  { fg: '--border', bg: '--background', use: 'Non-text hairline (decorative)' },
]

const keyboard = [
  { keys: ['Space'], action: 'Play / pause the focused deck' },
  { keys: ['Shift', 'Space'], action: 'CUE — return to cue point' },
  { keys: ['1', '–', '8'], action: 'Trigger hot cue pad 1–8' },
  { keys: ['Shift', '1–8'], action: 'Set pad at playhead' },
  { keys: ['←', '→'], action: 'Nudge playhead ±1 beat (Alt: ±10ms)' },
  { keys: ['+', '−'], action: 'Waveform zoom in / out' },
  { keys: ['Tab'], action: 'Move focus in DOM order; visible 2px ring' },
  { keys: ['Esc'], action: 'Close dialog / drawer, restore focus to trigger' },
  { keys: ['/'], action: 'Focus library search' },
]

const aria = [
  { component: 'Icon-only button', attrs: 'aria-label="Play deck 1"', note: 'Icon gets aria-hidden="true".' },
  { component: 'Toggle chip', attrs: 'aria-pressed="true|false"', note: 'State announced, label stays constant.' },
  { component: 'Hot cue pad', attrs: 'aria-label="Hot cue pad 1, Intro, 00:01.50"', note: 'Full context, not just “PAD 1”.' },
  { component: 'Tempo / EQ knob', attrs: 'role="slider" aria-valuemin aria-valuemax aria-valuenow aria-valuetext', note: 'valuetext: “+2.5 dB”.' },
  { component: 'Waveform', attrs: 'role="img" aria-label="Waveform, 5:00, playhead 0:01"', note: 'Pair with keyboard nudge controls.' },
  { component: 'Deck status', attrs: 'aria-live="polite"', note: 'Announces load / analyze complete.' },
  { component: 'Tabs (Audit, Cues, Sets…)', attrs: 'role="tablist" · role="tab" aria-selected · aria-controls', note: 'Arrow keys move between tabs.' },
  { component: 'Dialog / drawer', attrs: 'role="dialog" aria-modal="true" aria-labelledby', note: 'Focus trapped, Esc closes.' },
]

const rules = [
  { id: '1.4.3', level: 'AA', rule: 'Text contrast ≥ 4.5:1 (≥ 3:1 for 18px bold / 24px+).' },
  { id: '1.4.6', level: 'AAA', rule: 'Body text targets ≥ 7:1 on canvas in both themes.' },
  { id: '1.4.11', level: 'AA', rule: 'Control boundaries & focus rings ≥ 3:1 against adjacent colour.' },
  { id: '1.4.1', level: 'A', rule: 'Colour is never the only signal — badges, pads and bands always carry a text label.' },
  { id: '2.1.1', level: 'A', rule: 'Every action, including transport and cue setting, is keyboard-operable.' },
  { id: '2.4.7', level: 'AA', rule: 'focus-visible ring: 2px --ring with 2px offset, never removed.' },
  { id: '2.5.8', level: 'AA (2.2)', rule: 'Touch targets ≥ 24px; booth controls standardise on 44px.' },
  { id: '2.3.3', level: 'AAA', rule: 'prefers-reduced-motion disables vinyl spin and waveform easing.' },
]

function Grade({ pass, label }: { pass: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
        pass ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
      }`}
    >
      {pass ? <Check className="size-3" aria-hidden="true" /> : <X className="size-3" aria-hidden="true" />}
      {label}
      <span className="sr-only">{pass ? 'pass' : 'fail'}</span>
    </span>
  )
}

function RatioCell({ fg, bg }: { fg: string; bg: string }) {
  const ratio = contrastRatio(fg, bg)
  const g = wcagGrades(ratio)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="inline-flex size-7 items-center justify-center rounded-md border border-border text-xs font-bold" style={{ backgroundColor: bg, color: fg }} aria-hidden="true">
          Aa
        </span>
        <span className="font-mono text-sm font-semibold text-foreground">{ratio.toFixed(2)}:1</span>
      </div>
      <div className="flex flex-wrap gap-1">
        <Grade pass={g.aaLarge} label="AA-L" />
        <Grade pass={g.aa} label="AA" />
        <Grade pass={g.aaa} label="AAA" />
      </div>
    </div>
  )
}

export function AccessibilitySection() {
  return (
    <DocSection
      id="accessibility"
      title="Accessibility matrix"
      description="WCAG 2.1 AA is the release gate; AAA is the target for body text. Contrast ratios below are computed live from the token values, so the matrix can never drift from the palette."
    >
      <div className="flex flex-col gap-6">
        <SubHeading>Contrast ratios (computed)</SubHeading>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Contrast ratio of token pairs in light and dark themes with WCAG grades</caption>
            <thead className="bg-surface-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Pair</th>
                <th scope="col" className="px-4 py-3 font-medium">Light</th>
                <th scope="col" className="px-4 py-3 font-medium">Dark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {pairs.map((p) => (
                <tr key={`${p.fg}-${p.bg}`} className="print-avoid">
                  <th scope="row" className="px-4 py-3 align-top font-normal">
                    <span className="block font-mono text-xs text-foreground">
                      {p.fg} / {p.bg}
                    </span>
                    <span className="block text-sm leading-6 text-muted-foreground">{p.use}</span>
                  </th>
                  <td className="px-4 py-3">
                    <RatioCell fg={tokenHex[p.fg].light} bg={tokenHex[p.bg].light} />
                  </td>
                  <td className="px-4 py-3">
                    <RatioCell fg={tokenHex[p.fg].dark} bg={tokenHex[p.bg].dark} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          <span className="font-semibold text-foreground">--border</span> is intentionally low-contrast and only used for decorative
          separators. Interactive control outlines use <span className="font-mono text-xs text-foreground">--muted-foreground/50</span> or
          the focus ring to meet 1.4.11.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <SubHeading>WCAG compliance rules</SubHeading>
        <ul className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2">
          {rules.map((r) => (
            <li key={r.id} className="flex gap-4 bg-surface p-4">
              <span className="flex w-16 shrink-0 flex-col">
                <span className="font-mono text-sm font-semibold text-foreground">{r.id}</span>
                <span className="font-mono text-[11px] text-primary">{r.level}</span>
              </span>
              <span className="text-sm leading-6 text-foreground">{r.rule}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SubHeading>Keyboard map</SubHeading>
          <dl className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
            {keyboard.map((k) => (
              <div key={k.action} className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="flex shrink-0 gap-1">
                  {k.keys.map((key) => (
                    <kbd key={key} className="min-w-7 rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 text-center font-mono text-xs text-foreground shadow-[inset_0_-1px_0_var(--border)]">
                      {key}
                    </kbd>
                  ))}
                </dt>
                <dd className="text-right text-sm leading-6 text-muted-foreground">{k.action}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col gap-6">
          <SubHeading>ARIA contract</SubHeading>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
            {aria.map((a) => (
              <li key={a.component} className="print-avoid flex flex-col gap-1 px-4 py-3">
                <span className="text-sm font-medium text-foreground">{a.component}</span>
                <code className="font-mono text-xs leading-5 text-primary">{a.attrs}</code>
                <span className="text-xs leading-5 text-muted-foreground">{a.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DocSection>
  )
}
