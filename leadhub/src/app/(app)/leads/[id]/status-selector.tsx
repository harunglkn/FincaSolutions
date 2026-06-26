"use client";

import { useTransition } from "react";
import { updateLeadStatus } from "../actions";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABEL,
  type LeadStatus,
} from "@/lib/database.types";

export function StatusSelector({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) =>
        start(() => updateLeadStatus(leadId, e.target.value as LeadStatus))
      }
      className="h-8 px-3 rounded-lg border border-ink-200 bg-white text-sm font-medium text-ink-900 cursor-pointer hover:bg-ink-50"
    >
      {LEAD_STATUSES.map((s) => (
        <option key={s} value={s}>
          {LEAD_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
