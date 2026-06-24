import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-white border border-ink-200 rounded-xl shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div className={`px-6 py-4 border-b border-ink-100 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: CardProps) {
  return (
    <h2 className={`text-base font-semibold text-ink-900 ${className}`}>
      {children}
    </h2>
  );
}

export function CardBody({ children, className = "" }: CardProps) {
  return <div className={`px-6 py-5 ${className}`}>{children}</div>;
}
