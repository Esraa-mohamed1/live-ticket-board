"use client";

import { useState } from "react";
import { TicketForm } from "@/modules/tickets/components/TicketForm";
import { TicketList } from "@/modules/tickets/components/TicketList";
import { StatsPanel } from "@/modules/stats/components/StatsPanel";

const DEMO_CUSTOMERS = [
  { id: "00000000-0000-4000-8000-000000000001", name: "Acme Corp (Customer 1)" },
  { id: "00000000-0000-4000-8000-000000000002", name: "Beta Labs (Customer 2)" },
];

export default function DashboardPage() {
  const [activeRoleView, setActiveRoleView] = useState<"customer" | "agent">("customer");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    DEMO_CUSTOMERS[0]!.id
  );

  const isAgentView = activeRoleView === "agent";
  const isCustomerView = activeRoleView === "customer";

  return (
    <div className="dashboard-container">
      {/* View Controller: Agent View vs Customer View */}
      <section className="view-controller-card" aria-label="Role View Selector">
        <div className="view-controller-content">
          <div className="view-info">
            <span className="view-badge">
              Active: {isAgentView ? "Agent View" : "Customer View"}
            </span>
            <span className="view-description">
              {isAgentView
                ? "Viewing all tickets across the system with status update controls."
                : "Viewing only tickets created by this customer. Creating tickets enabled."}
            </span>
          </div>

          <div className="view-actions">
            <div className="role-toggle-group" role="group" aria-label="Role View Switcher">
              <button
                type="button"
                id="toggle-customer-view"
                className={`toggle-btn ${isCustomerView ? "toggle-btn-active" : ""}`}
                onClick={() => setActiveRoleView("customer")}
              >
                Customer View
              </button>
              <button
                type="button"
                id="toggle-agent-view"
                className={`toggle-btn ${isAgentView ? "toggle-btn-active" : ""}`}
                onClick={() => setActiveRoleView("agent")}
              >
                Agent View
              </button>
            </div>

            {isCustomerView && (
              <div className="customer-select-group">
                <label htmlFor="customer-simulator" className="simulator-label">
                  Customer:
                </label>
                <select
                  id="customer-simulator"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="customer-select"
                >
                  {DEMO_CUSTOMERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Grid: Left Column (Form + Stats) | Right Column (Live Ticket Board) */}
      <div className="dashboard-grid">
        <div className="dashboard-sidebar">
          {isCustomerView && (
            <section className="card create-ticket-card" aria-label="Create Support Ticket">
              <h2 className="card-title">New Support Ticket</h2>
              <TicketForm customerId={selectedCustomerId} />
            </section>
          )}

          <StatsPanel />
        </div>

        <div className="dashboard-main">
          <div className="card ticket-board-card">
            <TicketList
              isAgent={isAgentView}
              customerView={isCustomerView}
              customerId={selectedCustomerId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
