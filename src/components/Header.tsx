import React from 'react';
import { 
  PlusCircle, 
  Server, 
  FileText, 
  UserCheck, 
  LayoutDashboard, 
  Ticket, 
  LogOut, 
  KeyRound,
  Mail
} from 'lucide-react';
import { User as UserType, PTALicenseeConfig } from '../types/index.js';
import { ThemeSwitcherButton, usePortalTheme } from '../context/ThemeContext.js';

interface HeaderProps {
  currentTab: 'dashboard' | 'tickets' | 'customer' | 'reports' | 'users' | 'server' | 'admin';
  onSelectTab: (tab: 'dashboard' | 'tickets' | 'customer' | 'reports' | 'users' | 'server' | 'admin') => void;
  onOpenNewTicket: () => void;
  activeUser: UserType | null;
  portalMode: 'customer' | 'noc' | 'admin';
  onSwitchPortal: () => void;
  config?: PTALicenseeConfig | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewTicket,
  activeUser,
  portalMode,
  onSwitchPortal,
  config,
}) => {
  const { theme } = usePortalTheme();
  const isAdmin = activeUser?.role === 'admin';
  const companyName = config?.licenseeName || 'Citrus Pvt Ltd';
  const companyLogoUrl = config?.companyLogoUrl || '';
  const companyLogoText = config?.companyLogoText || companyName.charAt(0).toUpperCase() || 'C';

  return (
    <header
      className={`no-print sticky top-0 z-40 shadow-xs border-b transition-colors ${
        theme.isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Custom Company Logo + Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab(portalMode === 'customer' ? 'customer' : 'dashboard')}
              className="text-left group flex items-center gap-2.5 focus-visible:outline-none cursor-pointer"
            >
              {companyLogoUrl ? (
                <img
                  src={companyLogoUrl}
                  alt={companyName}
                  className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 p-0.5 shadow-sm"
                />
              ) : (
                <div className={`w-10 h-10 rounded-xl ${theme.swatchBg} text-white flex items-center justify-center font-black text-xl shadow-md`}>
                  {companyLogoText}
                </div>
              )}
              <div>
                <span className={`text-xl font-black tracking-tight whitespace-nowrap block ${theme.isDark ? 'text-white' : 'text-slate-950'}`}>
                  {companyName}
                </span>
                <span className={`text-[10px] font-medium hidden sm:block ${theme.isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {portalMode === 'customer' ? 'Customer Complaint Portal' : (config?.companyTagline || 'NOC & Staff Operations')}
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Customer vs Staff RBAC) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {portalMode === 'customer' ? (
              <button
                onClick={() => onSelectTab('customer')}
                className="px-3.5 py-2 text-xs font-black transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl bg-emerald-600 text-white shadow-xs"
              >
                <UserCheck className="w-4 h-4" />
                <span>My Complaint Status</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className={`px-3 py-2 text-xs font-black transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl ${
                    currentTab === 'dashboard'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : theme.isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>NOC Dashboard</span>
                </button>

                <button
                  onClick={() => onSelectTab('tickets')}
                  className={`px-3 py-2 text-xs font-black transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl ${
                    currentTab === 'tickets'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : theme.isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                  <span>Complaint Queue</span>
                </button>

                {/* ONLY visible to admin users */}
                {isAdmin && (
                  <button
                    onClick={() => onSelectTab('admin')}
                    className={`px-3.5 py-2 text-xs font-black transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl ${
                      currentTab === 'admin'
                        ? 'bg-purple-600 text-white shadow-md'
                        : theme.isDark
                        ? 'text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-700/50'
                        : 'text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Admin Console</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectTab('reports')}
                  className={`px-3 py-2 text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl ${
                    currentTab === 'reports'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : theme.isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>PTA Reports</span>
                </button>

                <button
                  onClick={() => onSelectTab('server')}
                  className={`px-3 py-2 text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl ${
                    currentTab === 'server'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : theme.isDark
                      ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Server className="w-4 h-4" />
                  <span>Linux (Port 4000)</span>
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Theme Switcher Icon, Active User & Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Switcher Icon Button */}
            <ThemeSwitcherButton />

            {/* Active user badge */}
            {activeUser && (
              <div
                className={`hidden lg:flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl border ${
                  theme.isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex flex-col text-left">
                  <span className="font-black truncate max-w-[110px] leading-tight">
                    {activeUser.name}
                  </span>
                  <span className="text-[10px] opacity-75 truncate max-w-[110px] leading-tight flex items-center gap-1">
                    {portalMode === 'customer' ? (
                      <>
                        <Mail className="w-2.5 h-2.5 text-red-500 inline" />
                        {activeUser.email}
                      </>
                    ) : isAdmin ? (
                      'System Admin'
                    ) : (
                      activeUser.role
                    )}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={onOpenNewTicket}
              className={`px-3.5 py-2 text-xs font-black bg-gradient-to-r ${theme.primaryBtn} rounded-xl active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-md whitespace-nowrap shrink-0 cursor-pointer`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{portalMode === 'customer' ? 'Lodge Complaint' : '+ New Ticket'}</span>
            </button>

            {/* Logout button */}
            <button
              onClick={onSwitchPortal}
              title="Log out and return to Homepage"
              className={`px-3 py-2 text-xs font-extrabold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer border ${
                theme.isDark
                  ? 'bg-slate-800 hover:bg-rose-950/80 text-slate-200 hover:text-rose-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 border-slate-200'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div
          className={`md:hidden flex items-center gap-1.5 overflow-x-auto py-2.5 border-t text-xs ${
            theme.isDark ? 'border-slate-800' : 'border-slate-100'
          }`}
        >
          {portalMode === 'customer' ? (
            <button
              onClick={() => onSelectTab('customer')}
              className="px-3 py-1.5 rounded-xl whitespace-nowrap font-bold bg-emerald-600 text-white"
            >
              My Complaint Status
            </button>
          ) : (
            <>
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold ${currentTab === 'dashboard' ? 'bg-blue-600 text-white' : theme.isDark ? 'text-slate-300 bg-slate-800' : 'text-slate-600 bg-slate-100'}`}
              >
                NOC Dashboard
              </button>
              <button
                onClick={() => onSelectTab('tickets')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold ${currentTab === 'tickets' ? 'bg-amber-500 text-slate-950' : theme.isDark ? 'text-slate-300 bg-slate-800' : 'text-slate-600 bg-slate-100'}`}
              >
                Queue (ACK)
              </button>
              {isAdmin && (
                <button
                  onClick={() => onSelectTab('admin')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold ${currentTab === 'admin' ? 'bg-purple-600 text-white' : 'text-purple-700 bg-purple-50 font-bold'}`}
                >
                  Admin Console
                </button>
              )}
              <button
                onClick={() => onSelectTab('reports')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold ${currentTab === 'reports' ? 'bg-emerald-600 text-white' : theme.isDark ? 'text-slate-300 bg-slate-800' : 'text-slate-600 bg-slate-100'}`}
              >
                PTA Reports
              </button>
              <button
                onClick={() => onSelectTab('server')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold ${currentTab === 'server' ? 'bg-teal-600 text-white' : theme.isDark ? 'text-slate-300 bg-slate-800' : 'text-slate-600 bg-slate-100'}`}
              >
                Linux (Port 4000)
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
