import { DOC_DATE, DOC_ID, DOC_VERSION, docSections } from '@/lib/sections'

export function PrintCover() {
  return (
    <div className="print-only">
      <div className="flex min-h-[250mm] flex-col justify-between">
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Technical Handover Specification</p>
          <h1 className="text-5xl font-semibold tracking-tight text-foreground">BeatWave PRO Design System</h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Tokens, components, accessibility rules and frontend architecture for the CleanDJmix / BeatWave PRO web client.
          </p>
        </div>
        <ol className="flex flex-col gap-2 border-t border-border pt-6">
          {docSections.map((s, i) => (
            <li key={s.id} className="flex justify-between font-mono text-sm text-foreground">
              <span>
                {String(i + 1).padStart(2, '0')} — {s.label}
              </span>
            </li>
          ))}
        </ol>
        <dl className="grid grid-cols-3 gap-4 border-t border-border pt-6 font-mono text-xs text-muted-foreground">
          <div>
            <dt className="uppercase tracking-widest">Document</dt>
            <dd className="text-foreground">{DOC_ID}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-widest">Version</dt>
            <dd className="text-foreground">{DOC_VERSION}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-widest">Revision</dt>
            <dd className="text-foreground">{DOC_DATE}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
