import React from 'react';
import { 
  ShieldCheck, 
  PlusCircle, 
  Server, 
  FileText, 
  UserCheck, 
  LayoutDashboard, 
  Ticket, 
  LogOut, 
  User, 
  KeyRound,
  Shield,
  Radio,
  Mail
} from 'lucide-react';
import { UserRole, User as UserType } from '../types/index.js';

interface HeaderProps {
  currentTab: 'dashboard' | 'tickets' | 'customer' | 'reports' | 'users' | 'server' | 'admin';
  onSelectTab: (tab: 'dashboard' | 'tickets' | 'customer' | 'reports' | 'users' | 'server' | 'admin') => void;
  onOpenNewTicket: () => void;
  activeUser: UserType | null;
  portalMode: 'customer' | 'noc' | 'admin';
  onSwitchPortal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewTicket,
  activeUser,
  portalMode,
  onSwitchPortal,
}) => {
  const isAdmin = activeUser?.role === 'admin';

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Citrus logo + Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab(portalMode === 'customer' ? 'customer' : 'dashboard')}
              className="text-left group flex items-center gap-2.5 focus-visible:outline-none cursor-pointer"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md ring-2 ring-orange-400/40">
                C
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-950 whitespace-nowrap block">
                  Citrus Pvt Ltd
                </span>
                <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
                  {portalMode === 'customer' ? 'Customer Complaint Portal' : 'NOC & Staff Operations'}
                </span>
              </div>
            </button>

            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 pl-3 border-l border-slate-200">
              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                PTA CVAS Licensed
              </span>
              <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Port 4000
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (Customer vs Staff RBAC) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {portalMode === 'customer' ? (
              <>
                <button
                  onClick={() => onSelectTab('customer')}
                  className={`px-3.5 py-2 text-xs font-black transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl ${
                    currentTab === 'customer'
                      ? 'bg-emerald-100 text-emerald-950 shadow-xs border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>My Complaints & Live Updates</span>
                </button>

                <button
                  onClick={() => onSelectTab('tickets')}
                  className={`px-3.5 py-2 text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl ${
                    currentTab === 'tickets'
                      ? 'bg-emerald-100 text-emerald-950 shadow-xs border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Ticket className="w-4 h-4 text-emerald-600" />
                  <span>Network Status</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className={`px-3 py-2 text-xs font-black transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl ${
                    currentTab === 'dashboard'
                      ? 'bg-amber-100 text-amber-950 font-black shadow-xs border border-amber-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-600" />
                  <span>NOC Dashboard</span>
                </button>

                <button
                  onClick={() => onSelectTab('tickets')}
                  className={`px-3 py-2 text-xs font-black transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl ${
                    currentTab === 'tickets'
                      ? 'bg-amber-100 text-amber-950 font-black shadow-xs border border-amber-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Ticket className="w-4 h-4 text-amber-600" />
                  <span>Complaint Queue (ACK & Update)</span>
                </button>

                {/* ONLY visible to admin users. Normal team members cannot access */}
                {isAdmin && (
                  <button
                    onClick={() => onSelectTab('admin')}
                    className={`px-3.5 py-2 text-xs font-black transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl ${
                      currentTab === 'admin'
                        ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400'
                        : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                    }`}
                  >
                    <KeyRound className="w-4 h-4 text-purple-600" />
                    <span>Admin Console (Team Logins)</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectTab('reports')}
                  className={`px-3 py-2 text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl ${
                    currentTab === 'reports'
                      ? 'bg-emerald-100 text-emerald-950 font-black shadow-xs border border-emerald-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>PTA Reports</span>
                </button>

                <button
                  onClick={() => onSelectTab('server')}
                  className={`px-3 py-2 text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer rounded-xl ${
                    currentTab === 'server'
                      ? 'bg-sky-100 text-sky-950 font-black shadow-xs border border-sky-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Server className="w-4 h-4 text-sky-600" />
                  <span>Linux (Port 4000)</span>
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Active User & Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Active user badge */}
            {activeUser && (
              <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                {portalMode === 'customer' ? (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <div className="flex flex-col text-left">
                      <span className="font-black text-slate-900 truncate max-w-[120px] leading-tight">
                        {activeUser.name}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px] leading-tight flex items-center gap-1">
                        <Mail className="w-2.5 h-2.5 text-red-500 inline" />
                        {activeUser.email}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`w-2.5 h-2.5 rounded-full ${isAdmin ? 'bg-purple-600' : 'bg-amber-500'} shrink-0`} />
                    <div className="flex flex-col text-left">
                      <span className="font-black text-slate-900 truncate max-w-[120px] leading-tight">
                        {activeUser.name}
                      </span>
                      <span className={`text-[9px] font-extrabold uppercase px-1 py-0.2 rounded w-fit ${
                        isAdmin ? 'bg-purple-200 text-purple-900' : 'bg-amber-200 text-amber-900'
                      }`}>
                        {isAdmin ? 'System Admin' : activeUser.role}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={onOpenNewTicket}
              className="px-3.5 py-2 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all flex items-center gap-1.5 shadow-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{portalMode === 'customer' ? 'Lodge Complaint' : '+ New Ticket'}</span>
            </button>

            {/* Logout button */}
            <button
              onClick={onSwitchPortal}
              title="Log out and return to Citrus Introduction Homepage"
              className="px-3 py-2 text-xs font-extrabold text-slate-700 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer border border-slate-200"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="md:hidden flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-slate-100 text-xs">
          {portalMode === 'customer' ? (
            <>
              <button
                onClick={() => onSelectTab('customer')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold ${currentTab === 'customer' ? 'bg-emerald-600 text-white' : 'text-slate-600 bg-slate-100'}`}
              >
                My Complaints
              </button>
              <button
                onClick={() => onSelectTab('tickets')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold ${currentTab === 'tickets' ? 'bg-emerald-600 text-white' : 'text-slate-600 bg-slate-100'}`}
              >
                Network Status
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onSelectTab('dashboard')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold ${currentTab === 'dashboard' ? 'bg-amber-600 text-white' : 'text-slate-600 bg-slate-100'}`}
              >
                NOC Dashboard
              </button>
              <button
                onClick={() => onSelectTab('tickets')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold ${currentTab === 'tickets' ? 'bg-amber-600 text-white' : 'text-slate-600 bg-slate-100'}`}
              >
                Queue (ACK)
              </button>
              {isAdmin && (
                <button
                  onClick={() => onSelectTab('admin')}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold ${currentTab === 'admin' ? 'bg-purple-600 text-white' : 'text-purple-700 bg-purple-50 font-bold'}`}
                >
                  Admin (Team Logins)
                </button>
              )}
              <button
                onClick={() => onSelectTab('reports')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold ${currentTab === 'reports' ? 'bg-emerald-600 text-white' : 'text-slate-600 bg-slate-100'}`}
              >
                PTA Reports
              </button>
              <button
                onClick={() => onSelectTab('server')}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-bold ${currentTab === 'server' ? 'bg-sky-600 text-white' : 'text-slate-600 bg-slate-100'}`}
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
