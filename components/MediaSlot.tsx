type Props = {
  kind?: "image" | "video";
  src?: string;
  caption?: string;
  ratio?: string;
};

// ponytail: in prod, render nothing when no src. In dev, show a labeled stub so authors know
// where to drop a file. Videos autoplay-loop muted (browser requirement for autoplay).
export default function MediaSlot({ kind = "image", src, caption, ratio = "16/9" }: Props) {
  if (!src) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <figure className="my-4">
        <div
          className="w-full rounded-lg overflow-hidden border border-dashed border-white/15 bg-panel/40 flex items-center justify-center text-muted text-xs"
          style={{ aspectRatio: ratio }}
        >
          <div className="text-center px-4">
            <div className="text-2xl mb-1 opacity-40">▣</div>
            <div>[dev] {kind} placeholder · {caption ?? "drop a file here"}</div>
          </div>
        </div>
        {caption && (
          <figcaption className="text-xs text-muted mt-1.5 text-center">{caption}</figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure className="my-4">
      <div
        className="w-full rounded-lg overflow-hidden border border-white/10 bg-panel/40"
        style={{ aspectRatio: ratio }}
      >
        {kind === "video" ? (
          <video
            src={src}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={caption ?? ""} className="w-full h-full object-cover" />
        )}
      </div>
      {caption && (
        <figcaption className="text-xs text-muted mt-1.5 text-center">{caption}</figcaption>
      )}
    </figure>
  );
}
