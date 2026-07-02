import Link from "next/link";

type LogoProps = {
  variant?: "light" | "dark";
  href?: string;
  showText?: boolean;
};

/**
 * Finca-Solutions Markenlogo.
 * FS-Monogramm (Tuerkis "F" + Weiss "S") in dunkler Kachel — funktioniert
 * dadurch auf hellem wie dunklem Hintergrund. Daneben der Schriftzug.
 */
export function Logo({
  variant = "dark",
  href = "/",
  showText = true,
}: LogoProps) {
  const finca = variant === "light" ? "text-white" : "text-ink-900";
  const solutions = variant === "light" ? "text-ink-300" : "text-ink-400";

  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group">
      <span className="grid place-items-center h-9 w-9 rounded-lg bg-ink-900 shadow-sm">
        <span className="font-extrabold italic text-lg leading-none tracking-tighter -skew-x-6 select-none">
          <span className="text-[#18b2c6]">F</span>
          <span className="text-white">S</span>
        </span>
      </span>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className={`text-base font-bold tracking-tight ${finca}`}>
            Finca
          </span>
          <span
            className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${solutions}`}
          >
            Solutions
          </span>
        </span>
      )}
    </Link>
  );
}
