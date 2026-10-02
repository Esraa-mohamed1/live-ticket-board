import type { TicketStatus } from "@/lib/supabase/database.types";

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
  open: { label: "Open", className: "status-badge status-open" },
  in_progress: { label: "In Progress", className: "status-badge status-in-progress" },
  resolved: { label: "Resolved", className: "status-badge status-resolved" },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace("_", " "),
    className: "status-badge",
  };

  return (
    <span className={config.className}>
      <span className="status-badge-dot" aria-hidden="true" />
      {config.label}
    </span>
  );
}
