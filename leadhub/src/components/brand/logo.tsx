import Link from "next/link";

type LogoProps = {
  variant?: "light" | "dark";
  href?: string;
};

export function Logo({ variant = "dark", href = "/" }: LogoProps) {
  const textColor = variant === "light" ? "text-white" : "text-ink-900";
  const subColor = variant === "light" ? "text-brand-200" : "text-brand-600";

  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group">
      <span className="grid place-items-center h-9 w-9 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white" aria-hidden>
          <path
            d="M4 17V7l8-4 8 4v10l-8 4-8-4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M4 7l8 4 8-4M12 11v10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={`text-base font-semibold tracking-tight ${textColor}`}>
          Finca <span className={subColor}>LeadHub</span>
        </span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-ink-400">
          Finca-Solutions
        </span>
      </span>
    </Link>
  );
}
