import katex from "katex";

// ponytail: server-rendered KaTeX. No client JS — renderToString runs at
// request time and we drop the HTML in. throwOnError:false so a typo in a
// formula can never crash the build. Import the CSS once on any page that uses this.
export function Eq({ children, display = false }: { children: string; display?: boolean }) {
  const html = katex.renderToString(children, {
    displayMode: display,
    throwOnError: false,
  });
  if (display) {
    return (
      <div
        className="my-4 overflow-x-auto rounded-md border border-white/10 bg-panel/60 px-4 py-3 text-ink"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
