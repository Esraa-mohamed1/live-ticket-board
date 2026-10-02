"use client";

import { useState, useEffect } from "react";
import { updateStatusAction } from "@/modules/tickets/actions";
import { TICKET_STATUSES } from "@/modules/tickets/constants";
import type { TicketStatus } from "@/lib/supabase/database.types";
import type { StatusSelectProps } from "@/modules/tickets/interfaces";

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export function StatusSelect({ ticketId, currentStatus }: StatusSelectProps) {
  const [status, setStatus] = useState<TicketStatus>(currentStatus);
  const [isPending, setIsPending] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as TicketStatus;
    if (next === status) return;

    setError(null);
    setIsPending(true);
    setSaveSuccess(false);

    const fd = new FormData();
    fd.set("id", ticketId);
    fd.set("status", next);

    const result = await updateStatusAction(fd);
    setIsPending(false);

    if (!result.ok) {
      setError(result.error.message);
      setStatus(currentStatus);
    } else {
      setStatus(result.data.status);
      setSaveSuccess(true);
      const timer = setTimeout(() => setSaveSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }

  return (
    <div className="status-select-container">
      <div className="status-select-control">
        <label htmlFor={`status-${ticketId}`} className="status-select-label">
          Update status:
        </label>
        <div className="status-select-wrapper">
          <select
            id={`status-${ticketId}`}
            name="status"
            className="status-dropdown"
            value={status}
            onChange={handleChange}
            disabled={isPending}
            aria-label="Update ticket status"
          >
            {TICKET_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          {isPending && <span className="status-saving-hint">Updating…</span>}
          {saveSuccess && !isPending && <span className="status-saved-hint">✓ Saved</span>}
        </div>
      </div>
      {error && (
        <p className="field-error status-action-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
