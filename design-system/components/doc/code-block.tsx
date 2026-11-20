'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="print-avoid overflow-hidden rounded-lg border border-border bg-surface-2">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label ?? 'tsx'}</span>
        <button
          type="button"
          onClick={copy}
          className="no-print inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
        >
          {copied ? <Check className="size-3.5 text-success" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  )
}
