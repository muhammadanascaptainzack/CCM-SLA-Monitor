import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Trash2, 
  Edit3, 
  Users, 
  Server, 
  CheckCircle2, 
  Phone,
  Mail,
  MapPin,
  LogIn,
  Terminal,
  Radio,
  Building,
  ArrowLeft,
  Plus,
  Wifi,
  RotateCcw
} from 'lucide-react';
import { User, UserRole, DistrictName, PTALicenseeConfig, SargodhaCoverageZone } from '../types/index.js';

const DEFAULT_ZONES_FALLBACK: SargodhaCoverageZone[] = [
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

interface AdminConsoleViewProps {
  users: User[];
  config: PTALicenseeConfig | null;
  onUpdateConfig: (newConfig: Partial<PTALicenseeConfig>) => Promise<void>;
  onCreateUser: (userData: Partial<User>) => Promise<User>;
  onUpdateUser: (id: string, updates: Partial<User>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onSwitchToUser: (user: User) => void;
  onBackToDashboard?: () => void;
}

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({
  users,
  config,
  onUpdateConfig,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchToUser,
  onBackToDashboard,
}) => {
  const [activeTab, setActiveTab] = useState<'team' | 'coverage' | 'license' | 'ports'>('team');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);

  // Form states for new/edit team member
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('0300-');
  const [formCnic, setFormCnic] = useState('38403-');
  const [formRole, setFormRole] = useState<UserRole>('support_agent');
  const [formPassword, setFormPassword] = useState('citrus123');
  const [formDistrict, setFormDistrict] = useState<DistrictName>('Sargodha');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // License & Helpline config form state
  const [helpline, setHelpline] = useState(config?.emergencyNocHelpline || '03390480022');
  const [licenseNumber, setLicenseNumber] = useState(config?.licenseNumber || 'Class/Internet/11/2026/Sargodha');
  const [supportEmail, setSupportEmail] = useState(config?.complianceOfficerEmail || 'support.citrus@gmail.com');
  const [coverageHeadline, setCoverageHeadline] = useState(config?.coverageHeadline || 'District Sargodha, Pakistan only');
  const [coverageZones, setCoverageZones] = useState<SargodhaCoverageZone[]>(
    config?.coverageZones && config.coverageZones.length > 0 ? config.coverageZones : DEFAULT_ZONES_FALLBACK
  );
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Coverage Zone Modal state
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<SargodhaCoverageZone | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneBlocks, setZoneBlocks] = useState('');
  const [zoneOltNode, setZoneOltNode] = useState('SGD-OLT-07 (Sargodha GPON)');
  const [zoneStatus, setZoneStatus] = useState<'Active GPON Fiber' | 'High-Speed FTTH'>('Active GPON Fiber');
  const [zoneSignal, setZoneSignal] = useState('-18.5 dBm (Optimal)');
  const [zonePing, setZonePing] = useState('4 ms');

  // Sync local state whenever config prop updates
  useEffect(() => {
    if (config) {
      setHelpline(config.emergencyNocHelpline || '03390480022');
      setLicenseNumber(config.licenseNumber || 'Class/Internet/11/2026/Sargodha');
      setSupportEmail(config.complianceOfficerEmail || 'support.citrus@gmail.com');
      setCoverageHeadline(config.coverageHeadline || 'District Sargodha, Pakistan only');
      if (config.coverageZones && config.coverageZones.length > 0) {
        setCoverageZones(config.coverageZones);
      }
    }
  }, [config]);

  const staffMembers = users.filter((u) => u.role !== 'customer');
  const customerCount = users.filter((u) => u.role === 'customer').length;

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPassword = (pwd: string, id: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyCommandText = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('0300-');
    setFormCnic('38403-');
    setFormRole('support_agent');
    setFormPassword('citrus123');
    setFormDistrict('Sargodha');
    setShowAddModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormPhone(user.phone);
    setFormCnic(user.cnic);
    setFormRole(user.role);
    setFormPassword(user.password || 'citrus123');
    setFormDistrict(user.district);
    setShowAddModal(true);
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await onUpdateUser(editingUser.id, {
          name: formName,
          email: formEmail,
          phone: formPhone,
          cnic: formCnic,
          role: formRole,
          password: formPassword,
          district: formDistrict,
        });
      } else {
        await onCreateUser({
          name: formName,
          email: formEmail,
          phone: formPhone,
          cnic: formCnic,
          role: formRole,
          password: formPassword,
          district: formDistrict,
          status: 'active',
        });
      }
      setShowAddModal(false);
      setIsSubmitting(false);
    } catch (err: any) {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (user: User) => {
    try {
      await onDeleteUser(user.id);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const cleanHelpline = helpline.trim() || '03390480022';
      const cleanLicense = licenseNumber.trim() || 'Class/Internet/11/2026/Sargodha';
      const cleanEmail = supportEmail.trim() || 'support.citrus@gmail.com';
      const cleanHeadline = coverageHeadline.trim() || 'District Sargodha, Pakistan only';

      await onUpdateConfig({
        emergencyNocHelpline: cleanHelpline,
        complianceOfficerPhone: cleanHelpline,
        licenseNumber: cleanLicense,
        complianceOfficerEmail: cleanEmail,
        coverageHeadline: cleanHeadline,
        coverageZones,
      });
      setIsSavingConfig(false);
      setConfigSavedToast(true);
      setTimeout(() => setConfigSavedToast(false), 3500);
    } catch (err) {
      setIsSavingConfig(false);
    }
  };

  // Coverage Zone Handlers
  const openAddZoneModal = () => {
    setEditingZone(null);
    setZoneName('');
    setZoneBlocks('');
    setZoneOltNode(`SGD-OLT-0${coverageZones.length + 1} (Sargodha GPON)`);
    setZoneStatus('Active GPON Fiber');
    setZoneSignal('-18.5 dBm (Optimal)');
    setZonePing('4 ms');
    setShowZoneModal(true);
  };

  const openEditZoneModal = (zone: SargodhaCoverageZone) => {
    setEditingZone(zone);
    setZoneName(zone.name);
    setZoneBlocks(zone.blocks);
    setZoneOltNode(zone.oltNode);
    setZoneStatus(zone.status);
    setZoneSignal(zone.opticalSignal);
    setZonePing(zone.pingMs);
    setShowZoneModal(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const colorPairs = [
      { color: 'from-emerald-500 to-teal-600', badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
      { color: 'from-orange-500 to-amber-500', badgeBg: 'bg-orange-100 text-orange-900 border-orange-300' },
      { color: 'from-sky-500 to-indigo-600', badgeBg: 'bg-sky-100 text-sky-900 border-sky-300' },
      { color: 'from-purple-600 to-fuchsia-600', badgeBg: 'bg-purple-100 text-purple-900 border-purple-300' },
      { color: 'from-rose-500 to-orange-500', badgeBg: 'bg-rose-100 text-rose-900 border-rose-300' },
      { color: 'from-teal-500 to-cyan-600', badgeBg: 'bg-teal-100 text-teal-900 border-teal-300' },
    ];
    const theme = colorPairs[coverageZones.length % colorPairs.length];

    let updatedZones: SargodhaCoverageZone[];
    if (editingZone) {
      updatedZones = coverageZones.map((z) =>
        z.id === editingZone.id
          ? {
              ...z,
              name: zoneName.trim(),
              blocks: zoneBlocks.trim(),
              oltNode: zoneOltNode.trim(),
              status: zoneStatus,
              opticalSignal: zoneSignal.trim(),
              pingMs: zonePing.trim(),
            }
          : z
      );
    } else {
      const newZone: SargodhaCoverageZone = {
        id: `sgd-zone-${Date.now()}`,
        name: zoneName.trim(),
        blocks: zoneBlocks.trim(),
        oltNode: zoneOltNode.trim(),
        status: zoneStatus,
        opticalSignal: zoneSignal.trim(),
        pingMs: zonePing.trim(),
        color: theme.color,
        badgeBg: theme.badgeBg,
      };
      updatedZones = [...coverageZones, newZone];
    }

    setCoverageZones(updatedZones);
    setShowZoneModal(false);
    setIsSavingConfig(true);
    try {
      await onUpdateConfig({
        coverageZones: updatedZones,
        coverageHeadline: coverageHeadline.trim() || 'District Sargodha, Pakistan only',
      });
      setIsSavingConfig(false);
      setConfigSavedToast(true);
      setTimeout(() => setConfigSavedToast(false), 3500);
    } catch {
      setIsSavingConfig(false);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    const updatedZones = coverageZones.filter((z) => z.id !== zoneId);
    setCoverageZones(updatedZones);
    try {
      await onUpdateConfig({ coverageZones: updatedZones });
      setConfigSavedToast(true);
      setTimeout(() => setConfigSavedToast(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetZones = async () => {
    setCoverageZones(DEFAULT_ZONES_FALLBACK);
    setCoverageHeadline('District Sargodha, Pakistan only');
    try {
      await onUpdateConfig({
        coverageZones: DEFAULT_ZONES_FALLBACK,
        coverageHeadline: 'District Sargodha, Pakistan only',
      });
      setConfigSavedToast(true);
      setTimeout(() => setConfigSavedToast(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleCardStyle = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'System Administrator',
          border: 'border-purple-500/50 hover:border-purple-400',
          badge: 'bg-purple-100 text-purple-900 border-purple-200',
          avatarBg: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white',
          glow: 'from-purple-500/10 to-indigo-500/5'
        };
      case 'support_agent':
        return {
          label: 'NOC Supervisor / Dispatcher',
          border: 'border-sky-500/50 hover:border-sky-400',
          badge: 'bg-sky-100 text-sky-900 border-sky-200',
          avatarBg: 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white',
          glow: 'from-sky-500/10 to-blue-500/5'
        };
      case 'technician':
        return {
          label: 'Field Lineman / Splicer',
          border: 'border-amber-500/50 hover:border-amber-400',
          badge: 'bg-amber-100 text-amber-900 border-amber-200',
          avatarBg: 'bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-black',
          glow: 'from-amber-500/10 to-orange-500/5'
        };
      case 'compliance_officer':
        return {
          label: 'PTA Regulatory Officer',
          border: 'border-emerald-500/50 hover:border-emerald-400',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-200',
          avatarBg: 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white',
          glow: 'from-emerald-500/10 to-teal-500/5'
        };
      default:
        return {
          label: 'Subscriber',
          border: 'border-slate-300',
          badge: 'bg-slate-100 text-slate-800',
          avatarBg: 'bg-slate-600 text-white',
          glow: 'from-slate-100 to-transparent'
        };
    }
  };

  const activeLicenseDisplay = config?.licenseNumber || licenseNumber || 'Class/Internet/11/2026/Sargodha';
  const activeHelplineDisplay = config?.emergencyNocHelpline || helpline || '03390480022';
  const activeCoverageHeadlineDisplay = config?.coverageHeadline || coverageHeadline || 'District Sargodha, Pakistan only';

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HERO BANNER - VIBRANT CITRUS, PURPLE & AMBER GRADIENT */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border-2 border-purple-500/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-full text-xs font-black border border-purple-400/50 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-purple-300" />
                <span>Citrus Administrator Command Console</span>
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-400/40">
                License: {activeLicenseDisplay}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/40">
                24/7 Helpline: {activeHelplineDisplay}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Team Logins, Sargodha Coverage & PTA License Settings
            </h1>
            <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
              Manage NOC staff logins, edit Sargodha optical fiber coverage sectors, and update your official PTA License Number and 24/7 NOC Helpline.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0 self-start md:self-auto">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="w-full sm:w-auto px-4 py-3 text-xs font-extrabold text-purple-200 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>NOC Dashboard</span>
              </button>
            )}

            <button
              onClick={openAddModal}
              className="w-full sm:w-auto px-5 py-3 text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-400 rounded-xl transition-all shadow-xl hover:shadow-orange-500/30 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer active:scale-95"
            >
              <UserPlus className="w-5 h-5" />
              <span>+ Create New Team Member</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-purple-800/60">
          <div className="bg-purple-950/60 backdrop-blur-sm p-4 rounded-2xl border border-purple-700/50">
            <div className="text-xs font-bold text-purple-300">Active Staff Logins</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">{staffMembers.length}</div>
            <div className="text-[11px] text-purple-300">{customerCount} Registered Subscribers</div>
          </div>

          <div
            onClick={() => setActiveTab('coverage')}
            className="bg-purple-950/60 hover:bg-purple-900/70 backdrop-blur-sm p-4 rounded-2xl border border-emerald-500/40 cursor-pointer transition-colors"
          >
            <div className="text-xs font-bold text-emerald-300 flex items-center justify-between">
              <span>Sargodha Coverage</span>
              <span className="text-[10px] underline">Edit Sectors</span>
            </div>
            <div className="text-base font-black text-white mt-1 truncate">
              {activeCoverageHeadlineDisplay}
            </div>
            <div className="text-[11px] text-emerald-200">{coverageZones.length} Active Fiber OLT Sectors</div>
          </div>

          <div
            onClick={() => setActiveTab('license')}
            className="bg-purple-950/60 hover:bg-purple-900/70 backdrop-blur-sm p-4 rounded-2xl border border-sky-500/40 cursor-pointer transition-colors"
          >
            <div className="text-xs font-bold text-sky-300 flex items-center justify-between">
              <span>24/7 NOC Helpline</span>
              <span className="text-[10px] underline">Edit</span>
            </div>
            <div className="text-xl font-black text-white mt-1 font-mono">{activeHelplineDisplay}</div>
            <div className="text-[11px] text-sky-200">{config?.complianceOfficerEmail || supportEmail}</div>
          </div>

          <div
            onClick={() => setActiveTab('license')}
            className="bg-purple-950/60 hover:bg-purple-900/70 backdrop-blur-sm p-4 rounded-2xl border border-amber-500/40 cursor-pointer transition-colors"
          >
            <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
              <span>Official PTA License</span>
              <span className="text-[10px] underline">Edit</span>
            </div>
            <div className="text-sm sm:text-base font-black text-amber-300 mt-1 break-all font-mono">
              {activeLicenseDisplay}
            </div>
            <div className="text-[11px] text-amber-200">District CVAS Standard</div>
          </div>
        </div>
      </div>

      {/* 2. TAB SWITCHER (TEAM LOGINS / SARGODHA COVERAGE / PTA LICENSE & HELPLINE / PORT 4000) */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-extrabold max-w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'team'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Members & Passwords ({staffMembers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('coverage')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'coverage'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Sargodha Coverage Network ({coverageZones.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('license')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'license'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>PTA License & 24/7 Helpline</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ports')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'ports'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Port 4000 & Linux Host</span>
        </button>
      </div>

      {configSavedToast && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-900 text-xs font-extrabold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              Settings saved and applied across the website! Official License: <strong className="font-mono">{activeLicenseDisplay}</strong> · 24/7 Helpline: <strong className="font-mono">{activeHelplineDisplay}</strong>
            </span>
          </div>
        </div>
      )}

      {/* 3. TAB 1: TEAM MEMBERS CARDS GRID */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>All Team Member Credentials & Role Directory</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Passwords are shown below. Click <strong className="text-slate-700">"Login As"</strong> to test or sign in directly, or click <strong className="text-slate-700">"Edit"</strong> to change password.
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="px-4 py-2 text-xs font-extrabold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Team Member</span>
            </button>
          </div>

          {/* Grid of Colorful Team Member Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Friendly Card to Add New Member */}
            <div 
              onClick={openAddModal}
              className="border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-3xl p-6 bg-purple-50/40 hover:bg-purple-50/80 transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer min-h-[220px] group"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all flex items-center justify-center shadow-sm">
                <UserPlus className="w-7 h-7" />
              </div>
              <div>
                <div className="font-black text-sm text-purple-950">Add Another Team Member</div>
                <p className="text-xs text-purple-800/80 mt-1 max-w-[200px]">
                  Create login credentials for new NOC dispatchers or fiber linemen.
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-purple-200/60 text-purple-900 font-bold text-xs mt-1">
                + Create Login
              </span>
            </div>

            {/* List of Existing Staff Members */}
            {staffMembers.map((staff) => {
              const style = getRoleCardStyle(staff.role);
              const isPasswordVisible = visiblePasswords[staff.id];
              const pwd = staff.password || 'citrus123';

              return (
                <div
                  key={staff.id}
                  className={`bg-white border-2 ${style.border} rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden bg-gradient-to-br ${style.glow}`}
                >
                  <div className="space-y-3">
                    {/* Top Avatar & Role */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl ${style.avatarBg} flex items-center justify-center font-black text-lg shadow-sm shrink-0`}>
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 text-sm">{staff.name}</div>
                          <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-black border uppercase tracking-wider mt-1 ${style.badge}`}>
                            {style.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(staff)}
                          title="Edit user and password"
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {staff.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staff)}
                            title="Delete team member"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Email / Username */}
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Login Username / Email:</div>
                      <div className="font-mono text-xs font-bold text-slate-900 truncate">
                        {staff.email}
                      </div>
                    </div>

                    {/* Password Box with plain view and 1-click copy */}
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-amber-900">
                        <span>Login Password:</span>
                        <span className="text-[10px] font-mono lowercase text-amber-700">active</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-black text-slate-950 text-xs tracking-wider">
                          {isPasswordVisible ? pwd : '••••••••'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(staff.id)}
                            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-amber-100 cursor-pointer"
                            title={isPasswordVisible ? 'Hide password' : 'Show password'}
                          >
                            {isPasswordVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyPassword(pwd, staff.id)}
                            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-amber-100 cursor-pointer"
                            title="Copy password"
                          >
                            {copiedId === staff.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Mobile & District */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium">
                      <span>📱 {staff.phone}</span>
                      <span>📍 District {staff.district}</span>
                    </div>
                  </div>

                  {/* 1-Click Login Button */}
                  <button
                    type="button"
                    onClick={() => onSwitchToUser(staff)}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-purple-900 text-white font-extrabold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5 text-amber-400" />
                    <span>Launch & Log In As This Staff &rarr;</span>
                  </button>
                </div>
              );
            })}

          </div>
        </div>
      )}

      {/* 4. TAB 2: SARGODHA COVERAGE NETWORK EDITOR */}
      {activeTab === 'coverage' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Sargodha Coverage Network & OLT Sectors Manager
                </h2>
                <p className="text-xs text-slate-500">
                  Add, edit, or remove Sargodha fiber coverage sectors displayed on the public portal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetZones}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
              <button
                type="button"
                onClick={openAddZoneModal}
                className="px-4 py-2.5 text-xs font-black text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Sargodha Sector</span>
              </button>
            </div>
          </div>

          {/* Coverage Headline Form */}
          <form onSubmit={handleSaveConfig} className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-end gap-3 text-xs">
            <div className="flex-1">
              <label className="block text-slate-800 font-black mb-1">
                Licensed Coverage Jurisdiction Headline (Displayed on Portal Banner & Coverage Section)
              </label>
              <input
                type="text"
                value={coverageHeadline}
                onChange={(e) => setCoverageHeadline(e.target.value)}
                placeholder="District Sargodha, Pakistan only"
                className="w-full px-3.5 py-2.5 bg-white border border-amber-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingConfig}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-sm cursor-pointer whitespace-nowrap"
            >
              {isSavingConfig ? 'Saving...' : 'Save Coverage Headline'}
            </button>
          </form>

          {/* Editable Sectors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coverageZones.map((zone) => (
              <div
                key={zone.id}
                className="p-5 rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-white shadow-xs space-y-3 relative overflow-hidden transition-all"
              >
                <div className={`h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r ${zone.color}`} />
                <div className="flex items-start justify-between gap-2 pt-1">
                  <div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border ${zone.badgeBg}`}>
                      {zone.status}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-1.5">{zone.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditZoneModal(zone)}
                      className="px-2.5 py-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    {coverageZones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteZone(zone.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Remove Sector"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600">{zone.blocks}</p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-slate-400 block text-[10px]">OLT Node</span>
                    <span className="font-mono font-bold text-slate-800 truncate block">{zone.oltNode}</span>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg">
                    <span className="text-emerald-700 block text-[10px]">Optical Rx</span>
                    <span className="font-mono font-bold text-emerald-950 truncate block">{zone.opticalSignal}</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded-lg">
                    <span className="text-amber-800 block text-[10px]">Ping Latency</span>
                    <span className="font-mono font-bold text-amber-950 truncate block">{zone.pingMs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 3: PTA LICENSE & 24/7 HELPLINE SETTINGS */}
      {activeTab === 'license' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                PTA District CVAS License & 24/7 Helpline Settings
              </h2>
              <p className="text-xs text-slate-500">
                Updates immediately reflect on the Admin Status Bar, NOC Dashboard, Customer Portal, and PTA Compliance Reports
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs max-w-xl">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Company / Licensee Name</label>
              <input
                type="text"
                readOnly
                value="Citrus Pvt Ltd"
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 font-bold cursor-default"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Official License Number *
              </label>
              <input
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Class/Internet/11/2026/Sargodha"
                className="w-full px-3.5 py-2.5 bg-white border-2 border-purple-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Official format: <code className="font-mono font-bold text-purple-800">Class/Internet/11/2026/Sargodha</code>
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                24/7 NOC Helpline & Support Number *
              </label>
              <input
                type="text"
                required
                value={helpline}
                onChange={(e) => setHelpline(e.target.value)}
                placeholder="03390480022"
                className="w-full px-3.5 py-2.5 bg-white border-2 border-emerald-200 rounded-xl text-slate-900 font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Updates all clickable <code className="font-mono">tel:</code> links and helpline banners across the entire portal.
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Official Support Email *
              </label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support.citrus@gmail.com"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-medium focus:ring-1 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Licensed Coverage Area Title *
              </label>
              <input
                type="text"
                required
                value={coverageHeadline}
                onChange={(e) => setCoverageHeadline(e.target.value)}
                placeholder="District Sargodha, Pakistan only"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-bold focus:ring-1 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              {configSavedToast ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Settings updated on Admin Panel & Portal!</span>
                </span>
              ) : <div />}

              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-md cursor-pointer"
              >
                {isSavingConfig ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 6. TAB 4: PORT 4000 & LINUX HOST CONFIGURATION */}
      {activeTab === 'ports' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Linux Web Server Port 4000 Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Direct host access, daemon commands, and systemd service settings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-2">
              <div className="flex items-center justify-between font-black text-emerald-950">
                <span>Requested Port 4000:</span>
                <span className="font-mono text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-xs">
                  ONLINE & ACTIVE
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                The Express full-stack server is listening on port 4000 at <code className="font-mono font-bold">http://localhost:4000</code>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between font-bold text-slate-900">
                <span>Preview Port 3000:</span>
                <span className="font-mono text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs">
                  DUAL-BOUND
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Both ports 4000 and 3000 are gracefully listened to without conflict, allowing local Linux usage on 4000 and cloud preview on 3000.
              </p>
            </div>
          </div>

          {/* Copyable Linux Terminal Commands */}
          <div className="space-y-3">
            <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Terminal Quickstart for Linux on Port 4000:
            </div>

            <div className="bg-slate-950 text-slate-100 p-4 rounded-2xl font-mono text-xs space-y-2 relative border border-slate-800">
              <button
                type="button"
                onClick={() => copyCommandText('PORT=4000 npm start')}
                className="absolute top-3 right-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-sans font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedCommand ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCommand ? 'Copied!' : 'Copy Command'}</span>
              </button>

              <div className="text-slate-500"># 1. Run Citrus Complaint Management Server on Port 4000:</div>
              <div className="text-amber-400 font-bold">PORT=4000 npm start</div>
              <div className="text-slate-500 pt-2"># 2. Check server health via curl:</div>
              <div className="text-emerald-400">curl http://localhost:4000/api/health</div>
            </div>
          </div>

          {/* Systemd Service Unit File */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2 text-xs">
            <div className="font-black text-purple-950 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-purple-600" />
              <span>Linux Systemd Service Template (/etc/systemd/system/citrus-cms.service)</span>
            </div>
            <pre className="bg-white p-3 rounded-xl border border-purple-200 text-slate-800 font-mono text-[11px] overflow-x-auto">
{`[Unit]
Description=Citrus Pvt Ltd PTA District CVAS Complaint Web Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/citrus-cms
Environment=NODE_ENV=production
Environment=PORT=4000
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target`}
            </pre>
          </div>
        </div>
      )}

      {/* 7. ADD / EDIT SARGODHA COVERAGE SECTOR MODAL */}
      {showZoneModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingZone ? 'Edit Sargodha Coverage Sector' : 'Add Sargodha Coverage Sector'}
                  </h3>
                  <p className="text-slate-500 text-[11px]">Configure OLT node and covered streets/blocks in District Sargodha</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowZoneModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveZone} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Sector / Area Name in Sargodha *</label>
                <input
                  type="text"
                  required
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g. Satellite Town (Blocks A, B, C, D)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Covered Blocks, Streets & Localities *</label>
                <input
                  type="text"
                  required
                  value={zoneBlocks}
                  onChange={(e) => setZoneBlocks(e.target.value)}
                  placeholder="e.g. Main Commercial Market, Block A-Z Residential Sectors"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">OLT Distribution Node *</label>
                  <input
                    type="text"
                    required
                    value={zoneOltNode}
                    onChange={(e) => setZoneOltNode(e.target.value)}
                    placeholder="SGD-OLT-01 (Huawei MA5800)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Service Technology *</label>
                  <select
                    value={zoneStatus}
                    onChange={(e) => setZoneStatus(e.target.value as 'Active GPON Fiber' | 'High-Speed FTTH')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Active GPON Fiber">Active GPON Fiber</option>
                    <option value="High-Speed FTTH">High-Speed FTTH</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Optical Rx Power *</label>
                  <input
                    type="text"
                    required
                    value={zoneSignal}
                    onChange={(e) => setZoneSignal(e.target.value)}
                    placeholder="-18.4 dBm (Optimal)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Core Ping Latency *</label>
                  <input
                    type="text"
                    required
                    value={zonePing}
                    onChange={(e) => setZonePing(e.target.value)}
                    placeholder="4 ms"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowZoneModal(false)}
                  className="px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-400 font-black rounded-xl shadow-md cursor-pointer"
                >
                  {editingZone ? 'Save Sector Changes' : 'Add Coverage Sector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. ADD / EDIT TEAM MEMBER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-7 space-y-4 text-xs animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {editingUser ? 'Edit Team Member & Password' : 'Create New Team Member Login'}
                  </h3>
                  <p className="text-slate-500 text-[11px]">Configure login credentials for NOC or Lineman access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitStaff} className="space-y-3.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Salman Tariq or Imran Ahmed"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Email / Login Username *</label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="salman@citrus.net.pk"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Login Password *</label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full px-3.5 py-2.5 bg-amber-50/80 border border-amber-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:bg-white focus:ring-1 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">System Role *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:bg-white focus:ring-1 focus:ring-purple-600"
                  >
                    <option value="support_agent">NOC Supervisor / Dispatcher</option>
                    <option value="technician">Field Lineman / Splicer</option>
                    <option value="compliance_officer">PTA Compliance Officer</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assigned District *</label>
                  <select
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value as DistrictName)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-purple-600"
                  >
                    <option value="Sargodha">District Sargodha, Pakistan Only</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:bg-white focus:ring-1 focus:ring-purple-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">CNIC (13 digits) *</label>
                  <input
                    type="text"
                    required
                    value={formCnic}
                    onChange={(e) => setFormCnic(e.target.value)}
                    placeholder="38403-1234567-1"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:bg-white focus:ring-1 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-slate-950 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-400 font-black rounded-xl shadow-md cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : editingUser ? 'Update Credentials' : 'Create Team Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
