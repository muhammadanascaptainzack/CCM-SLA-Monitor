import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { FrontPortalLogin } from './components/FrontPortalLogin.js';
import { DashboardView } from './components/DashboardView.js';
import { TicketsView } from './components/TicketsView.js';
import { CustomerPortalView } from './components/CustomerPortalView.js';
import { ComplianceReportsView } from './components/ComplianceReportsView.js';
import { LinuxServerInfoView } from './components/LinuxServerInfoView.js';
import { UserAccountsView } from './components/UserAccountsView.js';
import { AdminConsoleView } from './components/AdminConsoleView.js';
import { 
  fetchComplaints, 
  fetchUsers, 
  fetchHealth, 
  fetchConfig,
  updateConfig,
  fetchPtaMonthlyReport, 
  createComplaint, 
  updateComplaintStatus, 
  submitCustomerFeedback, 
  createUser, 
  updateUser,
  deleteUser,
  resetDatabase,
  acknowledgeComplaint,
  postOnlineUpdate
} from './services/apiClient.js';
import { 
  ComplaintTicket, 
  User, 
  SystemStats, 
  PTAMonthlyReport, 
  PTALicenseeConfig,
  UserRole, 
  ComplaintCategory, 
  ComplaintPriority, 
  DistrictName 
} from './types/index.js';
import { PlusCircle, X, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';
import {
  saveCloudComplaint,
  subscribeToCustomerCloudComplaints,
  signOutFirebaseUser,
} from './firebase.js';

export default function App() {
  // Portal session: 'none' (Front two-sided login landing) | 'customer' | 'noc'
  const [portalSession, setPortalSession] = useState<'none' | 'customer' | 'noc'>('none');
  const [activeCustomer, setActiveCustomer] = useState<User | null>(null);
  const [customerFirebaseUid, setCustomerFirebaseUid] = useState<string | null>(null);
  const [cloudTickets, setCloudTickets] = useState<ComplaintTicket[]>([]);
  const [activeStaff, setActiveStaff] = useState<User | null>(null);

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'tickets' | 'customer' | 'reports' | 'users' | 'server' | 'admin'>('dashboard');
  
  const [tickets, setTickets] = useState<ComplaintTicket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [config, setConfig] = useState<PTALicenseeConfig | null>(null);
  const [report, setReport] = useState<PTAMonthlyReport | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<ComplaintTicket | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [showGlobalNewTicketModal, setShowGlobalNewTicketModal] = useState(false);

  // Global New Ticket Form State
  const [modalCustomerId, setModalCustomerId] = useState('');
  const [modalCategory, setModalCategory] = useState<ComplaintCategory>('OFC_CUT');
  const [modalPriority, setModalPriority] = useState<ComplaintPriority>('P1_CRITICAL');
  const [modalSubject, setModalSubject] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [isSubmittingModalTicket, setIsSubmittingModalTicket] = useState(false);
  const [modalSuccessTicket, setModalSuccessTicket] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [fetchedTickets, fetchedUsers, fetchedStats, fetchedConfig, fetchedReport] = await Promise.all([
        fetchComplaints(),
        fetchUsers(),
        fetchHealth().catch(() => null),
        fetchConfig().catch(() => null),
        fetchPtaMonthlyReport().catch(() => null),
      ]);

      setTickets(fetchedTickets);
      setUsers(fetchedUsers);
      if (fetchedStats) setStats(fetchedStats);
      if (fetchedConfig) setConfig(fetchedConfig);
      if (fetchedReport) setReport(fetchedReport);

      const customers = fetchedUsers.filter((u) => u.role === 'customer');
      if (customers.length > 0) {
        setModalCustomerId(customers[0].id);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to load CMS data:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Subscribe to customer's private Google Cloud Firestore complaint history when authenticated with Gmail
  useEffect(() => {
    if (!customerFirebaseUid) {
      setCloudTickets([]);
      return;
    }
    const unsub = subscribeToCustomerCloudComplaints(customerFirebaseUid, (items) => {
      setCloudTickets(items);
    });
    return () => unsub();
  }, [customerFirebaseUid]);

  const handleRefreshReport = async (month: string, district: DistrictName) => {
    setIsReportLoading(true);
    try {
      const res = await fetchPtaMonthlyReport(month, district);
      setReport(res);
      setIsReportLoading(false);
    } catch (err) {
      console.error(err);
      setIsReportLoading(false);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<PTALicenseeConfig>) => {
    try {
      const updated = await updateConfig(newConfig);
      setConfig(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to update config');
      throw err;
    }
  };

  const handleUpdateTicketStatus = async (id: string, updates: any) => {
    try {
      const updated = await updateComplaintStatus(id, updates);
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setSelectedTicket(updated);
      fetchPtaMonthlyReport().then((r) => setReport(r)).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket');
      throw err;
    }
  };

  const handleAcknowledgeTicket = async (id: string) => {
    try {
      const staffName = activeStaff ? `${activeStaff.name} (${activeStaff.role})` : 'Citrus NOC Supervisor';
      const updated = await acknowledgeComplaint(id, staffName);
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setSelectedTicket(updated);
      fetchPtaMonthlyReport().then((r) => setReport(r)).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Failed to acknowledge complaint');
      throw err;
    }
  };

  const handlePostOnlineUpdate = async (id: string, updateText: string) => {
    try {
      const staffName = activeStaff ? activeStaff.name : 'Citrus NOC Operations';
      const updated = await postOnlineUpdate(id, updateText, staffName, 'NOC Support');
      setTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setSelectedTicket(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to post online update');
      throw err;
    }
  };

  const handleSubmitCustomerFeedback = async (
    ticketId: string,
    rating: number,
    comments: string,
    isSatisfied: boolean
  ) => {
    try {
      const updated = await submitCustomerFeedback(ticketId, rating, comments, isSatisfied);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      if (selectedTicket?.id === ticketId) setSelectedTicket(updated);
      if (customerFirebaseUid && activeCustomer) {
        await saveCloudComplaint(customerFirebaseUid, updated, activeCustomer.email).catch(() => {});
      }
      fetchPtaMonthlyReport().then((r) => setReport(r)).catch(() => {});
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback');
      throw err;
    }
  };

  const handleCreateCustomer = async (data: Partial<User>) => {
    const created = await createUser(data);
    setUsers((prev) => [...prev, created]);
    if (data.role === 'customer') {
      setActiveCustomer(created);
    }
    return created;
  };

  const handleUpdateUser = async (id: string, updates: Partial<User>) => {
    const updated = await updateUser(id, updates);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    if (activeStaff?.id === id) setActiveStaff(updated);
    if (activeCustomer?.id === id) setActiveCustomer(updated);
  };

  const handleDeleteUser = async (id: string) => {
    await deleteUser(id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleCreateComplaint = async (data: {
    customerId: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
    subject: string;
    description: string;
    opticalPowerRx?: string;
  }) => {
    const created = await createComplaint(data);
    setTickets((prev) => [created, ...prev]);
    if (customerFirebaseUid && activeCustomer) {
      await saveCloudComplaint(customerFirebaseUid, created, activeCustomer.email).catch(() => {});
    }
    fetchPtaMonthlyReport().then((r) => setReport(r)).catch(() => {});
    return created;
  };

  const handleGlobalTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCustomerId) return;
    setIsSubmittingModalTicket(true);
    try {
      const created = await createComplaint({
        customerId: modalCustomerId,
        category: modalCategory,
        priority: modalPriority,
        subject: modalSubject,
        description: modalDescription,
      });
      setTickets((prev) => [created, ...prev]);
      setModalSuccessTicket(created.ticketNumber);
      setModalSubject('');
      setModalDescription('');
      fetchPtaMonthlyReport().then((r) => setReport(r)).catch(() => {});
      setIsSubmittingModalTicket(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create ticket');
      setIsSubmittingModalTicket(false);
    }
  };

  const handleResetDatabase = async () => {
    await resetDatabase();
    await loadData();
  };

  const handleQuickTrack = (ticketNumber: string) => {
    const found = tickets.find(
      (t) => t.ticketNumber.toUpperCase() === ticketNumber.toUpperCase()
    );
    if (found) {
      const cust = users.find((u) => u.id === found.customerId);
      if (cust) setActiveCustomer(cust);
      setSelectedTicket(found);
      setPortalSession('customer');
      setCurrentTab('customer');
    } else {
      alert(`No complaint found with ticket reference: ${ticketNumber}`);
    }
  };

  const handleQuickLodgeComplaint = async (data: {
    customerName: string;
    phone: string;
    district: DistrictName;
    category: ComplaintCategory;
    description: string;
    priority: ComplaintPriority;
  }) => {
    // Check if existing customer matches phone
    const cleanPhone = data.phone.replace(/[^0-9]/g, '');
    let customer = users.find((u) => u.phone.replace(/[^0-9]/g, '') === cleanPhone);
    if (!customer) {
      customer = await createUser({
        name: data.customerName,
        phone: data.phone,
        email: `${cleanPhone || 'user'}@citrus.guest`,
        cnic: '33100-0000000-0',
        district: data.district,
        role: 'customer',
        connectionType: 'FTTH',
        bandwidthPlan: 'Standard Fiber',
      });
      setUsers((prev) => [...prev, customer!]);
    }

    const created = await createComplaint({
      customerId: customer.id,
      category: data.category,
      priority: data.priority,
      subject: `${data.category === 'OFC_CUT' ? 'Fiber Cut / Red LOS Light' : data.category === 'SPEED_DEGRADATION' ? 'Slow Speed Browsing' : 'Connection Fault'} - ${data.customerName}`,
      description: data.description,
    });

    setTickets((prev) => [created, ...prev]);
    fetchPtaMonthlyReport().then((r) => setReport(r)).catch(() => {});
    return created;
  };

  const customers = users.filter((u) => u.role === 'customer');
  const adminUser = users.find((u) => u.role === 'admin') || users.find((u) => u.role === 'support_agent') || null;

  // Merge local backend tickets with Cloud Firestore tickets for the customer
  const mergedTickets = React.useMemo(() => {
    const map = new Map<string, ComplaintTicket>();
    for (const ct of cloudTickets) {
      map.set(ct.ticketNumber, ct);
    }
    for (const lt of tickets) {
      map.set(lt.ticketNumber, lt);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [tickets, cloudTickets]);

  // If on front landing (portalSession === 'none'), show the introduction page with top customer CTA & bottom staff login
  if (portalSession === 'none') {
    return (
      <FrontPortalLogin
        users={users}
        tickets={mergedTickets}
        onLoginCustomer={(cust, fbUid) => {
          setActiveCustomer(cust);
          setCustomerFirebaseUid(fbUid || null);
          setActiveStaff(null);
          setPortalSession('customer');
          setCurrentTab('customer');
        }}
        onLoginStaff={(staff) => {
          setActiveStaff(staff);
          setActiveCustomer(null);
          setCustomerFirebaseUid(null);
          setPortalSession('noc');
          setCurrentTab(staff.role === 'admin' ? 'admin' : 'dashboard');
        }}
        onCreateCustomer={handleCreateCustomer}
        onQuickTrackTicket={handleQuickTrack}
        onLodgeQuickComplaint={handleQuickLodgeComplaint}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Bar Contract Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          // Prevent customer from accessing staff tabs
          if (portalSession === 'customer' && (tab === 'dashboard' || tab === 'admin' || tab === 'reports' || tab === 'server')) {
            setCurrentTab('customer');
            return;
          }
          // Prevent non-admin staff from accessing admin console
          if (tab === 'admin' && activeStaff?.role !== 'admin') {
            alert('Access Denied: The Admin Console requires Administrator credentials. You are signed in as ' + (activeStaff?.role || 'Staff') + '.');
            return;
          }
          setCurrentTab(tab);
        }}
        onOpenNewTicket={() => {
          setShowGlobalNewTicketModal(true);
          setModalSuccessTicket(null);
        }}
        activeUser={portalSession === 'customer' ? activeCustomer : activeStaff}
        portalMode={portalSession}
        onSwitchPortal={() => {
          signOutFirebaseUser().catch(() => {});
          setActiveCustomer(null);
          setCustomerFirebaseUid(null);
          setActiveStaff(null);
          setPortalSession('none');
          setCurrentTab('dashboard');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-sm font-medium text-slate-600">Connecting to Citrus Linux CMS Server (Port 4000/3000)...</div>
          </div>
        ) : (
          <>
            {/* Admin Console View (Team Logins, Passwords, Ports) - STRICT ADMIN GUARD */}
            {currentTab === 'admin' && (
              activeStaff?.role === 'admin' ? (
                <AdminConsoleView
                  users={users}
                  config={config}
                  onUpdateConfig={handleUpdateConfig}
                  onCreateUser={handleCreateCustomer}
                  onUpdateUser={handleUpdateUser}
                  onDeleteUser={handleDeleteUser}
                  onSwitchToUser={(user) => {
                    if (user.role === 'customer') {
                      setActiveCustomer(user);
                      setPortalSession('customer');
                      setCurrentTab('customer');
                    } else {
                      setActiveStaff(user);
                      setPortalSession('noc');
                      setCurrentTab(user.role === 'admin' ? 'admin' : 'dashboard');
                    }
                  }}
                  onBackToDashboard={() => setCurrentTab('dashboard')}
                />
              ) : (
                <div className="bg-white border border-rose-200 rounded-3xl p-8 text-center max-w-md mx-auto shadow-md space-y-4 my-12">
                  <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">Administrator Access Only</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    The Citrus Admin Console is restricted to System Administrators. Team logins, passwords, and service parameters can only be managed by the admin account.
                  </p>
                  <button
                    onClick={() => setCurrentTab('dashboard')}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Return to NOC Dashboard
                  </button>
                </div>
              )
            )}

            {/* NOC Dashboard View */}
            {currentTab === 'dashboard' && (
              <DashboardView
                tickets={tickets}
                report={report}
                onSelectTicket={(ticket) => {
                  setSelectedTicket(ticket);
                  setCurrentTab('tickets');
                }}
                onNavigateToTab={(tab) => setCurrentTab(tab)}
                onOpenNewTicket={() => {
                  setShowGlobalNewTicketModal(true);
                  setModalSuccessTicket(null);
                }}
              />
            )}

            {/* Complaint Queue View with ACK and Online Update */}
            {currentTab === 'tickets' && (
              <TicketsView
                tickets={tickets}
                selectedTicket={selectedTicket}
                onSelectTicket={setSelectedTicket}
                onUpdateTicketStatus={handleUpdateTicketStatus}
                onAcknowledgeTicket={handleAcknowledgeTicket}
                onPostOnlineUpdate={handlePostOnlineUpdate}
                onOpenNewTicket={() => {
                  setShowGlobalNewTicketModal(true);
                  setModalSuccessTicket(null);
                }}
              />
            )}

            {/* Customer Self-Service Portal View */}
            {currentTab === 'customer' && (
              <CustomerPortalView
                users={users}
                tickets={mergedTickets}
                currentCustomer={activeCustomer}
                onSelectCustomer={setActiveCustomer}
                onCreateCustomer={handleCreateCustomer}
                onSubmitComplaint={handleCreateComplaint}
                onSubmitFeedback={handleSubmitCustomerFeedback}
                onSelectTicket={(ticket) => {
                  setSelectedTicket(ticket);
                  setCurrentTab('tickets');
                }}
              />
            )}

            {/* PTA Compliance Reports View */}
            {currentTab === 'reports' && (
              <ComplianceReportsView
                report={report}
                onRefreshReport={handleRefreshReport}
                isLoading={isReportLoading}
              />
            )}

            {/* Subscriber & Staff Directory */}
            {currentTab === 'users' && (
              <UserAccountsView users={users} onCreateUser={handleCreateCustomer} />
            )}

            {/* Linux Web Server Diagnostic View */}
            {currentTab === 'server' && (
              <LinuxServerInfoView stats={stats} onResetDatabase={handleResetDatabase} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">Citrus Pvt Ltd CMS</span>
            <span aria-hidden="true">·</span>
            <span>PTA District CVAS Compliance</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-700 font-bold">Port 4000 & 3000 Active</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentTab('admin')}
              className="text-purple-700 font-bold hover:underline cursor-pointer"
            >
              Admin Console (Logins)
            </button>
            <button
              onClick={() => setPortalSession('none')}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Dual Portal Sign-In
            </button>
            <button
              onClick={() => setCurrentTab('reports')}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              PTA Annexure-C Form
            </button>
            <button
              onClick={() => setCurrentTab('server')}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Linux Service Setup
            </button>
          </div>
        </div>
      </footer>

      {/* Global Lodge Ticket Modal */}
      {showGlobalNewTicketModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Lodge PTA Regulatory Complaint</h3>
                <p className="text-slate-500">Instant Unique Ticket Generation & SLA Tracking</p>
              </div>
              <button
                onClick={() => setShowGlobalNewTicketModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalSuccessTicket ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <div className="text-base font-bold text-slate-900">Complaint Registered!</div>
                <p className="text-xs text-slate-600">Official Ticket Reference:</p>
                <div className="font-mono font-bold text-lg text-emerald-800 bg-white inline-block px-4 py-1.5 rounded border border-emerald-300">
                  {modalSuccessTicket}
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Assigned into NOC queue with statutory PTA resolution deadline.
                </p>
                <button
                  onClick={() => {
                    setShowGlobalNewTicketModal(false);
                    setCurrentTab('tickets');
                  }}
                  className="mt-2 px-4 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md cursor-pointer"
                >
                  View in Ticket Queue
                </button>
              </div>
            ) : (
              <form onSubmit={handleGlobalTicketSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Select Subscriber / Circuit ID *
                  </label>
                  <select
                    value={modalCustomerId}
                    onChange={(e) => setModalCustomerId(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900 font-medium"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.circuitId} ({c.district})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Category *</label>
                    <select
                      value={modalCategory}
                      onChange={(e) => {
                        const val = e.target.value as ComplaintCategory;
                        setModalCategory(val);
                        if (val === 'OFC_CUT') setModalPriority('P1_CRITICAL');
                        else if (val === 'BILLING_PAYMENT') setModalPriority('P3_STANDARD');
                        else setModalPriority('P2_MAJOR');
                      }}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                    >
                      <option value="OFC_CUT">🔴 Red LOS Light / Fiber Cut</option>
                      <option value="SPEED_DEGRADATION">⚡ Slow Speed / High Latency</option>
                      <option value="FREQUENT_DISCONNECT">⚠️ Disconnecting Repeatedly</option>
                      <option value="DNS_ROUTING">🌐 Specific Website Not Opening</option>
                      <option value="CPE_ONT_FAULT">🔌 ONU / Router Power Fault</option>
                      <option value="BILLING_PAYMENT">💵 Billing / Tax Deduction</option>
                      <option value="NEW_PROVISIONING">📦 New Connection Delay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Priority / SLA Target *</label>
                    <select
                      value={modalPriority}
                      onChange={(e) => setModalPriority(e.target.value as ComplaintPriority)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900 font-medium"
                    >
                      <option value="P1_CRITICAL">Priority 1 (Critical Outage - 8h Max)</option>
                      <option value="P2_MAJOR">Priority 2 (Degradation - 24h Max)</option>
                      <option value="P3_STANDARD">Priority 3 (Inquiries - 48h Max)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Complaint Subject *</label>
                  <input
                    type="text"
                    required
                    value={modalSubject}
                    onChange={(e) => setModalSubject(e.target.value)}
                    placeholder="e.g. Red Optical light flashing on ONT router"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Technical Fault Details *</label>
                  <textarea
                    required
                    rows={3}
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    placeholder="Provide details of when the issue started and what router lights are visible..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowGlobalNewTicketModal(false)}
                    className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingModalTicket}
                    className="px-5 py-2 text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingModalTicket ? 'Registering...' : 'Lodge Complaint'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
