import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Activity, 
  ShieldAlert, 
  ArrowUpRight,
  FileSpreadsheet,
  Zap,
  FileCheck2,
  KeyRound,
  Wifi,
  Package,
  MapPin,
  PhoneCall,
  Server,
  Ticket
} from 'lucide-react';
import { ComplaintTicket, PTAMonthlyReport, PTALicenseeConfig } from '../types/index.js';
import { usePortalTheme } from '../context/ThemeContext.js';

interface DashboardViewProps {
  tickets: ComplaintTicket[];
  report: PTAMonthlyReport | null;
  config: PTALicenseeConfig | null;
  onSelectTicket: (ticket: ComplaintTicket) => void;
  onNavigateToTab: (tab: 'tickets' | 'reports' | 'customer' | 'server' | 'admin') => void;
  onOpenNewTicket: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tickets,
  report,
  config,
  onSelectTicket,
  onNavigateToTab,
  onOpenNewTicket,
}) => {
  const { theme } = usePortalTheme();
  const activeLicense = config?.licenseNumber || report?.licensee?.licenseNumber || 'Class/Internet/11/2026/Sargodha';
  const activeHelpline = config?.emergencyNocHelpline || report?.licensee?.emergencyNocHelpline || '03390480022';
  const activeCoverage = config?.coverageHeadline || 'District Sargodha, Pakistan only';
  const activeCompanyName = config?.licenseeName || report?.licensee?.licenseeName || 'Citrus Pvt Ltd';
  const slaP1 = config?.slaTargetP1Hours || 8;
  const slaP2 = config?.slaTargetP2Hours || 24;
  const slaP3 = config?.slaTargetP3Hours || 48;

  const activeTickets = tickets.filter(
    (t) => t.status === 'REGISTERED' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS'
  );
  const breachedTickets = tickets.filter((t) => t.isSlaBreached || t.status === 'ESCALATED_PTA');
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');
  const p1CriticalCount = tickets.filter((t) => t.priority === 'P1_CRITICAL' && t.status !== 'CLOSED').length;

  const totalCount = tickets.length;
  const resolvedCount = resolvedTickets.length;
  const withinSlaCount = resolvedTickets.filter((t) => !t.isSlaBreached).length;
  const complianceRate = resolvedCount > 0 ? Math.round((withinSlaCount / resolvedCount) * 1000) / 10 : 100;
  const zonesCount = config?.coverageZones?.length || 6;
  const packagesCount = config?.bandwidthPlans?.length || 4;

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
      {/* Top Command Bar */}
      <div
        className={`rounded-2xl p-5 border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          theme.isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {activeCompanyName}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="font-mono font-bold text-purple-700 dark:text-purple-300">
              License: {activeLicense}
            </span>
            <span aria-hidden="true" className="opacity-40">·</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">{activeCoverage}</span>
          </div>
          <h1 className="text-xl font-black tracking-tight">
            ISP Operations & SLA Compliance Dashboard
          </h1>
          <p className={`text-sm mt-0.5 ${theme.isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Click any colored box below to manage complaints, packages, coverage sectors, or company branding · 24/7 Helpline:{' '}
            <a href={`tel:${activeHelpline}`} className="font-mono font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
              {activeHelpline}
            </a>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => onNavigateToTab('admin')}
            className="px-3.5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm"
          >
            <KeyRound className="w-4 h-4" />
            <span>Admin Console & Customizer</span>
          </button>
          <button
            onClick={() => onNavigateToTab('reports')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
              theme.isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>PTA Monthly Form</span>
          </button>
          <button
            onClick={onOpenNewTicket}
            className={`px-4 py-2 text-xs font-black bg-gradient-to-r ${theme.primaryBtn} rounded-xl transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer`}
          >
            <Zap className="w-4 h-4" />
            <span>New Complaint</span>
          </button>
        </div>
      </div>

      {/* COLORFUL BOX-SHAPED DASHBOARD GRID (8 Distinct Color Boxes) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BOX 1: Royal Blue — Total Cycle Complaints */}
        <div
          onClick={() => onNavigateToTab('tickets')}
          className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-2xl p-5 shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[148px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-blue-100">Total Registered Tickets</div>
              <div className="text-3xl font-black font-mono tabular-nums mt-1">{totalCount}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Ticket className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-white/15 flex items-center justify-between text-xs text-blue-100 font-semibold">
            <span>{activeTickets.length} active in queue</span>
            <span className="flex items-center gap-1 font-bold text-white">
              Open Queue <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* BOX 2: Emerald Green — Resolved & SLA Compliance */}
        <div
          onClick={() => onNavigateToTab('reports')}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-2xl p-5 shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[148px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-emerald-100">PTA SLA Compliance</div>
              <div className="text-3xl font-black font-mono tabular-nums mt-1">{complianceRate}%</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-white/15 flex items-center justify-between text-xs text-emerald-100 font-semibold">
            <span>{resolvedCount} resolved within SLA</span>
            <span className="flex items-center gap-1 font-bold text-white">
              PTA Report <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* BOX 3: Amber / Orange — Active Dispatch & MTTR */}
        <div
          onClick={() => onNavigateToTab('tickets')}
          className="bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 rounded-2xl p-5 shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[148px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold text-slate-900/80">Mean Time To Repair (MTTR)</div>
              <div className="text-3xl font-black font-mono tabular-nums mt-1">
                {report?.meanTimeToRepairHours ?? 7.4}h
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-950/10 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-slate-950" />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-950/15 flex items-center justify-between text-xs text-slate-900 font-bold">
            <span>P1: {slaP1}h · P2: {slaP2}h · P3: {slaP3}h</span>
            <span className="flex items-center gap-1 font-black">
              Dispatch <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* BOX 4: Crimson / Rose — Critical Outages & SLA Breaches */}
        <div
          onClick={() => onNavigateToTab('tickets')}
          className="bg-gradient-to-br from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white rounded-2xl p-5 shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[148px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-rose-100">SLA Breaches / P1 Alerts</div>
              <div className="text-3xl font-black font-mono tabular-nums mt-1">
                {breachedTickets.length} <span className="text-base font-bold text-rose-200">/ {p1CriticalCount} P1</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-white/15 flex items-center justify-between text-xs text-rose-100 font-semibold">
            <span>{breachedTickets.length === 0 ? 'Zero overdue tickets' : 'Requires NOC escalation'}</span>
            <span className="flex items-center gap-1 font-bold text-white">
              Inspect <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* BOX 5: Purple / Violet — Company Brand & License Customizer */}
        <div
          onClick={() => onNavigateToTab('admin')}
          className="bg-gradient-to-br from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white rounded-2xl p-5 shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[148px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold text-purple-200">Company Brand & License</div>
              <div className="text-lg font-black truncate mt-1">{activeCompanyName}</div>
              <div className="text-xs font-mono text-purple-200 truncate mt-0.5">{activeLicense}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-white/15 flex items-center justify-between text-xs text-purple-100 font-semibold">
            <span>Logo, Name & Variables</span>
            <span className="flex items-center gap-1 font-bold text-white">
              Customize <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* BOX 6: Teal / Cyan — Fiber OLT Coverage Network */}
        <div
          onClick={() => onNavigateToTab('admin')}
          className="bg-gradient-to-br from-teal-600 to-cyan-700 hover:from-teal-500 hover:to-cyan-600 text-white rounded-2xl p-5 shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[148px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold text-teal-100">Coverage OLT Sectors</div>
              <div className="text-3xl font-black font-mono tabular-nums mt-1">{zonesCount}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-white/15 flex items-center justify-between text-xs text-teal-100 font-semibold">
            <span className="truncate max-w-[160px]">{activeCoverage}</span>
            <span className="flex items-center gap-1 font-bold text-white shrink-0">
              Edit Areas <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* BOX 7: Sky / Indigo — Bandwidth Packages & Plans */}
        <div
          onClick={() => onNavigateToTab('admin')}
          className="bg-gradient-to-br from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-2xl p-5 shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[148px]"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-sky-100">Active Fiber Packages</div>
              <div className="text-3xl font-black font-mono tabular-nums mt-1">{packagesCount}</div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-white/15 flex items-center justify-between text-xs text-sky-100 font-semibold">
            <span>FTTH & CIR Leased Plans</span>
            <span className="flex items-center gap-1 font-bold text-white">
              Manage Plans <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* BOX 8: Dark Slate / Emerald — 24/7 Helpline & Linux Server */}
        <div
          onClick={() => onNavigateToTab('server')}
          className="bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white rounded-2xl p-5 shadow-md cursor-pointer transition-transform hover:-translate-y-0.5 flex flex-col justify-between min-h-[148px] border border-slate-700"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold text-emerald-400">24/7 NOC Helpline & Host</div>
              <div className="text-xl font-black font-mono tabular-nums mt-1 truncate text-amber-300">
                {activeHelpline}
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Server className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-300 font-semibold">
            <span>Port 4000 & RADIUS Active</span>
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              Server Status <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Queue & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active NOC Dispatch Queue (2 Cols) */}
        <div
          className={`lg:col-span-2 rounded-2xl p-5 border shadow-xs ${
            theme.isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">Active Complaint Queue</h2>
              <p className={`text-xs ${theme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Real-time status of district subscribers awaiting technical resolution
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('tickets')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All ({tickets.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className={`divide-y ${theme.isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {activeTickets.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No active complaints in queue. All subscriber lines operating normally.
              </div>
            ) : (
              activeTickets.slice(0, 6).map((t) => {
                const urgency = getSlaUrgency(t);
                return (
                  <div
                    key={t.id}
                    onClick={() => onSelectTicket(t)}
                    className={`py-3.5 px-3 rounded-xl transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      theme.isDark ? 'hover:bg-slate-800/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                          {t.ticketNumber}
                        </span>
                        <span aria-hidden="true" className="opacity-30">·</span>
                        <span className="text-xs font-bold truncate">
                          {t.customerName}
                        </span>
                        <span aria-hidden="true" className="opacity-30">·</span>
                        <span className="font-mono text-xs opacity-60">
                          {t.circuitId}
                        </span>
                      </div>
                      <p className={`text-xs truncate font-medium ${theme.isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {t.subject}
                      </p>
                      <div className={`flex items-center gap-2 text-xs ${theme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
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
                      <span
                        className={`text-xs font-bold font-mono tabular-nums ${
                          urgency.isOverdue
                            ? 'text-rose-600 dark:text-rose-400'
                            : urgency.isUrgent
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {urgency.label}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="opacity-60">Status:</span>
                        <span className="font-bold">{t.status.replace('_', ' ')}</span>
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
          <div
            className={`rounded-2xl p-5 border shadow-xs ${
              theme.isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold">Configured SLA Benchmarks</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('admin')}
                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
              >
                Edit SLA
              </button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-rose-700 dark:text-rose-300">Priority 1 (Critical Outage)</div>
                  <div className="opacity-75">Optical cable cut, exchange link down</div>
                </div>
                <div className="font-mono font-black text-rose-700 dark:text-rose-300 text-sm tabular-nums">{slaP1} Hours</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-amber-800 dark:text-amber-300">Priority 2 (Major Degradation)</div>
                  <div className="opacity-75">Frequent disconnect, speed throttling</div>
                </div>
                <div className="font-mono font-black text-amber-800 dark:text-amber-300 text-sm tabular-nums">{slaP2} Hours</div>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                <div>
                  <div className="font-bold text-blue-800 dark:text-blue-300">Priority 3 (Standard / Inquiries)</div>
                  <div className="opacity-75">Billing dispute, DNS inquiry, WiFi check</div>
                </div>
                <div className="font-mono font-black text-blue-800 dark:text-blue-300 text-sm tabular-nums">{slaP3} Hours</div>
              </div>
            </div>
          </div>

          {/* District Compliance Certificate Summary */}
          <div className={`bg-gradient-to-br ${theme.heroGradient} text-white rounded-2xl p-5 shadow-md border border-white/10`}>
            <div className="flex items-center justify-between gap-2 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4" />
                <span>District CVAS License Status</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('admin')}
                className="text-[11px] font-bold text-amber-300 hover:underline lowercase cursor-pointer"
              >
                edit
              </button>
            </div>
            <div className="text-base sm:text-lg font-bold font-mono text-amber-300 break-all">
              License # {activeLicense}
            </div>
            <p className="text-xs text-slate-200/90 mt-1">
              {activeCompanyName} · {activeCoverage}. Complaint register maintained in accordance with PTA Telecom Act 1996 & TCPR 2009.
            </p>
            <div className="mt-4 pt-4 border-t border-white/15 flex items-center justify-between text-xs">
              <span className="text-emerald-300 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5" />
                <span>24/7 NOC Helpline:</span>
              </span>
              <a
                href={`tel:${activeHelpline}`}
                className="font-mono font-bold text-amber-300 hover:underline"
              >
                {activeHelpline}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
