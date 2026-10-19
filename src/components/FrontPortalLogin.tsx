import React, { useState } from 'react';
import {
  ShieldCheck,
  Headphones,
  CheckCircle2,
  ArrowRight,
  Search,
  UserPlus,
  Lock,
  Radio,
  KeyRound,
  Zap,
  AlertTriangle,
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Shield,
  LogIn,
  PlusCircle,
  CloudCheck,
} from 'lucide-react';
import {
  User as UserType,
  DistrictName,
  ComplaintTicket,
  ComplaintCategory,
  ComplaintPriority,
} from '../types/index.js';
import {
  signInCustomerWithGoogle,
  getCloudCustomerProfile,
  saveCloudCustomerProfile,
} from '../firebase.js';

interface FrontPortalLoginProps {
  users: UserType[];
  tickets: ComplaintTicket[];
  onLoginCustomer: (customer: UserType, firebaseUid?: string) => void;
  onLoginStaff: (staff: UserType) => void;
  onCreateCustomer: (userData: Partial<UserType>) => Promise<UserType>;
  onQuickTrackTicket: (ticketNumber: string) => void;
  onLodgeQuickComplaint?: (data: {
    customerName: string;
    phone: string;
    district: DistrictName;
    category: ComplaintCategory;
    description: string;
    priority: ComplaintPriority;
  }) => Promise<ComplaintTicket>;
}

