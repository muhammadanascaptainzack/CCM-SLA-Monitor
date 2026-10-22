import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Activity, 
  ShieldAlert, 
  ArrowUpRight,
  FileSpreadsheet,
  Zap,
  Radio,
  FileCheck2,
  KeyRound
} from 'lucide-react';
import { ComplaintTicket, PTAMonthlyReport } from '../types/index.js';

interface DashboardViewProps {
  tickets: ComplaintTicket[];
  report: PTAMonthlyReport | null;
  onSelectTicket: (ticket: ComplaintTicket) => void;
  onNavigateToTab: (tab: 'tickets' | 'reports' | 'customer' | 'server' | 'admin') => void;
  onOpenNewTicket: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tickets,
  report,
  onSelectTicket,
  onNavigateToTab,
  onOpenNewTicket,
}) => {
  const activeTickets = tickets.filter(
    (t) => t.status === 'REGISTERED' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS'
  );
  const breachedTickets = tickets.filter((t) => t.isSlaBreached || t.status === 'ESCALATED_PTA');
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');

  const totalCount = tickets.length;
  const resolvedCount = resolvedTickets.length;
  const withinSlaCount = resolvedTickets.filter((t) => !t.isSlaBreached).length;
  const complianceRate = resolvedCount > 0 ? Math.round((withinSlaCount / resolvedCount) * 1000) / 10 : 100;

  // Calculate remaining SLA time or overdue time
  const getSlaUrgency = (ticket: ComplaintTicket) => {
    if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
      return { label: 'Resolved', isUrgent: false, isOverdue: ticket.isSlaBreached };
    }
    const deadlineMs = new Date(ticket.slaDeadline).getTime();
    const nowMs = Date.now();
    const diffHours = (deadlineMs - nowMs) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return {
        label: `Overdue by ${Math.abs(Math.round(diffHours * 10) / 10)}h`,
        isUrgent: true,
        isOverdue: true,
      };
    } else if (diffHours <= 3) {
      return {
        label: `${Math.round(diffHours * 10) / 10}h left (Urgent)`,
        isUrgent: true,
        isOverdue: false,
      };
    } else {
      return {
        label: `${Math.round(diffHours * 10) / 10}h left`,
        isUrgent: false,
        isOverdue: false,
      };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / District Context */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-emerald-800">PAKISTAN TELECOMMUNICATION AUTHORITY (PTA)</span>
            <span aria-hidden="true">·</span>
            <span>Telecom Consumers Protection Regulations 2009</span>
            <span aria-hidden="true">·</span>
            <span>District Sargodha, Pakistan CVAS</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            NOC Customer Complaint Management & SLA Compliance Monitor
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time tracking of subscriber faults, optical outage dispatch, and automated regulatory filing.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateToTab('admin')}
            className="px-3.5 py-2 text-xs font-bold text-purple-900 bg-purple-100 hover:bg-purple-200 border border-purple-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-xs"
          >
            <KeyRound className="w-4 h-4 text-purple-700" />
            <span>Team Logins & Passwords</span>
          </button>
          <button
            onClick={() => onNavigateToTab('reports')}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500" />
            <span>Generate PTA Form</span>
          </button>
          <button
            onClick={onOpenNewTicket}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>New Complaint</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Complaints */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Cycle Complaints</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {totalCount}
            </span>
            <span className="text-xs text-slate-500 font-mono">tickets logged</span>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="font-medium text-slate-700 font-mono tabular-nums">{activeTickets.length}</span> active in NOC queue
          </div>
        </div>

        {/* SLA Compliance Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">PTA SLA Compliance</span>
            <CheckCircle2 className={`w-4 h-4 ${complianceRate >= 95 ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${complianceRate >= 95 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {complianceRate}%
            </span>
            <span className="text-xs text-slate-500">of resolved</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            PTA CVAS Target: <span className="font-semibold text-slate-700">&ge; 95.0%</span>
          </div>
        </div>

        {/* Mean Time To Repair (MTTR) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Mean Time To Repair (MTTR)</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {report?.meanTimeToRepairHours ?? 7.4}
            </span>
            <span className="text-xs text-slate-500">hours average</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            P1: 8h limit · P2: 24h · P3: 48h
          </div>
        </div>

        {/* Breached / Escalations */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">SLA Breaches / Escalations</span>
            <ShieldAlert className={`w-4 h-4 ${breachedTickets.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${breachedTickets.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
              {breachedTickets.length}
            </span>
            <span className="text-xs text-slate-500">breached tickets</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {breachedTickets.length > 0 ? (
              <span className="text-rose-600 font-medium">Reported to PTA CPD Audit</span>
            ) : (
              <span className="text-emerald-700">Zero pending breaches</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Live Queue & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active NOC Dispatch Queue (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Complaint Queue</h2>
              <p className="text-xs text-slate-500">Real-time status of district subscribers awaiting technical resolution</p>
            </div>
            <button
              onClick={() => onNavigateToTab('tickets')}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>View All ({tickets.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {activeTickets.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No active complaints in queue. All subscriber lines operating normally.
              </div>
            ) : (
              activeTickets.slice(0, 5).map((t) => {
                const urgency = getSlaUrgency(t);
                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTicket(t)}
                    className="py-3.5 px-2 hover:bg-slate-50/80 rounded-lg transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-900">
                          {t.ticketNumber}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-xs font-medium text-slate-700 truncate">
                          {t.customerName}
                        </span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-mono text-xs text-slate-500">
                          {t.circuitId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 truncate font-medium">
                        {t.subject}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{t.district} / {t.tehsilArea}</span>
                        <span aria-hidden="true">·</span>
                        <span>{t.connectionType}</span>
                        {t.assignedTechnician && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Assigned: {t.assignedTechnician}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold font-mono tabular-nums ${
                            urgency.isOverdue
                              ? 'text-rose-700'
                              : urgency.isUrgent
                              ? 'text-amber-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {urgency.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500">Status:</span>
                        <span className="font-medium text-slate-900">{t.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Category Breakdown & Regulatory Standards (1 Col) */}
        <div className="space-y-6">
          {/* Statutory PTA SLA Targets */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3 text-slate-900">
              <ShieldAlert className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold">PTA Statutory SLA Benchmarks</h3>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Priority 1 (Critical Outage)</div>
                  <div className="text-slate-500">Optical cable cut, exchange link down</div>
                </div>
                <div className="font-mono font-bold text-slate-900 text-sm">8 Hours</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Priority 2 (Major Degradation)</div>
                  <div className="text-slate-500">Frequent disconnect, speed throttling</div>
                </div>
                <div className="font-mono font-bold text-slate-900 text-sm">24 Hours</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">Priority 3 (Standard / Inquiries)</div>
                  <div className="text-slate-500">Billing dispute, DNS inquiry, WiFi check</div>
                </div>
                <div className="font-mono font-bold text-slate-900 text-sm">48 Hours</div>
              </div>
            </div>
          </div>

          {/* District Compliance Certificate Summary */}
          <div className="bg-emerald-950 text-white rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <FileCheck2 className="w-4 h-4" />
              <span>District CVAS License Status</span>
            </div>
            <div className="text-lg font-bold">License # CITRUS-2024</div>
            <p className="text-xs text-emerald-200/80 mt-1">
              Citrus Pvt Ltd · District Sargodha, Pakistan jurisdiction. Complaint register maintained in accordance with PTA Telecom Act 1996 & TCPR 2009.
            </p>
            <div className="mt-4 pt-4 border-t border-emerald-800/60 flex items-center justify-between text-xs">
              <span className="text-emerald-300">24/7 NOC Helpline:</span>
              <span className="font-mono font-bold text-amber-300">03390480022</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
