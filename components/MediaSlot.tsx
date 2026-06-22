type Props = {
  kind?: "image" | "video";
  src?: string;
  caption?: string;
  ratio?: string; // e.g. "16/9" or "4/3"
};

// ponytail: drop a file in /public/guide/, set src="/guide/<file>", done.
// Videos autoplay-loop muted (browser requirement for autoplay). No controls — guide vibe.
export default function MediaSlot({ kind = "image", src, caption, ratio = "16/9" }: Props) {
  return (
    <figure className="my-4">
      <div
        className="w-full rounded-lg overflow-hidden border border-white/10 bg-panel/40 flex items-center justify-center text-muted text-xs"
        style={{ aspectRatio: ratio }}
      >
        {src ? (
          kind === "video" ? (
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
          )
        ) : (
          <div className="text-center px-4">
            <div className="text-2xl mb-1 opacity-40">▣</div>
            <div>
              {kind} placeholder · {caption ?? "drop a screenshot or clip here"}
            </div>
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="text-xs text-muted mt-1.5 text-center">{caption}</figcaption>
      )}
    </figure>
  );
}
