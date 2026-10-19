import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  User, 
  Send,
  X,
  ExternalLink,
  Activity,
  FileText
} from 'lucide-react';
import { ComplaintTicket, ComplaintStatus, ComplaintPriority, ComplaintCategory, DistrictName } from '../types/index.js';

interface TicketsViewProps {
  tickets: ComplaintTicket[];
  selectedTicket: ComplaintTicket | null;
  onSelectTicket: (ticket: ComplaintTicket | null) => void;
  onUpdateTicketStatus: (
    id: string,
    updates: {
      status?: ComplaintStatus;
      assignedTechnician?: string;
      opticalPowerRx?: string;
      pingLatencyMs?: number;
      packetLossPercent?: number;
      rootCauseCategory?: string;
      rootCauseNotes?: string;
      correctiveAction?: string;
      performedBy: string;
      role: string;
      actionNotes?: string;
    }
  ) => Promise<void>;
  onAcknowledgeTicket?: (id: string) => Promise<void>;
  onPostOnlineUpdate?: (id: string, updateText: string) => Promise<void>;
  onOpenNewTicket: () => void;
}

const CATEGORY_NAMES: Record<ComplaintCategory, string> = {
  OFC_CUT: 'Optical Fiber Cut (OFC)',
  SPEED_DEGRADATION: 'Speed Degradation / Throttling',
  FREQUENT_DISCONNECT: 'Frequent Disconnection',
  DNS_ROUTING: 'DNS & Upstream Routing',
  CPE_ONT_FAULT: 'ONT / CPE Router Fault',
  BILLING_PAYMENT: 'Billing Discrepancy',
  NEW_PROVISIONING: 'New Provisioning Delay',
};

