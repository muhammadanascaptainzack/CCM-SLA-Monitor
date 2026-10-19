import { ComplaintTicket, User, PTALicenseeConfig, PTAMonthlyReport, SystemStats, ComplaintCategory, ComplaintPriority, DistrictName } from '../types/index.js';

const API_BASE = '/api';

export async function fetchHealth(): Promise<SystemStats> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to fetch system health');
  return res.json();
}

export async function fetchConfig(): Promise<PTALicenseeConfig> {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error('Failed to fetch licensee configuration');
  return res.json();
}

export async function updateConfig(config: Partial<PTALicenseeConfig>): Promise<PTALicenseeConfig> {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to update config');
  return res.json();
}

export async function fetchUsers(role?: string): Promise<User[]> {
  const url = role ? `${API_BASE}/users?role=${role}` : `${API_BASE}/users`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function createUser(data: Partial<User>): Promise<User> {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create user');
  }
  return res.json();
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update user');
  }
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete user');
  }
}

export async function fetchComplaints(filters?: {
  district?: string;
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  customerId?: string;
}): Promise<ComplaintTicket[]> {
  const params = new URLSearchParams();
  if (filters?.district) params.append('district', filters.district);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.customerId) params.append('customerId', filters.customerId);

  const res = await fetch(`${API_BASE}/complaints?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch complaints');
  return res.json();
}

export async function fetchComplaintById(id: string): Promise<ComplaintTicket> {
  const res = await fetch(`${API_BASE}/complaints/${id}`);
  if (!res.ok) throw new Error('Failed to fetch complaint details');
  return res.json();
}

export async function createComplaint(data: {
  customerId: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  subject: string;
  description: string;
  opticalPowerRx?: string;
  pingLatencyMs?: number;
  packetLossPercent?: number;
}): Promise<ComplaintTicket> {
  const res = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit complaint');
  }
  return res.json();
}

export async function updateComplaintStatus(
  id: string,
  updates: {
    status?: ComplaintTicket['status'];
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
): Promise<ComplaintTicket> {
  const res = await fetch(`${API_BASE}/complaints/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update complaint status');
  }
  return res.json();
}

export async function submitCustomerFeedback(
  id: string,
  rating: number,
  comments: string,
  isSatisfied: boolean
): Promise<ComplaintTicket> {
  const res = await fetch(`${API_BASE}/complaints/${id}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating, comments, isSatisfied })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit feedback');
  }
  return res.json();
}

export async function acknowledgeComplaint(
  id: string,
  performedBy?: string,
  notes?: string
): Promise<ComplaintTicket> {
  const res = await fetch(`${API_BASE}/complaints/${id}/ack`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ performedBy, notes })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to acknowledge complaint');
  }
  return res.json();
}

export async function postOnlineUpdate(
  id: string,
  updateText: string,
  performedBy?: string,
  role?: string
): Promise<ComplaintTicket> {
  const res = await fetch(`${API_BASE}/complaints/${id}/online-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updateText, performedBy, role })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to post online update');
  }
  return res.json();
}

export async function fetchPtaMonthlyReport(month?: string, district?: DistrictName): Promise<PTAMonthlyReport> {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (district) params.append('district', district);

  const res = await fetch(`${API_BASE}/reports/pta-monthly?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to generate PTA report');
  return res.json();
}

export async function resetDatabase(): Promise<void> {
  const res = await fetch(`${API_BASE}/system/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset database');
}
