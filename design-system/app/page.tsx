import { PrintCover } from '@/components/doc/print-cover'
import { SidebarNav } from '@/components/doc/sidebar-nav'
import { SiteHeader } from '@/components/doc/site-header'
import { AccessibilitySection } from '@/components/sections/accessibility-section'
import { ArchitectureSection } from '@/components/sections/architecture-section'
import { BrandSection } from '@/components/sections/brand-section'
import { ColorSection } from '@/components/sections/color-section'
import { ComponentLibrarySection } from '@/components/sections/component-library-section'
import { IconographySection } from '@/components/sections/iconography-section'
import { TypographySection } from '@/components/sections/typography-section'

export default function Page() {
  return (
    <>
      <SiteHeader />
      <div className="print-full mx-auto flex w-full max-w-screen-2xl gap-10 px-4 sm:px-6 lg:px-8">
        <aside className="no-print sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 overflow-y-auto py-8 lg:block">
          <p className="mb-3 px-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Contents</p>
          <SidebarNav variant="rail" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="no-print sticky top-14 z-30 -mx-4 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
            <SidebarNav variant="chips" />
          </div>
          <main className="flex min-w-0 max-w-5xl flex-col pb-24">
            <PrintCover />
            <BrandSection />
            <ColorSection />
            <TypographySection />
            <ComponentLibrarySection />
            <IconographySection />
            <AccessibilitySection />
            <ArchitectureSection />
          </main>
        </div>
      </div>
    </>
  )
}
