type Size = "sm" | "md" | "lg";

const sizes: Record<Size, string> = {
  sm: "h-5 px-1.5 text-[10px]",
  md: "h-6 px-2 text-xs",
  lg: "h-7 px-2.5 text-sm",
};

export function CheapestBadge({
  size = "md",
  title = "Inseratspreis liegt auf oder unter dem güstigsten Marktpreis",
}: {
  size?: Size;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center gap-1 rounded-full font-bold uppercase tracking-wide",
        "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm ring-1 ring-emerald-700/20",
        sizes[size],
      ].join(" ")}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" aria-hidden>
        <path
          d="M12 2 4 7v6c0 5.5 3.84 9.78 8 11 4.16-1.22 8-5.5 8-11V7l-8-5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="m9 12 2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Günstigster
    </span>
  );
}
