import { CodeBlock } from '@/components/doc/code-block'
import { DocSection, SubHeading } from '@/components/doc/doc-section'
import { ramps, rgbString, semanticTokens, signalColors } from '@/lib/tokens'

const themeSnippet = `/* app/globals.css — Tailwind v4 (no tailwind.config.js) */
:root  { --primary: #0e7490; --background: #fafafa; /* … */ }
.dark  { --primary: #22d3ee; --background: #09090b; /* … */ }

@theme inline {
  --color-background: var(--background);
  --color-surface:    var(--surface);
  --color-primary:    var(--primary);
  --color-success:    var(--success);
  --color-warning:    var(--warning);
  --color-destructive:var(--destructive);
  /* static ramps → bg-djzinc-900, text-djcyan-400 */
  --color-djzinc-900: #121216;
  --color-djcyan-400: #22d3ee;
}`

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="size-6 shrink-0 rounded-md border border-border" style={{ backgroundColor: hex }} aria-hidden="true" />
      <span className="flex flex-col leading-tight">
        <span className="font-mono text-xs text-foreground">{hex}</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {label} · {rgbString(hex)}
        </span>
      </span>
    </span>
  )
}

export function ColorSection() {
  return (
    <DocSection
      id="color"
      title="Color system"
      description="Eleven semantic tokens drive every surface. Components only ever reference semantic tokens; the static ramps exist for data-viz and brand artwork where a value must not flip with the theme."
    >
      <div className="flex flex-col gap-6">
        <SubHeading>Semantic tokens</SubHeading>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Semantic color tokens with light and dark values</caption>
            <thead className="bg-surface-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Token</th>
                <th scope="col" className="px-4 py-3 font-medium">Light</th>
                <th scope="col" className="px-4 py-3 font-medium">Dark</th>
                <th scope="col" className="px-4 py-3 font-medium">Tailwind</th>
                <th scope="col" className="px-4 py-3 font-medium">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {semanticTokens.map((t) => (
                <tr key={t.token} className="print-avoid">
                  <th scope="row" className="px-4 py-3 font-mono text-xs font-medium text-foreground">{t.token}</th>
                  <td className="px-4 py-3"><Swatch hex={t.light} label="L" /></td>
                  <td className="px-4 py-3"><Swatch hex={t.dark} label="D" /></td>
                  <td className="px-4 py-3 font-mono text-xs text-primary">{t.tailwind}</td>
                  <td className="px-4 py-3 leading-6 text-muted-foreground">{t.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <SubHeading>Static ramps</SubHeading>
        {ramps.map((ramp) => (
          <div key={ramp.name} className="print-avoid flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-medium text-foreground">{ramp.name}</h3>
              <code className="font-mono text-xs text-muted-foreground">{`bg-${ramp.tailwind}-{step}`}</code>
            </div>
            <ol className="grid grid-cols-4 overflow-hidden rounded-lg border border-border md:grid-cols-8">
              {ramp.steps.map((s) => (
                <li key={s.step} className="flex flex-col">
                  <span className="h-16" style={{ backgroundColor: s.hex }} aria-hidden="true" />
                  <span className="flex flex-col gap-0.5 bg-surface px-2 py-2">
                    <span className="font-mono text-xs font-semibold text-foreground">{s.step}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{s.hex}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SubHeading>Waveform signal bands</SubHeading>
          <p className="text-sm leading-6 text-muted-foreground">
            Frequency colours are fixed in both themes so DJs can read the waveform the same way as on Serato / Rekordbox hardware. Never use
            them for UI state.
          </p>
          <ul className="flex flex-col gap-2">
            {signalColors.map((c) => (
              <li key={c.name} className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3">
                <span className="h-8 w-16 shrink-0 rounded-md" style={{ backgroundColor: c.hex }} aria-hidden="true" />
                <span className="flex flex-1 flex-col">
                  <span className="text-sm font-medium text-foreground">{c.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{c.band}</span>
                </span>
                <span className="font-mono text-xs text-foreground">{c.hex}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-6">
          <SubHeading>Tailwind mapping</SubHeading>
          <CodeBlock code={themeSnippet} label="globals.css" />
        </div>
      </div>
    </DocSection>
  )
}
