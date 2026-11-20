import { ComponentCatalog } from '@/components/doc/component-catalog'
import { DocSection, SubHeading } from '@/components/doc/doc-section'
import { ScreenFigure } from '@/components/doc/screen-figure'

const screens = [
  {
    src: '/screens/waveform_cues.webp',
    alt: 'Multiband waveform with bar grid, hot-cue markers and the zoom toolbar.',
    caption: 'Waveform & cue grid. Toolbar uses Toggle Chips; markers use the signal-band palette.',
  },
  {
    src: '/screens/tabla_biblioteca.webp',
    alt: 'Library table listing tracks with BPM, key, energy and analysis status columns.',
    caption: 'Library table. Dense Small (14px) rows, mono numerics, Status Badges per row.',
  },
  {
    src: '/screens/panel_shazam.webp',
    alt: 'Recognition panel showing a matched track with artwork and metadata fields.',
    caption: 'Recognition panel. Surface card on canvas with a single primary action.',
  },
  {
    src: '/screens/dropzone_files.webp',
    alt: 'File drop zone with dashed border inviting the user to drop audio files.',
    caption: 'Drop zone. Dashed border-border at rest, border-primary on drag-over.',
  },
]

export function ComponentLibrarySection() {
  return (
    <DocSection
      id="components"
      title="Component library"
      description="Every interactive primitive ships with five documented states. Use the state switcher to force a state and read the exact class binding; choose Live to interact with the real component."
    >
      <ComponentCatalog />

      <div className="flex flex-col gap-6">
        <SubHeading>Components in production</SubHeading>
        <div className="grid gap-8 md:grid-cols-2">
          {screens.map((s, i) => (
            <ScreenFigure key={s.src} src={s.src} alt={s.alt} caption={s.caption} figure={`Fig. ${i + 2}`} />
          ))}
        </div>
      </div>
    </DocSection>
  )
}