export const TicketsView: React.FC<TicketsViewProps> = ({
  tickets,
  selectedTicket,
  onSelectTicket,
  onUpdateTicketStatus,
  onAcknowledgeTicket,
  onPostOnlineUpdate,
  onOpenNewTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Detail modal update form states
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('IN_PROGRESS');
  const [technicianName, setTechnicianName] = useState('');
  const [rootCauseCategory, setRootCauseCategory] = useState('');
  const [rootCauseNotes, setRootCauseNotes] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [opticalReading, setOpticalReading] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [onlineUpdateText, setOnlineUpdateText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAcking, setIsAcking] = useState(false);
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);

  // Sync state when selectedTicket changes
  React.useEffect(() => {
    if (selectedTicket) {
      setNewStatus(selectedTicket.status);
      setTechnicianName(selectedTicket.assignedTechnician || '');
      setRootCauseCategory(selectedTicket.rootCauseCategory || '');
      setRootCauseNotes(selectedTicket.rootCauseNotes || '');
      setCorrectiveAction(selectedTicket.correctiveAction || '');
      setOpticalReading(selectedTicket.opticalPowerRx || '');
      setActionNotes('');
      setOnlineUpdateText('');
    }
  }, [selectedTicket]);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        t.customerName.toLowerCase().includes(q) ||
        t.circuitId.toLowerCase().includes(q) ||
        t.customerPhone.includes(q) ||
        t.subject.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleApplyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setIsUpdating(true);
    try {
      await onUpdateTicketStatus(selectedTicket.id, {
        status: newStatus,
        assignedTechnician: technicianName,
        opticalPowerRx: opticalReading,
        rootCauseCategory,
        rootCauseNotes,
        correctiveAction,
        performedBy: 'Hafiz Bilal Ahmed',
        role: 'NOC Dispatch',
        actionNotes: actionNotes || `Status updated to ${newStatus}`
      });
      setIsUpdating(false);
    } catch (err) {
      console.error(err);
      setIsUpdating(false);
    }
  };

  const handleAck = async () => {
    if (!selectedTicket || !onAcknowledgeTicket) return;
    setIsAcking(true);
    try {
      await onAcknowledgeTicket(selectedTicket.id);
      setIsAcking(false);
    } catch (err) {
      console.error(err);
      setIsAcking(false);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !onPostOnlineUpdate || !onlineUpdateText.trim()) return;
    setIsPostingUpdate(true);
    try {
      await onPostOnlineUpdate(selectedTicket.id, onlineUpdateText.trim());
      setOnlineUpdateText('');
      setIsPostingUpdate(false);
    } catch (err) {
      console.error(err);
      setIsPostingUpdate(false);
    }
  };

  const getPriorityLabel = (priority: ComplaintPriority) => {
    switch (priority) {
      case 'P1_CRITICAL':
        return { label: 'P1 Critical (8h)', color: 'text-rose-700 font-semibold' };
      case 'P2_MAJOR':
        return { label: 'P2 Major (24h)', color: 'text-amber-700 font-medium' };
      case 'P3_STANDARD':
        return { label: 'P3 Standard (48h)', color: 'text-slate-600' };
    }
  };

  const getStatusLabel = (status: ComplaintStatus) => {
    switch (status) {
      case 'REGISTERED':
        return { label: 'Registered', color: 'text-slate-700' };
      case 'ASSIGNED':
        return { label: 'Assigned', color: 'text-blue-700 font-medium' };
      case 'IN_PROGRESS':
        return { label: 'In Progress', color: 'text-amber-700 font-medium' };
      case 'RESOLVED':
        return { label: 'Resolved', color: 'text-emerald-700 font-semibold' };
      case 'CLOSED':
        return { label: 'Closed (Verified)', color: 'text-slate-500 font-medium' };
      case 'ESCALATED_PTA':
        return { label: 'PTA Escalated', color: 'text-rose-700 font-bold' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Ticket ID (e.g. PTA-FSD-2026-0041), Customer Name, Circuit ID, or Phone..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white text-slate-900 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewTicket}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              + Lodge Ticket
            </button>
          </div>
        </div>

        {/* Filter Badges Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter By:</span>
          </div>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="REGISTERED">Registered</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="ESCALATED_PTA">PTA Escalated</option>
          </select>

          {/* Priority selector */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="P1_CRITICAL">P1 Critical (8h SLA)</option>
            <option value="P2_MAJOR">P2 Major (24h SLA)</option>
            <option value="P3_STANDARD">P3 Standard (48h SLA)</option>
          </select>

          {/* Category selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 rounded-md text-slate-700 focus:outline-none max-w-xs truncate"
          >
            <option value="ALL">All Categories</option>
            <option value="OFC_CUT">Optical Fiber Cable Cut</option>
            <option value="SPEED_DEGRADATION">Speed Degradation</option>
            <option value="FREQUENT_DISCONNECT">Frequent Disconnection</option>
            <option value="DNS_ROUTING">DNS & Routing</option>
            <option value="CPE_ONT_FAULT">CPE / ONT Hardware</option>
            <option value="BILLING_PAYMENT">Billing & Tax Dispute</option>
            <option value="NEW_PROVISIONING">New Connection Delay</option>
          </select>

          {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL' || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
                setCategoryFilter('ALL');
                setSearchTerm('');
              }}
              className="px-2 py-1 text-xs text-rose-600 hover:text-rose-700 underline"
            >
              Reset Filters
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500 font-mono tabular-nums">
            Showing {filteredTickets.length} of {tickets.length} complaints
          </div>
        </div>
      </div>

      {/* High-Density Tickets Data Grid */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Ticket Number</th>
                <th className="py-3 px-4">Customer & Circuit</th>
                <th className="py-3 px-4">Category & Subject</th>
                <th className="py-3 px-4">Priority / SLA Target</th>
                <th className="py-3 px-4">Resolution / MTTR</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No complaint tickets match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const prio = getPriorityLabel(ticket.priority);
                  const stat = getStatusLabel(ticket.status);
                  const isSelected = selectedTicket?.id === ticket.id;

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? 'bg-emerald-50/60' : ''
                      }`}
                    >
                      {/* Ticket Number */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          {ticket.ticketNumber}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          {new Date(ticket.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Customer & Circuit */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 max-w-[180px] truncate">
                          {ticket.customerName}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <span>{ticket.circuitId}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ticket.customerPhone}</span>
                        </div>
                      </td>

                      {/* Category & Subject */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate">
                          {ticket.subject}
                        </div>
                        <div className="text-slate-500 text-[11px] truncate">
                          {CATEGORY_NAMES[ticket.category]} · {ticket.tehsilArea}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className={prio.color}>{prio.label}</div>
                        <div className="text-slate-400 text-[11px]">
                          Due: {new Date(ticket.slaDeadline).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Resolution / MTTR */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums">
                        {ticket.resolutionTimeHours !== undefined ? (
                          <div>
                            <span className="font-bold text-slate-900">{ticket.resolutionTimeHours} hrs</span>
                            <div className="text-[11px]">
                              {ticket.isSlaBreached ? (
                                <span className="text-rose-600 font-semibold">SLA Breached</span>
                              ) : (
                                <span className="text-emerald-700">Within SLA</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">In Progress</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={stat.color}>{stat.label}</span>
                        {ticket.assignedTechnician && (
                          <div className="text-slate-400 text-[11px] truncate max-w-[120px]">
                            {ticket.assignedTechnician.split(' ')[0]}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicket(ticket);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details & Lifecycle Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <span className="font-mono font-bold text-slate-900">{selectedTicket.ticketNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span>District {selectedTicket.district}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{selectedTicket.circuitId}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                onClick={() => onSelectTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="p-5 overflow-y-auto space-y-6 text-xs flex-1">
              {/* Subscriber Metadata Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-slate-500 block">Subscriber</span>
                  <span className="font-semibold text-slate-900">{selectedTicket.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Phone</span>
                  <span className="font-mono font-medium text-slate-900">{selectedTicket.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">CNIC / NTN</span>
                  <span className="font-mono font-medium text-slate-900">{selectedTicket.customerCnic}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Package</span>
                  <span className="font-medium text-slate-900">{selectedTicket.bandwidthPlan}</span>
                </div>
              </div>

              {/* Description & Diagnostic info */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Complaint Brief</h4>
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Technical Diagnostics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block">Optical Rx Power</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selectedTicket.opticalPowerRx || 'Not Recorded'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block">Ping Latency</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selectedTicket.pingLatencyMs !== undefined ? `${selectedTicket.pingLatencyMs} ms` : 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 block">Packet Loss</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {selectedTicket.packetLossPercent !== undefined ? `${selectedTicket.packetLossPercent}%` : '0%'}
                  </span>
                </div>
              </div>

              {/* Root Cause Analysis (Mandatory for PTA compliance closure) */}
              {(selectedTicket.rootCauseCategory || selectedTicket.correctiveAction) && (
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/70 rounded-lg space-y-2">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>PTA Root Cause Analysis & Corrective Action Log</span>
                  </div>
                  <div className="text-slate-700">
                    <span className="font-medium text-slate-900">Category: </span>
                    {selectedTicket.rootCauseCategory}
                  </div>
                  {selectedTicket.rootCauseNotes && (
                    <div className="text-slate-700">
                      <span className="font-medium text-slate-900">Diagnostic Findings: </span>
                      {selectedTicket.rootCauseNotes}
                    </div>
                  )}
                  {selectedTicket.correctiveAction && (
                    <div className="text-slate-700">
                      <span className="font-medium text-slate-900">Action Taken: </span>
                      {selectedTicket.correctiveAction}
                    </div>
                  )}
                </div>
              )}

              {/* Customer Rating / Closure Sign-off */}
              {selectedTicket.feedbackRating !== undefined && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900">Customer Closure Verification</span>
                    <span className="font-mono font-bold text-amber-700">
                      {selectedTicket.feedbackRating} / 5 Stars
                    </span>
                  </div>
                  <p className="text-slate-600 italic">"{selectedTicket.feedbackComments}"</p>
                </div>
              )}

              {/* NOC Complaint Acknowledgment (PTA Requirement) */}
              {!selectedTicket.acknowledgedAt ? (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Action Required: Complaint Acknowledgment (ACK)</span>
                    </div>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      PTA Telecom Regulations mandate prompt acknowledgment by ISP NOC upon subscriber registration.
                    </p>
                  </div>
                  {onAcknowledgeTicket && (
                    <button
                      type="button"
                      onClick={handleAck}
                      disabled={isAcking}
                      className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 disabled:opacity-50 rounded-lg whitespace-nowrap shadow-xs"
                    >
                      {isAcking ? 'Acknowledging...' : 'Acknowledge Complaint (ACK)'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-center justify-between text-emerald-950">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold">Complaint Acknowledged (ACK)</span>
                      <span className="text-slate-600 ml-1">by {selectedTicket.acknowledgedBy || 'NOC Operations'}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-800">
                    {new Date(selectedTicket.acknowledgedAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}

              {/* NOC Live Online Web Update Box (Customer visible) */}
              <div className="p-3.5 bg-slate-900 text-slate-100 rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-white">Post Live Web Update to Customer</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Instantly displayed on Subscriber Portal</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={onlineUpdateText}
                    onChange={(e) => setOnlineUpdateText(e.target.value)}
                    placeholder="e.g. Splicing team on site at Canal Rd joint. 18/24 cores spliced. ETA 30 mins."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handlePostUpdate}
                    disabled={isPostingUpdate || !onlineUpdateText.trim()}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg whitespace-nowrap shadow-xs"
                  >
                    {isPostingUpdate ? 'Posting...' : 'Post Update'}
                  </button>
                </div>

                {selectedTicket.latestOnlineUpdate && (
                  <div className="text-[11px] text-slate-300 pt-1 border-t border-slate-800 flex items-start gap-1.5">
                    <span className="text-amber-400 font-semibold shrink-0">Current Online Status:</span>
                    <span className="italic">"{selectedTicket.latestOnlineUpdate}"</span>
                  </div>
                )}
              </div>

              {/* Workflow Update Form (NOC / Splicer actions) */}
              <form onSubmit={handleApplyUpdate} className="border-t border-slate-200 pt-4 space-y-4">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-700" />
                  <span>Update Workflow Status & Technical Notes</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Change Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                    >
                      <option value="REGISTERED">Registered</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved (Work Completed)</option>
                      <option value="CLOSED">Closed (Verified)</option>
                      <option value="ESCALATED_PTA">Escalated to PTA CPD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Assigned Lineman / Engineer</label>
                    <input
                      type="text"
                      value={technicianName}
                      onChange={(e) => setTechnicianName(e.target.value)}
                      placeholder="e.g. Kamran Haider (Lineman / Splicer)"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Optical Power Rx (dBm)</label>
                    <input
                      type="text"
                      value={opticalReading}
                      onChange={(e) => setOpticalReading(e.target.value)}
                      placeholder="e.g. -19.4 dBm"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-medium mb-1">Root Cause Classification</label>
                    <input
                      type="text"
                      value={rootCauseCategory}
                      onChange={(e) => setRootCauseCategory(e.target.value)}
                      placeholder="e.g. Third-Party Excavation / WASA Road Work"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Corrective Action Taken</label>
                  <textarea
                    rows={2}
                    value={correctiveAction}
                    onChange={(e) => setCorrectiveAction(e.target.value)}
                    placeholder="e.g. Optical core spliced, ONT rebooted, power levels verified."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectTicket(null)}
                    className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg font-semibold"
                  >
                    {isUpdating ? 'Saving...' : 'Update Ticket'}
                  </button>
                </div>
              </form>

              {/* Complete Audit Timeline */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Regulatory Audit Timeline</h4>
                <div className="space-y-3 pl-2 border-l border-slate-200">
                  {selectedTicket.timeline.map((entry) => (
                    <div key={entry.id} className="relative pl-4 space-y-0.5">
                      <div className="w-2 h-2 rounded-full bg-slate-400 absolute -left-[5px] top-1" />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">{entry.action}</span>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-500">{entry.performedBy} ({entry.role})</span>
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {new Date(entry.timestamp).toLocaleString('en-GB')}
                      </div>
                      {entry.notes && (
                        <p className="text-slate-600 bg-slate-50 p-2 rounded mt-1 border border-slate-100">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
