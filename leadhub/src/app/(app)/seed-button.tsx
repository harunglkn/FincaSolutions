"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { seedDemoData } from "./leads/actions";

export function SeedButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={() => start(() => seedDemoData())}
    >
      {pending ? "Lade Beispieldaten …" : "Beispieldaten laden"}
    </Button>
  );
}