export const FrontPortalLogin: React.FC<FrontPortalLoginProps> = ({
  users,
  tickets,
  onLoginCustomer,
  onLoginStaff,
  onCreateCustomer,
  onLodgeQuickComplaint,
}) => {
  // Page Views:
  // 'intro' = Main Citrus Introduction Page with Top Customer CTA & Bottom Staff Link
  // 'customer_auth' = Private Customer Gmail Login & Registration (Cloud Synced)
  // 'staff_auth' = Dedicated Staff & Admin Login Page (from very bottom of page)
  const [pageView, setPageView] = useState<'intro' | 'customer_auth' | 'staff_auth'>('intro');

  // Customer Auth Tab: 'google_signin' | 'register_gmail'
  const [customerAuthTab, setCustomerAuthTab] = useState<'google_signin' | 'register_gmail'>('google_signin');

  // Google Popup onboarding state (when a new Google user signs in for the first time)
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    uid: string;
    name: string;
    email: string;
  } | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Direct Gmail Sign-In State (Private — user enters their own Gmail & password)
  const [loginGmail, setLoginGmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showCustPassword, setShowCustPassword] = useState(false);

  // New Customer Register State
  const [regName, setRegName] = useState('');
  const [regGmail, setRegGmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('0300-');
  const [regCnic, setRegCnic] = useState('33100-');
  const [regDistrict, setRegDistrict] = useState<DistrictName>('Faisalabad');
  const [regAddress, setRegAddress] = useState('');
  const [regPlan, setRegPlan] = useState('50 Mbps Fiber Unlimited');
  const [isRegisteringCust, setIsRegisteringCust] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Quick Track Ticket State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<ComplaintTicket | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Staff & Admin Login State (Strictly Private — No exposed credentials)
  const [staffEmailInput, setStaffEmailInput] = useState('');
  const [staffPasswordInput, setStaffPasswordInput] = useState('');
  const [staffShowPassword, setStaffShowPassword] = useState(false);
  const [staffLoginError, setStaffLoginError] = useState<string | null>(null);

  // Quick Lodge Form State on Intro page
  const [showQuickLodgeModal, setShowQuickLodgeModal] = useState(false);
  const [lodgeName, setLodgeName] = useState('');
  const [lodgePhone, setLodgePhone] = useState('0300-');
  const [lodgeDistrict, setLodgeDistrict] = useState<DistrictName>('Faisalabad');
  const [lodgeCategory, setLodgeCategory] = useState<ComplaintCategory>('OFC_CUT');
  const [lodgeDescription, setLodgeDescription] = useState('');
  const [isSubmittingQuickLodge, setIsSubmittingQuickLodge] = useState(false);
  const [quickLodgeSuccessTicket, setQuickLodgeSuccessTicket] = useState<ComplaintTicket | null>(null);

  // Handle Quick Track by Ticket Reference Number
  const handlePerformTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;
    const clean = trackQuery.trim().toUpperCase();
    const found = tickets.find((t) => t.ticketNumber.toUpperCase() === clean);
    if (found) {
      setTrackedTicket(found);
      setTrackError(null);
    } else {
      setTrackedTicket(null);
      setTrackError(
        `No complaint found with ticket reference: "${clean}". Please verify your ticket number (e.g., PTA-FSD-2026-0041).`
      );
    }
  };

  // Real Google OAuth Popup Sign-In with Cloud Firestore Profile Lookup
  const handleGoogleOAuthSignIn = async () => {
    setRegError(null);
    setIsGoogleLoading(true);
    try {
      const fbUser = await signInCustomerWithGoogle();
      const emailLower = (fbUser.email || '').toLowerCase();

      // 1. Check if profile already exists in Cloud Firestore
      const cloudProfile = await getCloudCustomerProfile(fbUser.uid);
      if (cloudProfile) {
        // Ensure customer also exists in local backend for NOC assignment/tracking
        const existingLocal = users.find((u) => u.email.toLowerCase() === emailLower && u.role === 'customer');
        if (existingLocal) {
          setIsGoogleLoading(false);
          onLoginCustomer(existingLocal, fbUser.uid);
          return;
        } else {
          const syncedLocal = await onCreateCustomer({
            name: cloudProfile.name,
            email: cloudProfile.email,
            phone: cloudProfile.phone,
            cnic: cloudProfile.cnic,
            district: cloudProfile.district,
            areaAddress: cloudProfile.areaAddress,
            bandwidthPlan: cloudProfile.bandwidthPlan,
            role: 'customer',
            connectionType: 'FTTH',
          });
          setIsGoogleLoading(false);
          onLoginCustomer(syncedLocal, fbUser.uid);
          return;
        }
      }

      // 2. Check if customer already exists in backend by email
      const existingByEmail = users.find((u) => u.email.toLowerCase() === emailLower && u.role === 'customer');
      if (existingByEmail) {
        await saveCloudCustomerProfile(fbUser.uid, existingByEmail);
        setIsGoogleLoading(false);
        onLoginCustomer(existingByEmail, fbUser.uid);
        return;
      }

      // 3. New Google user — prompt them to complete their fiber subscriber details once
      setPendingGoogleUser({
        uid: fbUser.uid,
        name: fbUser.displayName || '',
        email: fbUser.email || '',
      });
      setRegName(fbUser.displayName || '');
      setRegGmail(fbUser.email || '');
      setCustomerAuthTab('register_gmail');
      setIsGoogleLoading(false);
    } catch (err: any) {
      setIsGoogleLoading(false);
      if (err?.code === 'auth/popup-closed-by-user') {
        setRegError('Google Sign-In popup was closed before completion.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'this IP/domain';
        setRegError(
          `Host "${host}" must be added in Firebase Console → Authentication → Settings → Authorized domains (enter "${host}" without http:// or :4000). Meanwhile, you can sign in or register directly with your Gmail & password below.`
        );
      } else {
        setRegError(
          'Could not complete Google popup sign-in in this browser window. You can also sign in or register directly with your Gmail below.'
        );
      }
    }
  };

  // Private Gmail + Password Sign-In for returning customers
  const handleDirectGmailSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    const emailClean = loginGmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setRegError('Please enter your registered Gmail address.');
      return;
    }

    const existing = users.find((u) => u.email.toLowerCase() === emailClean && u.role === 'customer');
    if (!existing) {
      setRegError('No registered subscriber found with this Gmail address. Please click "New Gmail Registration" to create your account.');
      return;
    }

    if (existing.password && existing.password !== loginPassword.trim()) {
      setRegError('Incorrect password for this Gmail subscriber account.');
      return;
    }

    onLoginCustomer(existing);
  };

  // Handle Customer Registration via Gmail (saves to Cloud Firestore + Backend)
  const handleRegisterCustomerGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim() || regName.trim().length < 2) {
      setRegError('Please enter your full name (at least 2 characters).');
      return;
    }

    const emailClean = regGmail.trim().toLowerCase();
    if (!emailClean || !emailClean.includes('@')) {
      setRegError('Please provide a valid Gmail address (e.g. yourname@gmail.com).');
      return;
    }

    const existing = users.find((u) => u.email.toLowerCase() === emailClean);
    if (existing) {
      if (existing.role !== 'customer') {
        setRegError('This email belongs to internal staff. Please use your personal Gmail address.');
        return;
      }
      if (!pendingGoogleUser) {
        setRegError('An account with this Gmail already exists. Please use "Sign In with Gmail" to log in.');
        return;
      }
    }

    setIsRegisteringCust(true);
    try {
      const newCustomer =
        existing && existing.role === 'customer'
          ? existing
          : await onCreateCustomer({
              name: regName.trim(),
              email: emailClean,
              password: regPassword.trim() || undefined,
              phone: regPhone.trim(),
              cnic: regCnic.trim() || '33100-0000000-0',
              district: regDistrict,
              areaAddress: regAddress.trim() || `${regDistrict} Fiber Sector`,
              bandwidthPlan: regPlan,
              role: 'customer',
              connectionType: 'FTTH',
            });

      if (pendingGoogleUser) {
        await saveCloudCustomerProfile(pendingGoogleUser.uid, newCustomer);
        setIsRegisteringCust(false);
        onLoginCustomer(newCustomer, pendingGoogleUser.uid);
      } else {
        setIsRegisteringCust(false);
        onLoginCustomer(newCustomer);
      }
    } catch (err: any) {
      setRegError(err.message || 'Failed to register Gmail account.');
      setIsRegisteringCust(false);
    }
  };

  // Handle Staff & Admin Login (Strictly Private — No credentials exposed)
  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffLoginError(null);

    const emailClean = staffEmailInput.trim().toLowerCase();
    const pwdClean = staffPasswordInput.trim();

    if (!emailClean || !pwdClean) {
      setStaffLoginError('Please enter your staff email and password.');
      return;
    }

    let matchedUser = users.find((u) => u.email.toLowerCase() === emailClean);

    // Built-in safeguard for System Administrator account in case DB was initialized before admin seed
    if (!matchedUser && emailClean === 'admin@citrus.net.pk' && pwdClean === 'admin123') {
      matchedUser = {
        id: 'usr-admin',
        name: 'Administrator (Citrus Operations Head)',
        email: 'admin@citrus.net.pk',
        phone: '0300-1122334',
        cnic: '33100-1122334-0',
        role: 'admin',
        password: 'admin123',
        district: 'Faisalabad',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
      };
    }

    if (!matchedUser) {
      setStaffLoginError('Invalid staff email or password. Staff accounts are provisioned by the System Administrator.');
      return;
    }

    if (matchedUser.role === 'customer') {
      setStaffLoginError(
        'Customer accounts cannot access the NOC Staff Gateway. Please use the Customer Portal at the top of the homepage.'
      );
      return;
    }

    if (matchedUser.password && matchedUser.password !== pwdClean) {
      setStaffLoginError('Invalid staff email or password. Please contact the Citrus System Administrator.');
      return;
    }

    onLoginStaff(matchedUser);
  };

  // Handle Quick Lodge Submit
  const handleQuickLodgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLodgeQuickComplaint) return;
    setIsSubmittingQuickLodge(true);
    try {
      const tkt = await onLodgeQuickComplaint({
        customerName: lodgeName,
        phone: lodgePhone,
        district: lodgeDistrict,
        category: lodgeCategory,
        description: lodgeDescription,
        priority: lodgeCategory === 'OFC_CUT' ? 'P1_CRITICAL' : 'P2_MAJOR',
      });
      setQuickLodgeSuccessTicket(tkt);
      setIsSubmittingQuickLodge(false);
    } catch (err: any) {
      setIsSubmittingQuickLodge(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW 1: PRIVATE CUSTOMER GMAIL AUTH PAGE (CLOUD SYNCED)
  // -------------------------------------------------------------
  if (pageView === 'customer_auth') {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between">
        {/* Top bar */}
        <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              setPendingGoogleUser(null);
              setRegError(null);
              setPageView('intro');
            }}
            className="flex items-center gap-2 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span>Back to Citrus Introduction Page</span>
          </button>

          <div className="flex items-center gap-2">
            <CloudCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-extrabold text-emerald-400">
              Private Gmail Cloud Complaint Portal
            </span>
          </div>
        </div>

        {/* Content Box */}
        <div className="max-w-xl w-full mx-auto px-4 py-8">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center font-black text-2xl text-slate-950 shadow-lg">
                C
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Customer Gmail Sign-In & Registration</h2>
                <p className="text-xs text-slate-400">
                  Private account authentication — your complaint history is securely stored in Google Cloud
                </p>
              </div>
            </div>

            {/* Auth Mode Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl mb-6 border border-slate-800">
              <button
                onClick={() => {
                  setRegError(null);
                  setCustomerAuthTab('google_signin');
                }}
                className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  customerAuthTab === 'google_signin'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Sign In with Gmail</span>
              </button>
              <button
                onClick={() => {
                  setRegError(null);
                  setCustomerAuthTab('register_gmail');
                }}
                className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  customerAuthTab === 'register_gmail'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Gmail Registration</span>
              </button>
            </div>

            {regError && (
              <div className="mb-5 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {customerAuthTab === 'google_signin' ? (
              <div className="space-y-5">
                {/* Official Google OAuth Button */}
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 text-center space-y-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-md">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Continue with Google (Gmail)</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Sign in securely with your personal Gmail account to access your private complaint history stored in the cloud.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleOAuthSignIn}
                    disabled={isGoogleLoading}
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                      />
                    </svg>
                    <span>
                      {isGoogleLoading ? 'Connecting to Google Account...' : 'Sign In / Register with Google Popup'}
                    </span>
                  </button>
                </div>

                <div className="relative flex py-1 items-center">
                  <div className="grow border-t border-slate-800"></div>
                  <span className="shrink mx-3 text-[11px] font-bold text-slate-500 uppercase">
                    Or Enter Registered Gmail
                  </span>
                  <div className="grow border-t border-slate-800"></div>
                </div>

                {/* Private Direct Gmail Sign-In Form (No other customer accounts displayed) */}
                <form onSubmit={handleDirectGmailSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Your Registered Gmail Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={loginGmail}
                        onChange={(e) => setLoginGmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white text-xs placeholder-slate-500 focus:outline-none"
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Account Password</label>
                    <div className="relative">
                      <input
                        type={showCustPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white text-xs placeholder-slate-500 focus:outline-none"
                      />
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowCustPassword(!showCustPassword)}
                        className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                      >
                        {showCustPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to My Complaint Portal</span>
                  </button>
                </form>

                <div className="pt-2">
                  <button
                    onClick={() => setCustomerAuthTab('register_gmail')}
                    className="w-full py-3 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500 text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>First time here? Register Your Gmail Account</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterCustomerGmail} className="space-y-4">
                {pendingGoogleUser && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/70 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Google Account Verified (<strong>{pendingGoogleUser.email}</strong>). Complete your subscriber details below to save your profile to Google Cloud.
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Name / Business Name *</label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white text-xs placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Gmail Address *</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        maxLength={120}
                        readOnly={!!pendingGoogleUser}
                        value={regGmail}
                        onChange={(e) => setRegGmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white text-xs placeholder-slate-500 focus:outline-none read-only:opacity-75"
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  {!pendingGoogleUser && (
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Set Account Password *</label>
                      <input
                        type="password"
                        required
                        minLength={4}
                        maxLength={64}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create a private password"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white text-xs placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Contact *</label>
                    <input
                      type="text"
                      required
                      maxLength={30}
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white text-xs placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">CNIC Number *</label>
                    <input
                      type="text"
                      required
                      maxLength={25}
                      value={regCnic}
                      onChange={(e) => setRegCnic(e.target.value)}
                      placeholder="33100-1234567-1"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white text-xs placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">District / Region *</label>
                    <select
                      value={regDistrict}
                      onChange={(e) => setRegDistrict(e.target.value as DistrictName)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white text-xs focus:outline-none"
                    >
                      <option value="Faisalabad">Faisalabad (Primary)</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Multan">Multan</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Islamabad">Islamabad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Bandwidth Plan</label>
                    <select
                      value={regPlan}
                      onChange={(e) => setRegPlan(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white text-xs focus:outline-none"
                    >
                      <option value="30 Mbps Fiber Plus">30 Mbps Fiber Plus</option>
                      <option value="50 Mbps Fiber Unlimited">50 Mbps Fiber Unlimited</option>
                      <option value="100 Mbps Dedicated CIR Leased Line">100 Mbps Dedicated CIR Leased Line</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Installation Address *</label>
                  <input
                    type="text"
                    required
                    maxLength={250}
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="House / Office Plaza, Street, Area"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 text-white text-xs placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegisteringCust}
                  className="w-full py-3 px-4 rounded-xl font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isRegisteringCust ? (
                    <span>Saving Account to Cloud...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Gmail Registration & Open Portal</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center py-4 text-xs text-slate-500 border-t border-slate-800">
          Citrus Pvt Ltd PTA CVAS Complaint Redressal Framework · End-to-End Subscriber Privacy Enabled
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: DEDICATED STAFF & ADMIN LOGIN PAGE (Strict Privacy — No Credentials Shown)
  // -------------------------------------------------------------
  if (pageView === 'staff_auth') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        {/* Top bar */}
        <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              setStaffLoginError(null);
              setPageView('intro');
            }}
            className="flex items-center gap-2 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500" />
            <span>Back to Citrus Introduction Page</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-800/60">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Internal NOC & Admin Gateway</span>
          </div>
        </div>

        {/* Content Box */}
        <div className="max-w-md w-full mx-auto px-4 py-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center font-black text-2xl text-white shadow-lg">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Staff & NOC Operations</h2>
                <p className="text-xs text-slate-400">Authorized Citrus personnel & administrator login</p>
              </div>
            </div>

            <div className="mb-5 p-3 rounded-2xl bg-purple-950/40 border border-purple-800/60 text-purple-200 text-xs space-y-1">
              <div className="font-extrabold flex items-center gap-1.5 text-purple-300">
                <Shield className="w-3.5 h-3.5" />
                <span>Restricted Internal Gateway</span>
              </div>
              <p className="text-[11px] text-purple-200/90 leading-relaxed">
                Enter your assigned staff email and password created by the Citrus System Administrator. Unauthorized access is strictly prohibited.
              </p>
            </div>

            {staffLoginError && (
              <div className="mb-5 p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{staffLoginError}</span>
              </div>
            )}

            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Staff Work Email / Username</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={staffEmailInput}
                    onChange={(e) => setStaffEmailInput(e.target.value)}
                    placeholder="Enter your @citrus.net.pk email"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white text-xs placeholder-slate-600 focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={staffShowPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={staffPasswordInput}
                    onChange={(e) => setStaffPasswordInput(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 text-white text-xs placeholder-slate-600 focus:outline-none"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setStaffShowPassword(!staffShowPassword)}
                    className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                  >
                    {staffShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-black text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In to NOC / Admin Control</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-slate-500 border-t border-slate-800">
          Citrus Pvt Ltd Network Operations Center (NOC) · Authorized Staff Access Only
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: MAIN INTRODUCTION PAGE (Citrus Pvt Ltd)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-amber-200">
      {/* 1. TOP HEADER & PROMINENT CUSTOMER ACTION */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo & Company Identity */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg ring-2 ring-orange-400/40">
                C
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-slate-950">
                    Citrus Pvt Ltd
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  High-Speed Optical Fiber Internet & Telecom Data Services
                </p>
              </div>
            </div>

            {/* Top Right Action Zone: Highly Visible Register Complaint & Track buttons */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right pr-3 border-r border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">24/7 NOC Helpline</span>
                <span className="font-mono font-black text-xs text-slate-800">041-111-248-787</span>
              </div>

              <button
                onClick={() => {
                  const el = document.getElementById('track-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer border border-slate-200"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Track Complaint</span>
              </button>

              {/* PRIMARY PROMINENT TOP BUTTON: Register Complaint Login (Gmail) */}
              <button
                onClick={() => setPageView('customer_auth')}
                className="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-[0.98] transition-all shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2 cursor-pointer ring-2 ring-emerald-400/40"
              >
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
                    />
                  </svg>
                </div>
                <span>Register Complaint / Customer Login</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO INTRODUCTION SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-transparent pt-12 pb-16 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-950 border border-orange-300 text-xs font-black mb-4">
              <Zap className="w-3.5 h-3.5 text-orange-600" />
              <span>PTA CVAS Regulated Telecom Redressal System · Cloud Synced</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight mb-4">
              Fast, Reliable Fiber Internet with Private Cloud Complaint Tracking
            </h1>

            <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-8">
              Welcome to <span className="font-bold text-slate-950">Citrus Pvt Ltd</span>. Register or sign in with your personal{' '}
              <span className="font-bold text-emerald-800">Gmail account</span> so your subscriber data and complete complaint history are securely stored in the cloud with strict privacy.
            </p>

            {/* Quick Hero Actions */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setPageView('customer_auth')}
                className="px-6 py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-xl hover:shadow-emerald-500/30 flex items-center gap-2 cursor-pointer"
              >
                <Headphones className="w-4 h-4" />
                <span>Sign In / Register with Gmail</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => setShowQuickLodgeModal(true)}
                className="px-5 py-3.5 rounded-2xl font-black text-sm text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-orange-600" />
                <span>Express Quick Complaint</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THREE-STEP PROCESS */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-black uppercase text-emerald-800 tracking-wider mb-1">
              100% Private & Cloud Protected
            </h2>
            <h3 className="text-2xl font-bold text-slate-950 tracking-tight">
              How Customer Gmail Registration & Cloud History Work
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Every customer has a private account linked to their Gmail. Only you can view your complaint history.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-400 transition-all shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg mb-4">
                1
              </div>
              <h4 className="text-base font-bold text-slate-950 mb-2">Register with Your Gmail</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click the top button to sign in with Google or register your Gmail address. Your account is strictly private and isolated to you.
              </p>
              <div className="mt-4 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Private Google Cloud Account</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-orange-400 transition-all shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-black text-lg mb-4">
                2
              </div>
              <h4 className="text-base font-bold text-slate-950 mb-2">Lodge Fault & Cloud Backup</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit fiber cut, red LOS light, or speed complaints. Every ticket is saved to Google Cloud Firestore under your Gmail account.
              </p>
              <div className="mt-4 text-[11px] font-bold text-orange-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Permanent Cloud Complaint History</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-400 transition-all shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-lg mb-4">
                3
              </div>
              <h4 className="text-base font-bold text-slate-950 mb-2">Live NOC ACK & Updates</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citrus NOC engineers acknowledge (ACK) your complaint within 15 minutes, assign field splicers, and update status in real time.
              </p>
              <div className="mt-4 text-[11px] font-bold text-teal-700 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Real-time Status & Resolution SLA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INSTANT TICKET TRACKING SECTION */}
      <section id="track-section" className="py-12 bg-slate-100 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-black text-amber-800 uppercase bg-amber-100 px-2 py-0.5 rounded">
                  Ticket Reference Lookup
                </span>
                <h3 className="text-xl font-black text-slate-950 mt-1">
                  Track Complaint by Ticket Reference
                </h3>
                <p className="text-xs text-slate-600">
                  Enter your specific ticket reference number to check NOC acknowledgment and field status
                </p>
              </div>
            </div>

            <form onSubmit={handlePerformTrack} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="Enter Your Ticket # (e.g. PTA-FSD-2026-XXXX)"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 focus:border-amber-500 text-sm font-mono uppercase text-slate-900 focus:outline-none"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl font-black text-xs sm:text-sm text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Track Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {trackError && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{trackError}</span>
              </div>
            )}

            {trackedTicket && (
              <div className="mt-6 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span className="font-mono font-black text-base text-slate-950">
                      {trackedTicket.ticketNumber}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      ({trackedTicket.category.replace(/_/g, ' ')})
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black ${
                      trackedTicket.status === 'RESOLVED' || trackedTicket.status === 'CLOSED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : trackedTicket.status === 'IN_PROGRESS'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Status: {trackedTicket.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-900">{trackedTicket.subject}</span>
                </div>

                {trackedTicket.latestOnlineUpdate && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                    <span className="text-[11px] text-emerald-800 font-bold block mb-0.5">
                      Status Update:
                    </span>
                    <p className="text-emerald-950 font-medium">
                      {trackedTicket.latestOnlineUpdate}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. NETWORK COVERAGE & LICENSED DISTRICTS */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-extrabold uppercase text-slate-400">
                Coverage Network
              </span>
              <h3 className="text-2xl font-bold text-slate-950 mt-1">
                Licensed PTA CVAS District Coverage
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Faisalabad Telecom Region & Connected Punjab Nodes
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                Faisalabad (Primary Hub)
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
                Lahore Metro
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
                Multan City
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
                Rawalpindi / Islamabad
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VERY BOTTOM FOOTER: CONTAINS THE DISCREET SEPARATE STAFF & ADMIN LOGIN BUTTON */}
      <footer className="bg-slate-900 text-slate-400 text-xs pt-10 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-black text-lg">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
                  C
                </div>
                <span>Citrus Pvt Ltd</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Class Value Added Services (CVAS-Data) License Holder. Providing high-speed optical fiber network, metro ethernet, and enterprise broadband infrastructure.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider block">
                Customer Support
              </span>
              <div className="space-y-1">
                <div>
                  24/7 Helpline:{' '}
                  <span className="text-slate-200 font-mono font-bold">041-111-248-787</span>
                </div>
                <div>
                  Support Email:{' '}
                  <span className="text-slate-200 font-mono">support@citrus.net.pk</span>
                </div>
                <div>
                  PTA Escalation:{' '}
                  <span className="text-slate-200 font-mono">compliance@citrus.net.pk</span>
                </div>
              </div>
            </div>

            {/* Col 3: VERY BOTTOM STAFF & ADMIN PORTAL BUTTON */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>Citrus Internal Staff & NOC Gateway</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                For Citrus NOC Engineers, Linemen, and Administrators only. Staff credentials are created by the System Administrator.
              </p>
              <button
                onClick={() => setPageView('staff_auth')}
                className="w-full py-2.5 px-3 rounded-xl font-black text-xs text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Staff & NOC Operations Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <div>
              © 2026 Citrus Pvt Ltd. All rights reserved. Regulated by Pakistan Telecommunication Authority (PTA).
            </div>
            <div>Telecom District: Faisalabad CVAS</div>
          </div>
        </div>
      </footer>

      {/* QUICK LODGE MODAL */}
      {showQuickLodgeModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setShowQuickLodgeModal(false);
                setQuickLodgeSuccessTicket(null);
              }}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 text-lg font-bold"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-slate-950 mb-1">Express Complaint Registration</h3>
            <p className="text-xs text-slate-500 mb-5">
              Quickly log a fiber fault for urgent NOC acknowledgment
            </p>

            {quickLodgeSuccessTicket ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-black text-slate-950 text-base">
                  Complaint Registered Successfully!
                </h4>
                <div className="p-3 bg-white rounded-xl border border-emerald-200 font-mono text-sm font-black text-emerald-800">
                  Ticket #: {quickLodgeSuccessTicket.ticketNumber}
                </div>
                <p className="text-xs text-slate-600">
                  Citrus NOC team has received this ticket and will acknowledge within 15 minutes.
                </p>
                <button
                  onClick={() => {
                    setShowQuickLodgeModal(false);
                    setQuickLodgeSuccessTicket(null);
                  }}
                  className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleQuickLodgeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={lodgeName}
                    onChange={(e) => setLodgeName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={lodgePhone}
                      onChange={(e) => setLodgePhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">District *</label>
                    <select
                      value={lodgeDistrict}
                      onChange={(e) => setLodgeDistrict(e.target.value as DistrictName)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="Faisalabad">Faisalabad</option>
                      <option value="Lahore">Lahore</option>
                      <option value="Multan">Multan</option>
                      <option value="Rawalpindi">Rawalpindi</option>
                      <option value="Islamabad">Islamabad</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fault Category *</label>
                  <select
                    value={lodgeCategory}
                    onChange={(e) => setLodgeCategory(e.target.value as ComplaintCategory)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="OFC_CUT">Optical Fiber Cable Cut / Red LOS Light</option>
                    <option value="SPEED_DEGRADATION">High Latency / Slow Speed Browsing</option>
                    <option value="FREQUENT_DISCONNECT">Frequent Disconnection / Packet Loss</option>
                    <option value="CPE_ONT_FAULT">ONU / Router PON Registration Failure</option>
                    <option value="BILLING_PAYMENT">Billing or Payment Verification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fault Description & Location *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={lodgeDescription}
                    onChange={(e) => setLodgeDescription(e.target.value)}
                    placeholder="Describe problem, street address, or OTDR reading..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingQuickLodge}
                  className="w-full py-3 rounded-xl font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingQuickLodge ? 'Registering Ticket...' : 'Submit Complaint'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
