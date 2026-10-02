import { useStats } from "@/modules/stats/hooks/useStats";
import { Spinner } from "@/shared/components/ui/Spinner";

export function StatsPanel() {
  const { stats, loading, error } = useStats();

  if (loading) return <div className="stats-panel"><Spinner /></div>;
  if (error || !stats) return null;

  const statusTotals: Record<string, number> = {};
  for (const row of stats.rows) {
    statusTotals[row.status] = (statusTotals[row.status] ?? 0) + row.count;
  }

  return (
    <aside className="stats-panel" aria-label="Ticket statistics">
      <h2 className="stats-title">Stats</h2>
      <dl className="stats-grid">
        {Object.entries(statusTotals).map(([status, count]) => (
          <div key={status} className="stat-item">
            <dt className="stat-label">{status.replace("_", " ")}</dt>
            <dd className="stat-value">{count}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
