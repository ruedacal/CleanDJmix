import { AudioLines } from 'lucide-react'
import { DOC_ID, DOC_VERSION } from '@/lib/sections'
import { DownloadPdfButton } from './download-pdf-button'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="#brand" className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="flex size-8 items-center justify-center rounded-md border border-primary/40 bg-primary/10 text-primary">
            <AudioLines className="size-4" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-foreground">BeatWave PRO</span>
            <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Design System</span>
          </span>
        </a>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-sm border border-border px-2 py-1 font-mono text-xs text-muted-foreground md:inline">
            {DOC_ID} · {DOC_VERSION}
          </span>
          <ThemeToggle />
          <DownloadPdfButton />
        </div>
      </div>
    </header>
  )
}
