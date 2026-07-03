import { useRef } from "react";

type Clip = { src: string; title?: string };

export function VideoClips({ videos }: { videos: Clip[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="section-pad bg-muted/10">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl md:text-5xl font-bold">Marketing Clips</h2>
          <p className="mt-3 text-muted-foreground">Short, muted clips highlighting our services and products.</p>
        </div>

        <div
          ref={containerRef}
          className="mt-6 -mx-4 overflow-x-auto px-4 py-2 scroll-smooth"
        >
          <div className="flex gap-4">
            {videos.map((v) => (
              <div key={v.src} className="min-w-65 max-w-80 rounded-2xl overflow-hidden border border-border bg-card shadow-soft">
                <video
                  src={v.src}
                  title={v.title}
                  className="h-48 w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
                {v.title ? <div className="p-3 text-sm font-medium">{v.title}</div> : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default VideoClips;
