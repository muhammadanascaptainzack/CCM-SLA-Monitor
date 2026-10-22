import React, { useState } from 'react';
import { User as UserIcon, Plus, Search, ShieldCheck, Wifi, MapPin, Phone, CreditCard } from 'lucide-react';
import { User, UserRole, DistrictName } from '../types/index.js';

interface UserAccountsViewProps {
  users: User[];
  onCreateUser: (userData: Partial<User>) => Promise<User>;
}

export const UserAccountsView: React.FC<UserAccountsViewProps> = ({ users, onCreateUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('0300-');
  const [cnic, setCnic] = useState('38403-');
  const [role, setRole] = useState<UserRole>('customer');
  const [circuitId, setCircuitId] = useState('');
  const [district, setDistrict] = useState<DistrictName>('Sargodha');
  const [areaAddress, setAreaAddress] = useState('');
  const [bandwidthPlan, setBandwidthPlan] = useState('50 Mbps Fiber Unlimited');
  const [connectionType, setConnectionType] = useState<'FTTH' | 'GPON' | 'Wireless P2P' | 'Copper DSL'>('FTTH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q) ||
        u.cnic.includes(q) ||
        (u.circuitId && u.circuitId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateUser({
        name,
        email,
        phone,
        cnic,
        role,
        circuitId: circuitId || undefined,
        district,
        areaAddress,
        bandwidthPlan,
        connectionType,
      });
      setShowAddModal(false);
      setName('');
      setEmail('');
      setCircuitId('');
      setAreaAddress('');
      setIsSubmitting(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create user');
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'compliance_officer':
        return <span className="font-semibold text-emerald-800">Compliance Officer</span>;
      case 'support_agent':
        return <span className="font-medium text-blue-700">NOC Support</span>;
      case 'technician':
        return <span className="font-medium text-amber-700">Field Splicer / Lineman</span>;
      case 'customer':
        return <span className="text-slate-700">ISP Subscriber</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search accounts by name, CNIC, phone, or Circuit ID..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white text-slate-900 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="customer">Subscribers</option>
            <option value="support_agent">NOC Agents</option>
            <option value="technician">Field Technicians</option>
            <option value="compliance_officer">Compliance Officers</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">User Name / Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">CNIC / Phone</th>
                <th className="py-3 px-4">Circuit ID & District</th>
                <th className="py-3 px-4">Subscribed Plan</th>
                <th className="py-3 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No users match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{user.name}</div>
                      <div className="text-slate-500 text-[11px]">{user.email}</div>
                    </td>
                    <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-slate-800">{user.cnic}</div>
                      <div className="text-slate-500">{user.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      {user.circuitId ? (
                        <div className="font-mono font-bold text-emerald-800 text-[11px]">
                          {user.circuitId}
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A (Staff)</span>
                      )}
                      <div className="text-slate-500 text-[11px]">
                        District {user.district}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {user.bandwidthPlan ? (
                        <div className="text-slate-800 font-medium">{user.bandwidthPlan}</div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                      {user.connectionType && (
                        <div className="text-slate-400 text-[11px]">{user.connectionType}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add User / Customer Record</h3>
                <p className="text-slate-500">PTA District CVAS Registry</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Asad Ullah"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@domain.com"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">CNIC / NTN *</label>
                  <input
                    type="text"
                    required
                    value={cnic}
                    onChange={(e) => setCnic(e.target.value)}
                    placeholder="33100-1234567-1"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">System Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                  >
                    <option value="customer">Customer / Subscriber</option>
                    <option value="support_agent">NOC Support Agent</option>
                    <option value="technician">Field Lineman / Splicer</option>
                    <option value="compliance_officer">Compliance Officer</option>
                  </select>
                </div>
              </div>

              {role === 'customer' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Circuit ID (Auto if blank)</label>
                      <input
                        type="text"
                        value={circuitId}
                        onChange={(e) => setCircuitId(e.target.value)}
                        placeholder="PK-SGD-XXXX"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Licensed District *</label>
                      <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value as DistrictName)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                      >
                        <option value="Sargodha">District Sargodha, Pakistan Only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Address / Sector in Sargodha</label>
                    <input
                      type="text"
                      value={areaAddress}
                      onChange={(e) => setAreaAddress(e.target.value)}
                      placeholder="e.g. Block C, Satellite Town, Sargodha"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white text-slate-900"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg font-semibold"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
