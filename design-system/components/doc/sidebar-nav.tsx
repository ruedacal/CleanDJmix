'use client'

import { useEffect, useState } from 'react'
import { docSections } from '@/lib/sections'

function useActiveSection() {
  const [active, setActive] = useState<string>(docSections[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    docSections.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return active
}

export function SidebarNav({ variant }: { variant: 'rail' | 'chips' }) {
  const active = useActiveSection()

  if (variant === 'rail') {
    return (
      <nav aria-label="Document sections" className="no-print">
      <ol className="flex flex-col gap-1">
        {docSections.map((s, i) => {
          const isActive = active === s.id
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                }`}
              >
                <span className="font-mono text-xs tabular-nums opacity-70">{String(i + 1).padStart(2, '0')}</span>
                {s.label}
              </a>
            </li>
          )
        })}
      </ol>
      </nav>
    )
  }

  return (
    <nav aria-label="Document sections (compact)" className="no-print">
      <ol className="flex gap-2 overflow-x-auto pb-1">
        {docSections.map((s) => {
          const isActive = active === s.id
          return (
            <li key={s.id} className="shrink-0">
              <a
                href={`#${s.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={`block rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {s.label}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
