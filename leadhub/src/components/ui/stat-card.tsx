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
    <div className="bg-white border border-ink-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink-900 tracking-tight">
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
