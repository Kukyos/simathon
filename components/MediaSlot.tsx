type Props = {
  kind?: "image" | "video";
  src?: string;
  caption?: string;
  ratio?: string;
};

// ponytail: `src` can be a local path, a YouTube URL, or empty. Empty = show a
// "coming soon" placeholder (dev + prod both, so authors can see where slots
// live on the live site). YouTube URLs get iframe-embedded automatically.
// ponytail: autoplay+mute+loop+scrub, minimal YT chrome. loop=1 needs
// playlist=<id> to actually loop a single video (YT quirk).
function youtubeEmbed(url: string): string | null {
  let id: string | null = null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    else if (u.hostname.includes("youtube.com")) {
      id = u.searchParams.get("v") ?? (u.pathname.startsWith("/embed/") ? u.pathname.slice(7) : null);
    }
  } catch {
    /* not a URL */
  }
  if (!id) return null;
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id,
    controls: "1",
    modestbranding: "1",
    rel: "0",
    playsinline: "1",
    iv_load_policy: "3",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
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
