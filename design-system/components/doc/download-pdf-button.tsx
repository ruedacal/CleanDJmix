'use client'

import { Download } from 'lucide-react'
import { DOC_ID, DOC_VERSION } from '@/lib/sections'

export function DownloadPdfButton({ className = '' }: { className?: string }) {
  function handlePrint() {
    const previousTitle = document.title
    // Browsers use document.title as the default PDF filename.
    document.title = `${DOC_ID}_BeatWave-Design-System_${DOC_VERSION}`
    const restore = () => {
      document.title = previousTitle
      window.removeEventListener('afterprint', restore)
    }
    window.addEventListener('afterprint', restore)
    window.print()
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={`inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
    >
      <Download className="size-4" aria-hidden="true" />
      Download PDF
    </button>
  )
}
