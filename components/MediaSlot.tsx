type Props = {
  kind?: "image" | "video";
  src?: string;
  caption?: string;
  ratio?: string;
};

// ponytail: `src` can be a local path, a YouTube URL, or empty. Empty = show a
// "coming soon" placeholder (dev + prod both, so authors can see where slots
// live on the live site). YouTube URLs get iframe-embedded automatically.
function youtubeEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
  } catch {
    /* not a URL */
  }
  return null;
}

export default function MediaSlot({ kind = "image", src, caption, ratio = "16/9" }: Props) {
  if (!src) {
    return (
      <figure className="my-4">
        <div
          className="w-full rounded-lg overflow-hidden border border-dashed border-white/15 bg-panel/40 flex items-center justify-center text-muted text-xs"
          style={{ aspectRatio: ratio }}
        >
          <div className="text-center px-4">
            <div className="text-2xl mb-1 opacity-40">{kind === "video" ? "▶" : "▣"}</div>
            <div>{kind === "video" ? "video walkthrough — coming soon" : caption ?? "image placeholder"}</div>
          </div>
        </div>
        {caption && (
          <figcaption className="text-xs text-muted mt-1.5 text-center">{caption}</figcaption>
        )}
      </figure>
    );
  }

  const yt = kind === "video" ? youtubeEmbed(src) : null;

  return (
    <figure className="my-4">
      <div
        className="w-full rounded-lg overflow-hidden border border-white/10 bg-panel/40"
        style={{ aspectRatio: ratio }}
      >
        {yt ? (
          <iframe
            src={yt}
            title={caption ?? "video"}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : kind === "video" ? (
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
