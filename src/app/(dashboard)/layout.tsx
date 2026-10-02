export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <span className="app-brand">Live Ticket Board</span>
          <span className="app-badge">Realtime</span>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
