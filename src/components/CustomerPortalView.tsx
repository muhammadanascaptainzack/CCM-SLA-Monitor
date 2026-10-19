import React, { useState } from 'react';
import { 
  User, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Star, 
  ShieldCheck, 
  FileCheck, 
  Wifi, 
  MapPin, 
  Phone,
  Send,
  UserPlus,
  Radio
} from 'lucide-react';
import { ComplaintTicket, User as UserType, ComplaintCategory, ComplaintPriority, DistrictName } from '../types/index.js';

interface CustomerPortalViewProps {
  users: UserType[];
  tickets: ComplaintTicket[];
  currentCustomer: UserType | null;
  onSelectCustomer: (user: UserType) => void;
  onCreateCustomer: (userData: Partial<UserType>) => Promise<UserType>;
  onSubmitComplaint: (data: {
    customerId: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
    subject: string;
    description: string;
    opticalPowerRx?: string;
  }) => Promise<ComplaintTicket>;
  onSubmitFeedback: (ticketId: string, rating: number, comments: string, isSatisfied: boolean) => Promise<void>;
  onSelectTicket: (ticket: ComplaintTicket) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  users,
  tickets,
  currentCustomer,
  onSelectCustomer,
  onCreateCustomer,
  onSubmitComplaint,
  onSubmitFeedback,
  onSelectTicket,
}) => {
  const [showNewComplaintForm, setShowNewComplaintForm] = useState(false);
  const [feedbackTicket, setFeedbackTicket] = useState<ComplaintTicket | null>(null);

  // New complaint form state
  const [category, setCategory] = useState<ComplaintCategory>('SPEED_DEGRADATION');
  const [priority, setPriority] = useState<ComplaintPriority>('P2_MAJOR');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSuccessNumber, setTicketSuccessNumber] = useState<string | null>(null);

  // Feedback form state
  const [rating, setRating] = useState(5);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [isSatisfied, setIsSatisfied] = useState(true);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const activeCustomer = currentCustomer;

  // Strictly filter complaints for ONLY the currently logged-in customer
  const customerTickets = tickets.filter(
    (t) =>
      activeCustomer &&
      (t.customerId === activeCustomer.id ||
        (activeCustomer.phone && t.customerPhone === activeCustomer.phone))
  );

  const handleLodgeComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer) return;
    setIsSubmittingTicket(true);
    try {
      const created = await onSubmitComplaint({
        customerId: activeCustomer.id,
        category,
        priority,
        subject,
        description,
      });
      setTicketSuccessNumber(created.ticketNumber);
      setSubject('');
      setDescription('');
      setIsSubmittingTicket(false);
    } catch (err: any) {
      alert(err.message || 'Failed to lodge complaint');
      setIsSubmittingTicket(false);
    }
  };

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackTicket) return;
    setIsSubmittingFeedback(true);
    try {
      await onSubmitFeedback(feedbackTicket.id, rating, feedbackComments, isSatisfied);
      setFeedbackTicket(null);
      setFeedbackComments('');
      setIsSubmittingFeedback(false);
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback');
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscriber Account Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-emerald-800">PRIVATE GMAIL SUBSCRIBER PORTAL</span>
            <span aria-hidden="true">·</span>
            <span>Cloud Complaint History Synced</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            My Complaint History & Live SLA Tracker
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Lodge fiber service complaints and track NOC resolution progress privately linked to your Gmail account.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setShowNewComplaintForm(true);
              setTicketSuccessNumber(null);
            }}
            className="px-4 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Lodge New Complaint</span>
          </button>
        </div>
      </div>

      {/* Strictly Private Customer Profile Card (No Switcher) */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="text-xs text-slate-400">Authenticated Gmail Subscriber Account</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {activeCustomer ? activeCustomer.name : 'Subscriber'}
            </div>
            {activeCustomer?.email && (
              <div className="text-xs text-emerald-400 font-mono mt-0.5">
                {activeCustomer.email}
              </div>
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Private Cloud Storage Active</span>
          </div>
        </div>

        {activeCustomer && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-slate-400 block">Circuit / User ID</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {activeCustomer.circuitId}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">CNIC / Registration</span>
              <span className="font-mono font-medium text-slate-200">
                {activeCustomer.cnic}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">District & Tehsil</span>
              <span className="text-slate-200">
                {activeCustomer.district} · {activeCustomer.areaAddress}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Service Package</span>
              <span className="font-medium text-slate-200">
                {activeCustomer.bandwidthPlan} ({activeCustomer.connectionType})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lodge New Complaint Modal / Collapsible */}
      {showNewComplaintForm && (
        <div className="bg-white border border-emerald-300 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Lodge New PTA Regulatory Complaint</h2>
              <p className="text-xs text-slate-500">
                Mandatory SLA will be assigned as per PTA Telecom Consumer Protection Regulations.
              </p>
            </div>
            <button
              onClick={() => setShowNewComplaintForm(false)}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>

          {ticketSuccessNumber ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-base font-bold text-slate-900">
                Complaint Registered Successfully!
              </div>
              <p className="text-xs text-slate-600">
                Your official PTA Reference Number is:
              </p>
              <div className="font-mono font-bold text-xl text-emerald-800 bg-white inline-block px-4 py-1.5 rounded border border-emerald-300">
                {ticketSuccessNumber}
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                An automated SMS alert has been dispatched. Our technical field team has been assigned in accordance with statutory SLA.
              </p>
              <button
                onClick={() => {
                  setTicketSuccessNumber(null);
                  setShowNewComplaintForm(false);
                }}
                className="mt-3 px-4 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md"
              >
                Return to My Complaints
              </button>
            </div>
          ) : (
            <form onSubmit={handleLodgeComplaint} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Complaint Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const val = e.target.value as ComplaintCategory;
                      setCategory(val);
                      if (val === 'OFC_CUT') setPriority('P1_CRITICAL');
                      else if (val === 'BILLING_PAYMENT') setPriority('P3_STANDARD');
                      else setPriority('P2_MAJOR');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                  >
                    <option value="OFC_CUT">Optical Fiber Cable Cut / Total Media Down (P1)</option>
                    <option value="SPEED_DEGRADATION">Speed Degradation / Slow Browsing (P2)</option>
                    <option value="FREQUENT_DISCONNECT">Frequent Disconnection / Intermittent Drops (P2)</option>
                    <option value="DNS_ROUTING">DNS & Website Access Issues (P2)</option>
                    <option value="CPE_ONT_FAULT">ONU / Router Hardware Fault (P2)</option>
                    <option value="BILLING_PAYMENT">Billing & Tax Deduction Dispute (P3)</option>
                    <option value="NEW_PROVISIONING">New Connection / Shifting Delay (P3)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Priority & Mandated SLA Window *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                  >
                    <option value="P1_CRITICAL">Priority 1 (Critical Outage - 8 Hours Target)</option>
                    <option value="P2_MAJOR">Priority 2 (Major Degradation - 24 Hours Target)</option>
                    <option value="P3_STANDARD">Priority 3 (Standard / Billing - 48 Hours Target)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Subject / Short Title *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Red Optical light flashing on ONT / Speed drop to 3 Mbps"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Detailed Description & Diagnostic Notes *
                </label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe when the issue began, which lights are on your router, and any error messages received..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewComplaintForm(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="px-5 py-2 text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingTicket ? 'Lodging...' : 'Register Complaint (PTA Ticket)'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Customer's Complaint Status List */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Complaint Status</h2>
            <p className="text-xs text-slate-500">Current status of your registered complaints</p>
          </div>
          <div className="text-xs font-mono text-slate-500">
            {customerTickets.length} {customerTickets.length === 1 ? 'Complaint' : 'Complaints'}
          </div>
        </div>

        {customerTickets.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No complaints registered for this account.
          </div>
        ) : (
          <div className="space-y-4">
            {customerTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors text-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {ticket.ticketNumber}
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="font-medium text-slate-700">{ticket.category.replace(/_/g, ' ')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Status:</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold ${
                        ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ticket.status === 'ESCALATED_PTA'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-sm font-semibold text-slate-900">
                  {ticket.subject}
                </div>
                <p className="text-slate-600">{ticket.description}</p>

                {/* Complaint Status Summary */}
                {ticket.acknowledgedAt ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Complaint Acknowledged — Resolution in Progress</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Pending Acknowledgment</span>
                  </div>
                )}

                {/* Status Note from Support if posted */}
                {ticket.latestOnlineUpdate && (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs space-y-1">
                    <div className="text-amber-950 font-bold">Status Update:</div>
                    <p className="text-slate-900 font-medium">"{ticket.latestOnlineUpdate}"</p>
                  </div>
                )}

                {/* Resolution & Feedback Sign-Off */}
                {ticket.status === 'RESOLVED' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-emerald-950">
                        Complaint Resolved
                      </div>
                      <p className="text-emerald-800 text-[11px] mt-0.5">
                        Please confirm your service is working to close this complaint.
                      </p>
                    </div>
                    <button
                      onClick={() => setFeedbackTicket(ticket)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md whitespace-nowrap shadow-xs cursor-pointer"
                    >
                      Verify & Rate Service
                    </button>
                  </div>
                )}

                {ticket.feedbackRating !== undefined && (
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="font-medium text-slate-700">Your Rating:</span>
                    <span className="font-mono font-bold text-amber-600">
                      {'★'.repeat(ticket.feedbackRating)}{'☆'.repeat(5 - ticket.feedbackRating)} ({ticket.feedbackRating}/5)
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Customer Verification & Satisfaction Rating Modal */}
      {feedbackTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Customer Closure Sign-Off</h3>
                <p className="text-slate-500 font-mono">{feedbackTicket.ticketNumber}</p>
              </div>
              <button
                onClick={() => setFeedbackTicket(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendFeedback} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-2">
                  Service Restoration Satisfaction (1 to 5 Stars) *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 ${
                        star <= rating ? 'text-amber-500' : 'text-slate-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="font-mono font-bold text-slate-800 ml-2">
                    {rating} / 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Was your internet service restored to satisfactory standard?
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="satisfied"
                      checked={isSatisfied}
                      onChange={() => setIsSatisfied(true)}
                    />
                    <span className="text-slate-800">Yes, fully restored</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="satisfied"
                      checked={!isSatisfied}
                      onChange={() => setIsSatisfied(false)}
                    />
                    <span className="text-slate-800">No, issues remain</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Feedback Remarks *
                </label>
                <textarea
                  required
                  rows={3}
                  value={feedbackComments}
                  onChange={(e) => setFeedbackComments(e.target.value)}
                  placeholder="e.g. Technician arrived promptly, optical fiber replaced, verified speed at 50 Mbps."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFeedbackTicket(null)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="px-5 py-2 text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg font-bold shadow-xs"
                >
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit Sign-off & Close Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
