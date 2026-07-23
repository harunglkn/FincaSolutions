import type { ReactNode } from "react";

type Accent = "brand" | "accent" | "success" | "amber";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  icon?: ReactNode;
  accent?: Accent;
};

const ACCENTS: Record<Accent, { box: string; line: string }> = {
  brand: {
    box: "bg-brand-50 text-brand-700",
    line: "from-brand-600 via-accent-500 to-transparent",
  },
  accent: {
    box: "bg-accent-500/10 text-accent-600",
    line: "from-accent-500 via-brand-500 to-transparent",
  },
  success: {
    box: "bg-green-50 text-green-700",
    line: "from-green-500 via-accent-500 to-transparent",
  },
  amber: {
    box: "bg-amber-50 text-amber-700",
    line: "from-amber-500 via-brand-500 to-transparent",
  },
};

export function StatCard({
  label,
  value,
  hint,
  trend,
  icon,
  accent = "brand",
}: StatCardProps) {
  const trendColor =
    trend?.direction === "up"
      ? "text-green-700"
      : trend?.direction === "down"
      ? "text-red-700"
      : "text-ink-500";
  const tone = ACCENTS[accent];

  return (
    <div className="group relative overflow-hidden bg-white border border-ink-200/70 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.10)] transition-all hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_20px_44px_-18px_rgba(15,23,42,0.20)]">
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${tone.line} opacity-70`}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-ink-500">{label}</p>
          <p className="mt-2 text-[34px] leading-none font-semibold text-ink-900 tracking-tight tabular-nums">
            {value}
          </p>
        </div>
        {icon && (
          <span
            className={`grid place-items-center h-11 w-11 rounded-xl transition-transform group-hover:scale-105 ${tone.box}`}
          >
            {icon}
          </span>
        )}
      </div>
      {(trend || hint) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span className={`font-semibold ${trendColor}`}>{trend.value}</span>
          )}
          {hint && <span className="text-ink-500">{hint}</span>}
        </div>
      )}
    </div>
  );
}
