const BAND_STYLE: Record<string, { bg: string; fg: string }> = {
  Initial: { bg: "#d03b3b", fg: "#ffffff" },
  Developing: { bg: "#ec835a", fg: "#ffffff" },
  Defined: { bg: "#fab219", fg: "#0b0b0b" },
  Managed: { bg: "#0ca30c", fg: "#ffffff" },
  Optimized: { bg: "#0ca30c", fg: "#ffffff" },
};

export function ReadinessBandBadge({ band }: { band: string }) {
  const style = BAND_STYLE[band] ?? { bg: "#898781", fg: "#ffffff" };
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium"
      style={{ backgroundColor: style.bg, color: style.fg }}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: style.fg }} />
      {band}
    </span>
  );
}
