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
  PhoneCall,
  MapPin,
  Wifi,
  Copy,
  Check,
  Sparkles,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Globe,
  Router,
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

interface SargodhaZone {
  id: string;
  name: string;
  blocks: string;
  oltNode: string;
  status: 'Active GPON Fiber' | 'High-Speed FTTH';
  opticalSignal: string;
  pingMs: string;
  color: string;
  badgeBg: string;
}

const SARGODHA_ZONES: SargodhaZone[] = [
  {
    id: 'satellite-town',
    name: 'Satellite Town (Blocks A, B, C, D & X, Y, Z)',
    blocks: 'Main Commercial Market, Block A–Z Residential Sectors',
    oltNode: 'SGD-OLT-01 (Huawei MA5800 X7)',
    status: 'Active GPON Fiber',
    opticalSignal: '-18.4 dBm (Optimal)',
    pingMs: '4 ms',
    color: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'university-road',
    name: 'University Road & UOS Campus Corridor',
    blocks: 'University of Sargodha, Khayaban-e-Sadiq, New Satellite Town',
    oltNode: 'SGD-OLT-02 (Core Ring North)',
    status: 'High-Speed FTTH',
    opticalSignal: '-19.1 dBm (Optimal)',
    pingMs: '5 ms',
    color: 'from-orange-500 to-amber-500',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    id: 'model-town',
    name: 'Model Town, Civil Lines & Club Road',
    blocks: 'Civil Lines, District Courts, Club Road, Officer Colony',
    oltNode: 'SGD-OLT-03 (Metro Core)',
    status: 'Active GPON Fiber',
    opticalSignal: '-18.8 dBm (Optimal)',
    pingMs: '4 ms',
    color: 'from-sky-500 to-indigo-600',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
  },
  {
    id: 'queens-cantt',
    name: 'Queens Road, Cantt & PAF Road Commercial',
    blocks: 'Cantt Plaza, Queens Road, Katchery Bazaar, Trust Plaza',
    oltNode: 'SGD-OLT-04 (Enterprise CIR Node)',
    status: 'High-Speed FTTH',
    opticalSignal: '-17.9 dBm (Optimal)',
    pingMs: '3 ms',
    color: 'from-purple-600 to-fuchsia-600',
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
  },
  {
    id: 'faisalabad-lahore-rd',
    name: 'Faisalabad Road, Lahore Road & Industrial Zone',
    blocks: 'Chak 47 NB, Silanwali Road, Citrus Processing Zone, 49 Tail',
    oltNode: 'SGD-OLT-05 (Industrial Feeder)',
    status: 'Active GPON Fiber',
    opticalSignal: '-19.6 dBm (Optimal)',
    pingMs: '6 ms',
    color: 'from-rose-500 to-orange-500',
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  {
    id: 'khushab-bhalwal',
    name: 'Khushab Road, Bhalwal & Kot Momin Link',
    blocks: 'Fatima Jinnah Road, Eidgah Road, Ispahani Town, Bhalwal Feeder',
    oltNode: 'SGD-OLT-06 (District Ring West)',
    status: 'High-Speed FTTH',
    opticalSignal: '-19.3 dBm (Optimal)',
    pingMs: '5 ms',
    color: 'from-teal-500 to-cyan-600',
    badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
  },
];

const DIAGNOSTIC_PRESETS: {
  category: ComplaintCategory;
  priority: ComplaintPriority;
  title: string;
  subtitle: string;
  slaHours: string;
  tip: string;
  gradient: string;
  lightBg: string;
}[] = [
  {
    category: 'OFC_CUT',
    priority: 'P1_CRITICAL',
    title: 'Red LOS Light Blinking',
    subtitle: 'Optical Fiber Cut / Zero Signal',
    slaHours: '8 Hours Mandatory SLA',
    tip: 'Check if the yellow/white fiber patch cord behind your ONT router is unplugged or sharply bent. If intact, an outdoor fiber splice team is dispatched immediately.',
    gradient: 'from-rose-500 to-red-600',
    lightBg: 'bg-rose-50 border-rose-200 text-rose-950',
  },
  {
    category: 'SPEED_DEGRADATION',
    priority: 'P2_MAJOR',
    title: 'Slow Speed / High Ping',
    subtitle: 'Bandwidth Drop or Latency Spike',
    slaHours: '24 Hours Mandatory SLA',
    tip: 'Our NOC checks your optical Rx power (-15 to -24 dBm ideal) and resets your PPPoE bandwidth profile on the Sargodha Core BRAS.',
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50 border-amber-200 text-amber-950',
  },
  {
    category: 'FREQUENT_DISCONNECT',
    priority: 'P2_MAJOR',
    title: 'Frequent Disconnection',
    subtitle: 'Link Drops Every Few Minutes',
    slaHours: '24 Hours Mandatory SLA',
    tip: 'Usually caused by high optical attenuation (> -27 dBm) or loose SC/APC connector. Our Sargodha lineman re-terminates the connector.',
    gradient: 'from-purple-600 to-indigo-600',
    lightBg: 'bg-purple-50 border-purple-200 text-purple-950',
  },
  {
    category: 'CPE_ONT_FAULT',
    priority: 'P2_MAJOR',
    title: 'Router / ONT Hardware Fault',
    subtitle: 'Power Adapter or Wi-Fi Issue',
    slaHours: '24 Hours Mandatory SLA',
    tip: 'If your router power LED is off or PON light fails to register, our field team tests the 12V power unit and optical transceiver.',
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50 border-emerald-200 text-emerald-950',
  },
];

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

  // Google Popup onboarding state
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    uid: string;
    name: string;
    email: string;
  } | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Direct Gmail Sign-In State
  const [loginGmail, setLoginGmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showCustPassword, setShowCustPassword] = useState(false);

  // New Customer Register State (District Sargodha only)
  const [regName, setRegName] = useState('');
  const [regGmail, setRegGmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('0300-');
  const [regCnic, setRegCnic] = useState('38403-');
  const [regDistrict, setRegDistrict] = useState<DistrictName>('Sargodha');
  const [regAddress, setRegAddress] = useState('');
  const [regPlan, setRegPlan] = useState('50 Mbps Fiber Unlimited');
  const [isRegisteringCust, setIsRegisteringCust] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Quick Track Ticket State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackedTicket, setTrackedTicket] = useState<ComplaintTicket | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Staff & Admin Login State (Strictly Private)
  const [staffEmailInput, setStaffEmailInput] = useState('');
  const [staffPasswordInput, setStaffPasswordInput] = useState('');
  const [staffShowPassword, setStaffShowPassword] = useState(false);
  const [staffLoginError, setStaffLoginError] = useState<string | null>(null);

  // Quick Lodge Form State on Intro page (District Sargodha only)
  const [showQuickLodgeModal, setShowQuickLodgeModal] = useState(false);
  const [lodgeName, setLodgeName] = useState('');
  const [lodgePhone, setLodgePhone] = useState('0300-');
  const [lodgeDistrict, setLodgeDistrict] = useState<DistrictName>('Sargodha');
  const [lodgeCategory, setLodgeCategory] = useState<ComplaintCategory>('OFC_CUT');
  const [lodgeDescription, setLodgeDescription] = useState('');
  const [isSubmittingQuickLodge, setIsSubmittingQuickLodge] = useState(false);
  const [quickLodgeSuccessTicket, setQuickLodgeSuccessTicket] = useState<ComplaintTicket | null>(null);

  // Interactive UI States for Landing Page
  const [selectedZone, setSelectedZone] = useState<SargodhaZone>(SARGODHA_ZONES[0]);
  const [zoneSearch, setZoneSearch] = useState('');
  const [activeDiagIndex, setActiveDiagIndex] = useState<number>(0);
  const [copiedContact, setCopiedContact] = useState<'phone' | 'email' | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleCopyText = (text: string, type: 'phone' | 'email') => {
    navigator.clipboard.writeText(text);
    setCopiedContact(type);
    setTimeout(() => setCopiedContact(null), 2200);
  };

  const filteredZones = SARGODHA_ZONES.filter(
    (z) =>
      z.name.toLowerCase().includes(zoneSearch.toLowerCase()) ||
      z.blocks.toLowerCase().includes(zoneSearch.toLowerCase())
  );

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
        `No complaint found with ticket reference: "${clean}". Please verify your ticket number.`
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
            district: 'Sargodha',
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
              cnic: regCnic.trim() || '38403-0000000-0',
              district: 'Sargodha',
              areaAddress: regAddress.trim() || 'Satellite Town, Sargodha',
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

  // Handle Staff & Admin Login (Strictly Private)
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

    if (!matchedUser && emailClean === 'admin@citrus.net.pk' && pwdClean === 'admin123') {
      matchedUser = {
        id: 'usr-admin',
        name: 'Administrator (Citrus Operations Head)',
        email: 'admin@citrus.net.pk',
        phone: '03390480022',
        cnic: '38403-1122334-0',
        role: 'admin',
        password: 'admin123',
        district: 'Sargodha',
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
        district: 'Sargodha',
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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-slate-100 flex flex-col justify-between">
        {/* Top bar */}
        <div className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => {
              setPendingGoogleUser(null);
              setRegError(null);
              setPageView('intro');
            }}
            className="flex items-center gap-2 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to Citrus Sargodha Homepage</span>
          </button>

          <div className="flex items-center gap-3">
            <a
              href="tel:03390480022"
              className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-700/50 px-3 py-1 rounded-full"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>24/7 Helpline: 03390480022</span>
            </a>
            <div className="flex items-center gap-2">
              <CloudCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-extrabold text-emerald-400">
                Private Gmail Cloud Portal
              </span>
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="max-w-xl w-full mx-auto px-4 py-8">
          <div className="bg-slate-950/90 border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center font-black text-2xl text-slate-950 shadow-lg ring-2 ring-amber-400/50">
                C
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-400 mb-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>District Sargodha, Pakistan Only</span>
                </div>
                <h2 className="text-xl font-black text-white">Customer Gmail Sign-In & Registration</h2>
                <p className="text-xs text-slate-400">
                  Private account authentication — view only your own complaint status securely in the cloud
                </p>
              </div>
            </div>

            {/* Auth Mode Tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-900 rounded-2xl mb-6 border border-slate-800">
              <button
                onClick={() => {
                  setRegError(null);
                  setCustomerAuthTab('google_signin');
                }}
                className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  customerAuthTab === 'google_signin'
                    ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-lg'
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
                className={`py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  customerAuthTab === 'register_gmail'
                    ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-slate-950 shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Gmail Registration</span>
              </button>
            </div>

            {regError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            {customerAuthTab === 'google_signin' ? (
              <div className="space-y-5">
                {/* Official Google OAuth Button */}
                <div className="p-5 bg-gradient-to-b from-slate-900 to-slate-900/70 rounded-2xl border border-slate-800 text-center space-y-4">
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
                      Sign in securely with your personal Gmail account to view your private complaint status in District Sargodha.
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

                {/* Private Direct Gmail Sign-In Form */}
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
                    className="w-full py-3 rounded-xl border border-dashed border-slate-700 hover:border-amber-500 text-xs font-bold text-slate-300 hover:text-amber-300 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-amber-400" />
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
                      Google Account Verified (<strong>{pendingGoogleUser.email}</strong>). Complete your Sargodha subscriber details below.
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-500 text-white text-xs placeholder-slate-500 focus:outline-none"
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
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-500 text-white text-xs placeholder-slate-500 focus:outline-none read-only:opacity-75"
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
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-500 text-white text-xs placeholder-slate-500 focus:outline-none"
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
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-500 text-white text-xs placeholder-slate-500 focus:outline-none"
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
                      placeholder="38403-1234567-1"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-500 text-white text-xs placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Licensed District *</label>
                    <select
                      value={regDistrict}
                      onChange={(e) => setRegDistrict(e.target.value as DistrictName)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-500 text-white text-xs focus:outline-none"
                    >
                      <option value="Sargodha">District Sargodha, Pakistan Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Bandwidth Plan</label>
                    <select
                      value={regPlan}
                      onChange={(e) => setRegPlan(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-500 text-white text-xs focus:outline-none"
                    >
                      <option value="30 Mbps Fiber Plus">30 Mbps Fiber Plus</option>
                      <option value="50 Mbps Fiber Unlimited">50 Mbps Fiber Unlimited</option>
                      <option value="100 Mbps Dedicated CIR Leased Line">100 Mbps Dedicated CIR Leased Line</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Installation Address in Sargodha *</label>
                  <input
                    type="text"
                    required
                    maxLength={250}
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="e.g. Block C, Satellite Town / University Road, Sargodha"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-500 text-white text-xs placeholder-slate-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegisteringCust}
                  className="w-full py-3 px-4 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
        <div className="text-center py-4 text-xs text-slate-400 border-t border-slate-800/80">
          Citrus Pvt Ltd · Licensed PTA CVAS District Sargodha, Pakistan · 24/7 Helpline: 03390480022 · support.citrus@gmail.com
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: DEDICATED STAFF & ADMIN LOGIN PAGE (Strict Privacy)
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
            <span>Back to Citrus Sargodha Homepage</span>
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
                <p className="text-xs text-slate-400">Authorized Citrus Sargodha personnel & administrator login</p>
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
          Citrus Pvt Ltd Network Operations Center (NOC) · District Sargodha, Pakistan · Authorized Staff Access Only
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: MAIN INTRODUCTION PAGE (Citrus Pvt Ltd — Vibrant & Interactive)
  // -------------------------------------------------------------
  const currentDiag = DIAGNOSTIC_PRESETS[activeDiagIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-amber-300 selection:text-slate-950">
      {/* 1. TOP COLORFUL ANNOUNCEMENT & HELPLINE BAR */}
      <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-950 text-white px-4 py-2 border-b border-emerald-500/30">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
              <Radio className="w-3 h-3 text-slate-950 animate-pulse" />
              District Sargodha, Pakistan Only
            </span>
            <span className="text-emerald-200 font-semibold hidden sm:inline">
              Licensed PTA CVAS Optical Fiber Internet & Telecom Redressal Portal
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <a
              href="tel:03390480022"
              className="flex items-center gap-1.5 font-mono font-extrabold text-amber-300 hover:text-amber-200 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>24/7 NOC Helpline: 03390480022</span>
            </a>
            <span className="text-slate-600 hidden md:inline">|</span>
            <a
              href="mailto:support.citrus@gmail.com"
              className="hidden md:flex items-center gap-1.5 font-mono text-emerald-300 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>support.citrus@gmail.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. STICKY MAIN HEADER */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo & Company Identity */}
            <div className="flex items-center gap-3.5 shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg ring-2 ring-orange-400/50">
                C
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-950 via-slate-800 to-emerald-900 bg-clip-text text-transparent">
                    Citrus Pvt Ltd
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-semibold">
                  High-Speed FTTH Fiber Broadband · District Sargodha, Pakistan
                </p>
              </div>
            </div>

            {/* Top Right Action Zone */}
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col text-right pr-3 border-r border-slate-200">
                <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                  24/7 NOC Helpline & Support
                </span>
                <a
                  href="tel:03390480022"
                  className="font-mono font-black text-sm text-slate-900 hover:text-orange-600 transition-colors"
                >
                  03390480022
                </a>
              </div>

              <button
                onClick={() => {
                  const el = document.getElementById('coverage-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-extrabold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all cursor-pointer border border-amber-200"
              >
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <span>Sargodha Coverage</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('track-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                <Search className="w-3.5 h-3.5 text-slate-600" />
                <span>Track Ticket</span>
              </button>

              {/* PRIMARY PROMINENT TOP BUTTON: Register Complaint Login (Gmail) */}
              <button
                onClick={() => setPageView('customer_auth')}
                className="px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2 cursor-pointer ring-2 ring-emerald-400/50"
              >
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
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

      {/* 3. VIBRANT HERO SECTION WITH INTERACTIVE SUPPORT & DIAGNOSTIC CARDS */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white py-14 sm:py-20 border-b border-emerald-800/40">
        {/* Decorative Citrus & Emerald Glow Blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Hero Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 text-amber-300 text-xs font-black shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Licensed PTA CVAS District Coverage · District Sargodha, Pakistan Only</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                Ultra-Fast Optical Fiber Internet in{' '}
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent">
                  District Sargodha
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Welcome to <span className="font-extrabold text-white">Citrus Pvt Ltd</span>. Sign in with your personal{' '}
                <span className="font-bold text-amber-300">Gmail account</span> to lodge fiber complaints and track your live resolution status with 100% private cloud protection.
              </p>

              {/* Hero CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  onClick={() => setPageView('customer_auth')}
                  className="px-6 py-4 rounded-2xl font-black text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.99] transition-all shadow-xl shadow-orange-500/20 flex items-center gap-2.5 cursor-pointer"
                >
                  <Headphones className="w-4 h-4 text-slate-950" />
                  <span>Sign In / Register with Gmail</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setLodgeDistrict('Sargodha');
                    setShowQuickLodgeModal(true);
                  }}
                  className="px-5 py-4 rounded-2xl font-black text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>Express Quick Complaint</span>
                </button>
              </div>

              {/* Interactive Direct Support Bar (Helpline 03390480022 & support.citrus@gmail.com) */}
              <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-2xl">
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 transition-all flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
                        24/7 NOC Helpline & Support
                      </div>
                      <a
                        href="tel:03390480022"
                        className="font-mono font-black text-base text-white hover:text-amber-300 transition-colors"
                      >
                        03390480022
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText('03390480022', 'phone')}
                    title="Copy Helpline Number"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer border border-slate-700"
                  >
                    {copiedContact === 'phone' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-400 transition-all flex items-center justify-between gap-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                        Official Support Email
                      </div>
                      <a
                        href="mailto:support.citrus@gmail.com"
                        className="font-mono font-bold text-xs sm:text-sm text-white hover:text-emerald-300 truncate block transition-colors"
                      >
                        support.citrus@gmail.com
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText('support.citrus@gmail.com', 'email')}
                    title="Copy Support Email"
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 flex items-center gap-1 cursor-pointer border border-slate-700 shrink-0"
                  >
                    {copiedContact === 'email' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Self-Diagnostic & Instant Fault Selector */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900/90 backdrop-blur-xl border-2 border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center font-black">
                      <Router className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                        Interactive Fiber Assistant
                      </span>
                      <h3 className="text-sm font-black text-white">
                        Select Your Router Symptom
                      </h3>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black">
                    Live SLA Calculator
                  </span>
                </div>

                {/* Symptom Selector Pills */}
                <div className="grid grid-cols-2 gap-2.5">
                  {DIAGNOSTIC_PRESETS.map((item, idx) => {
                    const isSelected = activeDiagIndex === idx;
                    return (
                      <button
                        key={item.category}
                        type="button"
                        onClick={() => setActiveDiagIndex(idx)}
                        className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                          isSelected
                            ? `bg-gradient-to-r ${item.gradient} text-white border-transparent shadow-lg scale-[1.02]`
                            : 'bg-slate-950/80 hover:bg-slate-800/80 text-slate-300 border-slate-800'
                        }`}
                      >
                        <div className="text-xs font-black leading-snug">{item.title}</div>
                        <div
                          className={`text-[10px] mt-0.5 ${
                            isSelected ? 'text-white/90 font-semibold' : 'text-slate-400'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Diagnostic Output Box */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-amber-400" />
                      <span>{currentDiag.title}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold">
                      {currentDiag.slaHours}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentDiag.tip}
                  </p>
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLodgeCategory(currentDiag.category);
                        setLodgeDistrict('Sargodha');
                        setShowQuickLodgeModal(true);
                      }}
                      className="w-full py-2.5 px-4 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Report "{currentDiag.title}" Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. COVERAGE NETWORK: LICENSED PTA CVAS DISTRICT COVERAGE — DISTRICT SARGODHA, PAKISTAN ONLY */}
      <section
        id="coverage-section"
        className="py-16 bg-gradient-to-b from-white via-orange-50/30 to-emerald-50/30 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Coverage Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                <span>Coverage Network</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-slate-950 tracking-tight">
                Licensed PTA CVAS District Coverage
              </h2>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 text-white font-black text-base sm:text-lg shadow-md">
                <MapPin className="w-5 h-5 text-yellow-200 shrink-0" />
                <span>District Sargodha, Pakistan only</span>
              </div>
              <p className="text-sm text-slate-600 max-w-2xl pt-1">
                Citrus Pvt Ltd operates dedicated 10G GPON Optical Fiber rings exclusively across{' '}
                <strong className="text-slate-900">District Sargodha, Pakistan</strong>. Click any Sargodha sector below to inspect live OLT node health or register a complaint.
              </p>
            </div>

            {/* Interactive Sector Search Filter */}
            <div className="w-full lg:w-80">
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Check Your Sargodha Area / Colony:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={zoneSearch}
                  onChange={(e) => setZoneSearch(e.target.value)}
                  placeholder="e.g. Satellite Town, University Rd, Model Town..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border-2 border-slate-200 focus:border-orange-500 text-xs font-medium text-slate-900 focus:outline-none shadow-xs"
                />
                <Search className="w-4 h-4 text-orange-500 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Interactive Sargodha Zones Grid + Live Selected Node Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Clickable Sector Cards (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredZones.map((zone) => {
                const isActive = selectedZone.id === zone.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={`text-left p-5 rounded-3xl transition-all cursor-pointer border-2 relative overflow-hidden group ${
                      isActive
                        ? 'bg-white border-orange-500 shadow-xl ring-4 ring-orange-500/15 -translate-y-0.5'
                        : 'bg-white/90 hover:bg-white border-slate-200/90 hover:border-amber-300 shadow-xs'
                    }`}
                  >
                    <div
                      className={`h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r ${zone.color}`}
                    />
                    <div className="flex items-start justify-between gap-2 mb-2 pt-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${zone.badgeBg}`}
                      >
                        {zone.status}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        {zone.pingMs}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-950 group-hover:text-orange-600 transition-colors">
                      {zone.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{zone.blocks}</p>
                  </button>
                );
              })}
            </div>

            {/* Interactive Selected Sargodha Node Telemetry Card (5 cols) */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-emerald-500/30 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                    Live Sargodha Fiber Node Telemetry
                  </span>
                  <h3 className="text-lg font-black text-white mt-0.5">{selectedZone.name}</h3>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                  <Wifi className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Licensed Jurisdiction:</span>
                  <span className="font-black text-amber-300">District Sargodha, Pakistan only</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Active OLT Distribution Rack:</span>
                  <span className="font-mono font-bold text-white">{selectedZone.oltNode}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-700/50">
                    <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                      Optical Rx Power
                    </span>
                    <span className="font-mono font-black text-sm text-white mt-0.5 block">
                      {selectedZone.opticalSignal}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-700/50">
                    <span className="text-[10px] uppercase font-bold text-amber-300 block">
                      Sargodha Core Latency
                    </span>
                    <span className="font-mono font-black text-sm text-white mt-0.5 block">
                      {selectedZone.pingMs} (PIE Peering)
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <span className="text-slate-400 block mb-1">Covered Localities & Streets:</span>
                  <span className="text-slate-200 font-medium">{selectedZone.blocks}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRegAddress(selectedZone.name + ', Sargodha');
                    setCustomerAuthTab('register_gmail');
                    setPageView('customer_auth');
                  }}
                  className="flex-1 py-3 px-4 rounded-xl font-black text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Gmail in This Area</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLodgeDistrict('Sargodha');
                    setLodgeDescription(`Area: ${selectedZone.name}, District Sargodha — `);
                    setShowQuickLodgeModal(true);
                  }}
                  className="py-3 px-4 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                >
                  Lodge Area Fault
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. THREE-STEP COLORFUL PROCESS */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider">
              100% Private & Cloud Protected
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-2">
              How Sargodha Customer Complaint Tracking Works
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Every customer has a private account linked to their Gmail. You see only your own complaint status — nothing else.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-200 hover:border-emerald-400 transition-all shadow-sm relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-lg mb-4 shadow-md">
                1
              </div>
              <h4 className="text-base font-black text-slate-950 mb-2">Sign In with Your Gmail</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click the top button to sign in with Google or register your Gmail address in District Sargodha. Your account is strictly private.
              </p>
              <div className="mt-4 text-[11px] font-extrabold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Private Google Cloud Account</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-white border-2 border-amber-200 hover:border-orange-400 transition-all shadow-sm relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-slate-950 flex items-center justify-center font-black text-lg mb-4 shadow-md">
                2
              </div>
              <h4 className="text-base font-black text-slate-950 mb-2">Lodge Fault & Cloud Sync</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Submit fiber cut, red LOS light, or slow speed complaints. Every ticket is saved to Google Cloud Firestore under your Gmail.
              </p>
              <div className="mt-4 text-[11px] font-extrabold text-orange-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-orange-600" />
                <span>24/7 Helpline: 03390480022</span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50/50 to-white border-2 border-purple-200 hover:border-purple-400 transition-all shadow-sm relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-lg mb-4 shadow-md">
                3
              </div>
              <h4 className="text-base font-black text-slate-950 mb-2">Live Complaint Status</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Citrus Sargodha NOC engineers acknowledge (ACK) your complaint, dispatch field splicers, and update your complaint status live.
              </p>
              <div className="mt-4 text-[11px] font-extrabold text-purple-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span>Fast Sargodha Field Dispatch</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INSTANT TICKET TRACKING SECTION + INTERACTIVE FAQ */}
      <section id="track-section" className="py-14 bg-slate-100/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Ticket Lookup Box (7 cols) */}
          <div className="lg:col-span-7 bg-white border-2 border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg">
            <div className="mb-6">
              <span className="text-[10px] font-black text-amber-900 uppercase bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full">
                Instant Ticket Status Lookup
              </span>
              <h3 className="text-2xl font-black text-slate-950 mt-2">
                Track Your Complaint Status
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Enter your official ticket reference number to check your current complaint status
              </p>
            </div>

            <form onSubmit={handlePerformTrack} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="Enter Ticket # (e.g. PTA-SGD-2026-0041)"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-orange-500 text-sm font-mono uppercase text-slate-900 focus:outline-none"
                />
                <Search className="w-5 h-5 text-orange-500 absolute left-3.5 top-3.5" />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Check Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {trackError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{trackError}</span>
              </div>
            )}

            {trackedTicket && (
              <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-white border-2 border-emerald-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 pb-3">
                  <div>
                    <span className="font-mono font-black text-base text-slate-950">
                      {trackedTicket.ticketNumber}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      ({trackedTicket.category.replace(/_/g, ' ')})
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black ${
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

                <div className="text-xs text-slate-800 font-bold">
                  {trackedTicket.subject}
                </div>

                {trackedTicket.latestOnlineUpdate && (
                  <div className="p-3 rounded-xl bg-emerald-100/70 border border-emerald-300 text-xs">
                    <span className="text-[11px] text-emerald-900 font-black block mb-0.5">
                      Latest Status Update:
                    </span>
                    <p className="text-emerald-950 font-semibold">
                      {trackedTicket.latestOnlineUpdate}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Interactive Quick Support & FAQ Accordion (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-black text-slate-950">
                Sargodha Subscriber Support FAQ
              </h3>
            </div>

            {[
              {
                q: 'What is the Coverage Area of Citrus Pvt Ltd?',
                a: 'Citrus Pvt Ltd is licensed under PTA CVAS for District Sargodha, Pakistan only. We cover Satellite Town, University Road, Model Town, Civil Lines, Cantt, Queens Road, and surrounding Sargodha sectors.',
              },
              {
                q: 'How can I contact the 24/7 NOC Helpline & Support?',
                a: 'You can call or WhatsApp our 24/7 NOC Helpline & support number at 03390480022 or email us anytime at support.citrus@gmail.com.',
              },
              {
                q: 'Is my complaint history private when I sign in with Gmail?',
                a: 'Yes! Your Gmail account is strictly isolated. Customers can only see their own complaint status and nothing else.',
              },
            ].map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 text-xs font-black text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-orange-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. FOOTER WITH UPDATED SARGODHA COVERAGE, 03390480022 HELPLINE, AND SUPPORT.CITRUS@GMAIL.COM */}
      <footer className="bg-slate-950 text-slate-400 text-xs pt-12 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
            {/* Col 1: Brand & Sargodha Coverage */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-white font-black text-lg">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
                  C
                </div>
                <span>Citrus Pvt Ltd</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Licensed PTA CVAS District Coverage: <strong className="text-amber-300">District Sargodha, Pakistan only</strong>. Providing high-speed optical fiber FTTH internet and enterprise broadband infrastructure.
              </p>
            </div>

            {/* Col 2: Customer Support (Updated Helpline & Email, PTA Escalation Removed) */}
            <div className="space-y-2.5">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider block">
                24/7 NOC Helpline & Customer Support
              </span>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>24/7 NOC Helpline & Support:</span>
                  <a
                    href="tel:03390480022"
                    className="text-amber-300 font-mono font-black text-sm hover:underline"
                  >
                    03390480022
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Support Email:</span>
                  <a
                    href="mailto:support.citrus@gmail.com"
                    className="text-emerald-300 font-mono font-bold hover:underline"
                  >
                    support.citrus@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Coverage Network:</span>
                  <span className="text-slate-200 font-bold">District Sargodha, Pakistan only</span>
                </div>
              </div>
            </div>

            {/* Col 3: VERY BOTTOM STAFF & ADMIN PORTAL BUTTON */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>Citrus Internal Staff & NOC Gateway</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                For Citrus NOC Engineers, Linemen, and Administrators in District Sargodha. Staff credentials are created by the System Administrator.
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
            <div className="text-amber-400/90 font-bold">
              Licensed PTA CVAS District Coverage: District Sargodha, Pakistan only
            </div>
          </div>
        </div>
      </footer>

      {/* QUICK LODGE MODAL */}
      {showQuickLodgeModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border-2 border-amber-400/40">
            <button
              onClick={() => {
                setShowQuickLodgeModal(false);
                setQuickLodgeSuccessTicket(null);
              }}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase mb-2">
              <MapPin className="w-3 h-3 text-orange-600" />
              <span>District Sargodha, Pakistan Only</span>
            </div>
            <h3 className="text-xl font-black text-slate-950 mb-1">Express Complaint Registration</h3>
            <p className="text-xs text-slate-500 mb-5">
              Quickly log a fiber fault in District Sargodha · 24/7 Helpline: 03390480022
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
                  Citrus Sargodha NOC team has received your complaint. For urgent support call <strong>03390480022</strong>.
                </p>
                <button
                  onClick={() => {
                    setShowQuickLodgeModal(false);
                    setQuickLodgeSuccessTicket(null);
                  }}
                  className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Licensed District *</label>
                    <select
                      value={lodgeDistrict}
                      onChange={(e) => setLodgeDistrict(e.target.value as DistrictName)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-500 font-bold text-slate-900"
                    >
                      <option value="Sargodha">District Sargodha, Pakistan</option>
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
                    Fault Description & Sargodha Address *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={lodgeDescription}
                    onChange={(e) => setLodgeDescription(e.target.value)}
                    placeholder="Describe problem and your street/sector in District Sargodha..."
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
