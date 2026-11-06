import { docSections } from '@/lib/sections'

type DocSectionProps = {
  id: (typeof docSections)[number]['id']
  title: string
  description: string
  children: React.ReactNode
}

export function DocSection({ id, title, description, children }: DocSectionProps) {
  const index = docSections.findIndex((s) => s.id === id) + 1

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="print-break flex flex-col gap-10 border-t border-border py-16 first:border-t-0 first:pt-8">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          {'§ '}
          {String(index).padStart(2, '0')}
          {' / '}
          {String(docSections.length).padStart(2, '0')}
        </p>
        <h2 id={`${id}-title`} className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {title}
        </h2>
        <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  )
}

export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-3 font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      <span className="h-px w-6 bg-primary" aria-hidden="true" />
      {children}
    </h3>
  )
}
