type TopbarProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function Topbar({ title, subtitle, action }: TopbarProps) {
  return (
    <header className="h-16 px-6 lg:px-8 border-b border-ink-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-ink-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-ink-500 truncate">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </header>
  );
}
