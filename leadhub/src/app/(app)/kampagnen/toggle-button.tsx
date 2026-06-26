"use client";

import { useTransition } from "react";
import { toggleCampaign } from "./actions";
import { Button } from "@/components/ui/button";

export function ToggleButton({
  campaignId,
  aktiv,
}: {
  campaignId: string;
  aktiv: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => start(() => toggleCampaign(campaignId, !aktiv))}
      className={aktiv ? "text-red-700" : "text-green-700"}
    >
      {pending ? "…" : aktiv ? "Pausieren" : "Starten"}
    </Button>
  );
}
