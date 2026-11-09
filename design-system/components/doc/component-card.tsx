'use client'

import { useId, useState } from 'react'
import { cn } from '@/lib/cn'

export type ComponentState = 'default' | 'hover' | 'active' | 'focus' | 'disabled'

const STATES: ComponentState[] = ['default', 'hover', 'active', 'focus', 'disabled']

export type ComponentSpec = {
  name: string
  description: string
  base: string
  states: Record<Exclude<ComponentState, 'default'>, string>
  render: (className: string, disabled: boolean) => React.ReactNode
}

export function ComponentCard({ spec }: { spec: ComponentSpec }) {
  const [state, setState] = useState<ComponentState | 'live'>('live')
  const groupId = useId()

  const forced = state === 'live' || state === 'default' ? '' : spec.states[state]
  const disabled = state === 'disabled'
  const binding = state === 'live' || state === 'default' ? spec.base : `${spec.base}\n/* ${state} → */ ${spec.states[state]}`

  return (
    <article className="print-avoid flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <header className="flex flex-col gap-1 border-b border-border p-5">
        <h3 className="text-lg font-semibold text-foreground">{spec.name}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{spec.description}</p>
      </header>

      <div
        role="radiogroup"
        aria-label={`${spec.name} preview state`}
        className="no-print flex gap-1 overflow-x-auto border-b border-border bg-surface-2 p-1.5"
      >
        {(['live', ...STATES] as const).map((s) => {
          const selected = state === s
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={selected}
              id={`${groupId}-${s}`}
              onClick={() => setState(s)}
              className={cn(
                'shrink-0 rounded-md px-2.5 py-1 font-mono text-xs uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s}
            </button>
          )
        })}
      </div>

      <div className="flex min-h-36 items-center justify-center bg-background p-8" aria-live="polite">
        {spec.render(cn(spec.base, forced), disabled)}
      </div>

      <div className="border-t border-border bg-surface-2">
        <p className="px-4 pt-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          className · {state === 'live' ? 'default' : state}
        </p>
        <pre className="overflow-x-auto whitespace-pre-wrap break-words px-4 pb-4 pt-2 font-mono text-xs leading-5 text-foreground">
          <code>{binding}</code>
        </pre>
      </div>
    </article>
  )
}
