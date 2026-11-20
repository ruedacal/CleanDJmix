import {
  AudioWaveform,
  Disc3,
  Download,
  FolderOpen,
  Headphones,
  Library,
  ListMusic,
  Magnet,
  Pause,
  Play,
  Radar,
  Save,
  Search,
  Settings,
  SkipBack,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Volume2,
  ZoomIn,
} from 'lucide-react'
import { CodeBlock } from '@/components/doc/code-block'
import { DocSection, SubHeading } from '@/components/doc/doc-section'
import { breakpoints } from '@/lib/tokens'

const icons = [
  { Icon: Play, name: 'Play' },
  { Icon: Pause, name: 'Pause' },
  { Icon: SkipBack, name: 'SkipBack' },
  { Icon: Disc3, name: 'Disc3' },
  { Icon: AudioWaveform, name: 'AudioWaveform' },
  { Icon: Headphones, name: 'Headphones' },
  { Icon: Volume2, name: 'Volume2' },
  { Icon: SlidersHorizontal, name: 'SlidersHorizontal' },
  { Icon: Magnet, name: 'Magnet' },
  { Icon: ZoomIn, name: 'ZoomIn' },
  { Icon: Library, name: 'Library' },
  { Icon: ListMusic, name: 'ListMusic' },
  { Icon: FolderOpen, name: 'FolderOpen' },
  { Icon: Search, name: 'Search' },
  { Icon: Radar, name: 'Radar' },
  { Icon: Sparkles, name: 'Sparkles' },
  { Icon: Save, name: 'Save' },
  { Icon: Download, name: 'Download' },
  { Icon: Trash2, name: 'Trash2' },
  { Icon: Settings, name: 'Settings' },
]

const sizes = [
  { cls: 'size-4', px: 16, use: 'Inline with text, badges, dense buttons' },
  { cls: 'size-5', px: 20, use: 'Default button & nav icons' },
  { cls: 'size-6', px: 24, use: 'Transport controls, empty states' },
]

const iconSnippet = `import { Play } from 'lucide-react'

// Decorative (label is visible text): hide from AT
<button className="inline-flex items-center gap-2">
  <Play className="size-4" aria-hidden="true" /> Play
</button>

// Icon-only: the button carries the accessible name
<button aria-label="Play deck 1">
  <Play className="size-6" aria-hidden="true" />
</button>`

const containerSnippet = `<div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
  <div className="grid gap-6 md:grid-cols-[18rem_1fr] xl:grid-cols-[18rem_1fr_20rem]">
    <LibraryPanel />  <DeckWorkspace />  <InspectorPanel className="hidden xl:flex" />
  </div>
</div>`

export function IconographySection() {
  return (
    <DocSection
      id="iconography"
      title="Icons & containers"
      description="Lucide React is the only icon set. Stroke width stays at the default 2px, icons inherit currentColor, and three sizes cover every case. Layout is mobile-first across six breakpoints."
    >
      <div className="flex flex-col gap-6">
        <SubHeading>Standard icon set · lucide-react</SubHeading>
        <ul className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-5 lg:grid-cols-10">
          {icons.map(({ Icon, name }) => (
            <li key={name} className="flex flex-col items-center gap-2 bg-surface px-2 py-4">
              <Icon className="size-5 text-foreground" aria-hidden="true" />
              <span className="max-w-full truncate font-mono text-[11px] text-muted-foreground">{name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SubHeading>Sizes</SubHeading>
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
            {sizes.map((s) => (
              <li key={s.cls} className="flex items-center gap-4 p-4">
                <span className="flex size-10 items-center justify-center rounded-md bg-surface-2">
                  <Disc3 className={`${s.cls} text-primary`} aria-hidden="true" />
                </span>
                <span className="flex flex-1 flex-col">
                  <code className="font-mono text-xs text-foreground">
                    {s.cls} · {s.px}px
                  </code>
                  <span className="text-sm leading-6 text-muted-foreground">{s.use}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-6">
          <SubHeading>Usage</SubHeading>
          <CodeBlock code={iconSnippet} label="tsx" />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <SubHeading>Breakpoints & containers</SubHeading>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">Responsive breakpoints, container widths and layout behaviour</caption>
            <thead className="bg-surface-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Prefix</th>
                <th scope="col" className="px-4 py-3 font-medium">Min width</th>
                <th scope="col" className="px-4 py-3 font-medium">Range</th>
                <th scope="col" className="px-4 py-3 font-medium">Container</th>
                <th scope="col" className="px-4 py-3 font-medium">Layout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {breakpoints.map((b) => (
                <tr key={b.name}>
                  <th scope="row" className="px-4 py-3 font-mono text-xs font-semibold text-primary">{b.name}</th>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{b.min}px</td>
                  <td className="px-4 py-3">
                    <span className="block h-2 rounded-full bg-surface-2">
                      <span className="block h-2 rounded-full bg-primary" style={{ width: `${Math.max((b.min / 1536) * 100, 4)}%` }} />
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{b.container}</td>
                  <td className="px-4 py-3 leading-6 text-muted-foreground">{b.layout}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CodeBlock code={containerSnippet} label="dashboard-shell.tsx" />
      </div>
    </DocSection>
  )
}
