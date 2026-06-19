export function Callout({
  kind = "info",
  title,
  children,
}: {
  kind?: "info" | "warn" | "check";
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`callout ${kind === "warn" ? "warn" : kind === "check" ? "check" : ""}`}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="text-sm text-ink/90">{children}</div>
    </div>
  );
}
