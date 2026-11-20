export function ScreenFigure({ src, alt, caption, figure }: { src: string; alt: string; caption: string; figure: string }) {
  return (
    <figure className="print-avoid flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-border bg-djzinc-950 p-1.5 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- static documentation screenshots of unknown intrinsic size */}
        <img src={src} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full rounded-lg" />
      </div>
      <figcaption className="flex gap-3 text-sm leading-6 text-muted-foreground">
        <span className="shrink-0 font-mono text-xs uppercase tracking-widest text-primary">{figure}</span>
        <span className="text-pretty">{caption}</span>
      </figcaption>
    </figure>
  )
}
