import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

export type OnboardingStep = {
  key: string;
  done: boolean;
  title: string;
  desc: string;
  href: string;
  cta: string;
};

/**
 * "Erste Schritte" — fuehrt einen neuen Haendler durch die Einrichtung.
 * Blendet sich selbst aus, sobald alle Schritte erledigt sind (returns null),
 * damit erfahrene Nutzer das Dashboard sauber sehen.
 */
export function GettingStarted({ steps }: { steps: OnboardingStep[] }) {
  const doneCount = steps.filter((s) => s.done).length;
  const total = steps.length;
  if (doneCount === total) return null;

  const nextIdx = steps.findIndex((s) => !s.done);

  return (
    <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-white">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Erste Schritte</CardTitle>
          <p className="mt-0.5 text-xs text-ink-500">
            Noch {total - doneCount} von {total} erledigen — dann ist Ihr
            Autohaus vollständig eingerichtet.
          </p>
        </div>
        <span className="grid place-items-center h-9 w-14 rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
          {doneCount}/{total}
        </span>
      </CardHeader>
      <CardBody className="!p-0">
        <ul className="divide-y divide-brand-100">
          {steps.map((s, i) => {
            const isNext = i === nextIdx;
            return (
              <li key={s.key} className="px-6 py-4 flex items-center gap-4">
                {s.done ? (
                  <span className="grid place-items-center h-7 w-7 shrink-0 rounded-full bg-green-500 text-white">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      aria-hidden
                    >
                      <path
                        d="M5 13l4 4L19 7"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                ) : (
                  <span
                    className={`grid place-items-center h-7 w-7 shrink-0 rounded-full border-2 text-xs font-semibold ${
                      isNext
                        ? "border-brand-500 text-brand-700"
                        : "border-ink-300 text-ink-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      s.done ? "text-ink-400 line-through" : "text-ink-900"
                    }`}
                  >
                    {s.title}
                  </p>
                  {!s.done && (
                    <p className="text-xs text-ink-500">{s.desc}</p>
                  )}
                </div>

                {!s.done && (
                  <Link
                    href={s.href}
                    className={`shrink-0 inline-flex items-center h-9 px-3.5 rounded-lg text-sm font-medium transition ${
                      isNext
                        ? "bg-brand-600 text-white hover:bg-brand-700"
                        : "border border-ink-200 text-ink-700 hover:bg-ink-50"
                    }`}
                  >
                    {s.cta} →
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
