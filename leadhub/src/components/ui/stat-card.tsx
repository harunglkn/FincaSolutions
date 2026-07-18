import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { value: string; direction: "up" | "down" | "flat" };
  icon?: ReactNode;
};

export function StatCard({ label, value, hint, trend, icon }: StatCardProps) {
  const trendColor =
    trend?.direction === "up"
      ? "text-green-700"
      : trend?.direction === "down"
      ? "text-red-700"
      : "text-ink-500";

  return (
    <div className="relative overflow-hidden bg-white border border-ink-200/70 rounded-2xl p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.10)] transition-shadow hover:shadow-[0_2px_4px_rgba(15,23,42,0.06),0_16px_40px_-16px_rgba(15,23,42,0.16)]">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand-600 via-accent-500 to-transparent opacity-60"
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-ink-500">{label}</p>
          <p className="mt-2 text-[32px] leading-none font-semibold text-ink-900 tracking-tight tabular-nums">
            {value}
          </p>
        </div>
        {icon && (
          <span className="grid place-items-center h-10 w-10 rounded-lg bg-brand-50 text-brand-700">
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
