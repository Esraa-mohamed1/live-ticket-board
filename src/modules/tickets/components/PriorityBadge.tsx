import type { PriorityBadgeProps } from "@/modules/tickets/interfaces";
import type { TicketPriority } from "@/lib/supabase/database.types";

const LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const CLASS_MAP: Record<TicketPriority, string> = {
  low: "badge badge-low",
  medium: "badge badge-medium",
  high: "badge badge-high",
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return <span className={CLASS_MAP[priority]}>{LABELS[priority]}</span>;
}
