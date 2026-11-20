import { CodeBlock } from '@/components/doc/code-block'
import { DocSection, SubHeading } from '@/components/doc/doc-section'

const tree = `beatwave-web/
├── app/                         # Next.js App Router — routes only
│   ├── (booth)/
│   │   ├── layout.tsx           # Deck shell, keyboard provider, transport bar
│   │   ├── cues/page.tsx        # Cue Editor  (was web/js/app.jsx › CUES tab)
│   │   ├── audit/page.tsx       # Library audit table
│   │   ├── sets/page.tsx        # Set builder / session graph
│   │   └── copilot/page.tsx     # AI copilot (was web/copilot.html)
│   ├── api/                     # Thin BFF → Python services (FastAPI/bottle)
│   │   └── tracks/[id]/route.ts
│   ├── layout.tsx               # Fonts, ThemeProvider, <html class="bg-background">
│   └── globals.css              # Tokens (this document, § 02)
├── components/
│   ├── ui/                      # Primitives: button, badge, toggle-chip, input
│   ├── deck/                    # vinyl, transport, eq-knob, tempo-fader
│   ├── waveform/                # canvas renderer, zoom-toolbar, cue-markers
│   └── library/                 # track-table, dropzone, recognition-panel
├── features/                    # Vertical slices: hooks + components + api
│   ├── cues/{use-cues.ts, cue-pad-grid.tsx, cues.api.ts}
│   └── analysis/{use-analysis.ts, analysis.api.ts}
├── lib/
│   ├── audio/                   # Web Audio graph, decoding, worker bridge
│   ├── stores/deck-store.ts     # Zustand — real-time playback state
│   └── cn.ts
└── workers/waveform.worker.ts   # Peak extraction off the main thread`

const backend = `# Existing Python core — unchanged, exposed via HTTP
domain/          models.py               # Track, Cue, Set entities
application/     analysis_service.py     # Use-cases (deck, stream, taxonomy)
infrastructure/  precision_engine.py     # DSP, FLAC, Shazam, Spotify adapters
services/        dsp_engine.py · mood_intelligence_service.py · copilot_service.py
routers/         audit · itunes · spotify · superflac · taxonomy`

const state = [
  {
    title: 'Server state → SWR',
    when: 'Library, track metadata, analysis results, sets.',
    how: 'useSWR keyed by resource URL; mutate() optimistic updates after save; revalidateOnFocus off in the booth.',
  },
  {
    title: 'Real-time state → Zustand store',
    when: 'Playhead, play/pause, tempo, EQ, active pad — 60 fps updates.',
    how: 'Subscribe with selectors; the waveform canvas reads via store.subscribe() outside React to avoid re-renders.',
  },
  {
    title: 'URL state → searchParams',
    when: 'Active tab, selected track, zoom level, filters.',
    how: 'Shareable, back-button friendly; read in Server Components, write with router.replace.',
  },
  {
    title: 'Local UI state → useState',
    when: 'Open drawers, hover previews, form drafts.',
    how: 'Kept in the leaf component. Lift only when two siblings need it.',
  },
]

const scale = [
  { title: 'Token-only styling', body: 'Components reference semantic tokens, never hex. A re-theme is a globals.css change, not a refactor.' },
  { title: 'Feature slices', body: 'Each feature owns its hooks, API calls and components. Cross-feature imports go through components/ui only.' },
  { title: 'Main-thread budget', body: 'Decoding and peak extraction run in a Web Worker; the canvas renders from a transferable Float32Array.' },
  { title: 'Route-level code splitting', body: 'Copilot and Sets load on demand; the Cue Editor bundle stays under 200 kB gzipped.' },
  { title: 'Offline-first booth', body: 'Fonts and vendor assets are self-hosted (as today via build_offline.py) so the app runs without venue Wi-Fi.' },
  { title: 'Contract tests', body: 'The BDD features (features/*.feature) stay the acceptance suite; the BFF is typed from the Python models.' },
]

export function ArchitectureSection() {
  return (
    <DocSection
      id="architecture"
      title="Scalability & architecture"
      description="The target frontend is a Next.js App Router app sitting in front of the existing Python core. The domain/application/infrastructure layers stay untouched; the vanilla JSX bundle is migrated route by route."
    >
      <div className="grid gap-8 xl:grid-cols-[1fr_24rem]">
        <div className="flex flex-col gap-6">
          <SubHeading>Frontend folder structure</SubHeading>
          <CodeBlock code={tree} label="tree" />
        </div>
        <div className="flex flex-col gap-6">
          <SubHeading>Backend boundary</SubHeading>
          <CodeBlock code={backend} label="python" />
          <p className="text-sm leading-6 text-muted-foreground">
            Next.js never imports Python. All calls go through <code className="font-mono text-xs text-foreground">app/api/*</code> route
            handlers, which add the session token header used by the remote/tablet mode.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <SubHeading>State management patterns</SubHeading>
        <ul className="grid gap-4 md:grid-cols-2">
          {state.map((s) => (
            <li key={s.title} className="print-avoid flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
              <h3 className="font-semibold text-foreground">{s.title}</h3>
              <p className="text-sm leading-6 text-foreground">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">When · </span>
                {s.when}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">{s.how}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-6">
        <SubHeading>Build scalability notes</SubHeading>
        <ul className="grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-2 xl:grid-cols-3">
          {scale.map((s) => (
            <li key={s.title} className="flex flex-col gap-2 bg-surface p-5">
              <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
              <p className="text-sm leading-6 text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <footer className="flex flex-col gap-2 rounded-lg border border-primary/40 bg-primary/5 p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Handover checklist</p>
        <p className="leading-relaxed text-foreground">
          Tokens merged into globals.css · primitives in components/ui with all five states · contrast matrix green for AA · keyboard map
          implemented · SWR + Zustand split respected · Lighthouse a11y ≥ 95 on Cue Editor.
        </p>
      </footer>
    </DocSection>
  )
}
