import express, { Request, Response } from 'express';
import os from 'os';
import { storage } from './storage.js';
import { ComplaintCategory, DistrictName, PTAMonthlyReport } from '../types/index.js';

export const apiRouter = express.Router();

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  OFC_CUT: 'Optical Fiber Cable (OFC) Cut / Media Outage',
  SPEED_DEGRADATION: 'Bandwidth Throttling / Speed Degradation',
  FREQUENT_DISCONNECT: 'Frequent Disconnection / High Attenuation',
  DNS_ROUTING: 'DNS & Upstream Routing Fault',
  CPE_ONT_FAULT: 'CPE / Router / ONT Hardware Fault',
  BILLING_PAYMENT: 'Billing Discrepancy & Sales Tax Dispute',
  NEW_PROVISIONING: 'New Provisioning & Shifting Delay'
};

// Health and Linux server diagnostics
apiRouter.get('/health', (_req: Request, res: Response) => {
  const mem = process.memoryUsage();
  const uptime = process.uptime();
  const tickets = storage.getTickets();
  const users = storage.getUsers();

  res.json({
    status: 'online',
    service: 'PTA-District-CVAS-CMS',
    osPlatform: `${os.type()} ${os.release()} (${os.arch()})`,
    hostname: os.hostname(),
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(uptime),
    memoryUsageMb: Math.round(mem.rss / (1024 * 1024) * 10) / 10,
    totalTickets: tickets.length,
    activeUsers: users.length,
    serverTime: new Date().toISOString()
  });
});

// Config
apiRouter.get('/config', (_req: Request, res: Response) => {
  res.json(storage.getConfig());
});

apiRouter.put('/config', (req: Request, res: Response) => {
  const updated = storage.updateConfig(req.body);
  res.json(updated);
});

// Users
apiRouter.get('/users', (req: Request, res: Response) => {
  const role = req.query.role as string;
  let users = storage.getUsers();
  if (role) {
    users = users.filter(u => u.role === role);
  }
  res.json(users);
});

apiRouter.post('/users', (req: Request, res: Response) => {
  const { name, email, phone, cnic, role, circuitId, district, areaAddress, connectionType, bandwidthPlan, password, status } = req.body;
  
  if (!name || !email || !phone || !cnic) {
    return res.status(400).json({ error: 'Name, email, phone, and CNIC are required' });
  }

  // Check if email or CNIC already registered
  const existingUser = storage.getUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ error: 'A user with this email is already registered' });
  }

  const newUser = storage.createUser({
    name,
    email,
    phone,
    cnic,
    role: role || 'customer',
    password: password || 'citrus123',
    circuitId: circuitId || (role === 'customer' ? `PK-${(district || 'SGD').substring(0,3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}` : undefined),
    district: district || 'Sargodha',
    areaAddress,
    connectionType: connectionType || 'FTTH',
    bandwidthPlan: bandwidthPlan || '30 Mbps Standard Fiber',
    status: status || 'active'
  });

  res.status(201).json(newUser);
});

apiRouter.put('/users/:id', (req: Request, res: Response) => {
  try {
    const updated = storage.updateUser(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.delete('/users/:id', (req: Request, res: Response) => {
  try {
    storage.deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Tickets
apiRouter.get('/complaints', (req: Request, res: Response) => {
  let tickets = storage.getTickets();
  const { district, status, priority, category, search, customerId } = req.query;

  if (district) {
    tickets = tickets.filter(t => t.district.toLowerCase() === (district as string).toLowerCase());
  }
  if (status) {
    tickets = tickets.filter(t => t.status === status);
  }
  if (priority) {
    tickets = tickets.filter(t => t.priority === priority);
  }
  if (category) {
    tickets = tickets.filter(t => t.category === category);
  }
  if (customerId) {
    tickets = tickets.filter(t => t.customerId === customerId);
  }
  if (search) {
    const q = (search as string).toLowerCase();
    tickets = tickets.filter(t => 
      t.ticketNumber.toLowerCase().includes(q) ||
      t.customerName.toLowerCase().includes(q) ||
      t.circuitId.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q) ||
      t.customerPhone.includes(q)
    );
  }

  res.json(tickets);
});

apiRouter.get('/complaints/:id', (req: Request, res: Response) => {
  const ticket = storage.getTicketById(req.params.id) || storage.getTicketByNumber(req.params.id);
  if (!ticket) {
    return res.status(400).json({ error: 'Ticket not found' });
  }
  res.json(ticket);
});

apiRouter.post('/complaints', (req: Request, res: Response) => {
  const { customerId, category, priority, subject, description, opticalPowerRx, pingLatencyMs, packetLossPercent } = req.body;
  
  if (!customerId || !category || !priority || !subject || !description) {
    return res.status(400).json({ error: 'Missing required complaint fields (customerId, category, priority, subject, description)' });
  }

  try {
    const ticket = storage.createTicket({
      customerId,
      category,
      priority,
      subject,
      description,
      opticalPowerRx,
      pingLatencyMs,
      packetLossPercent
    });
    res.status(201).json(ticket);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/complaints/:id', (req: Request, res: Response) => {
  try {
    const updated = storage.updateTicketStatus(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/complaints/:id/feedback', (req: Request, res: Response) => {
  const { rating, comments, isSatisfied } = req.body;
  if (rating === undefined || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const updated = storage.addCustomerFeedback(req.params.id, rating, comments || '', isSatisfied !== false);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// NOC Acknowledgment of Complaint
apiRouter.post('/complaints/:id/ack', (req: Request, res: Response) => {
  const { performedBy, notes } = req.body;
  try {
    const updated = storage.acknowledgeTicket(
      req.params.id,
      performedBy || 'Hafiz Bilal Ahmed (NOC Supervisor)',
      notes
    );
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// NOC Online Status Update for Customer Web Tracking
apiRouter.post('/complaints/:id/online-update', (req: Request, res: Response) => {
  const { updateText, performedBy, role } = req.body;
  if (!updateText) {
    return res.status(400).json({ error: 'updateText is required' });
  }
  try {
    const updated = storage.postOnlineUpdate(
      req.params.id,
      updateText,
      performedBy || 'Citrus NOC Operations',
      role || 'NOC Support'
    );
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PTA Regulatory Reports
apiRouter.get('/reports/pta-monthly', (req: Request, res: Response) => {
  const monthQuery = (req.query.month as string) || 'October 2026';
  const districtQuery = (req.query.district as DistrictName) || storage.getConfig().registeredDistrict;
  
  const allTickets = storage.getTickets().filter(t => t.district.toLowerCase() === districtQuery.toLowerCase());
  const config = storage.getConfig();

  const totalReceived = allTickets.length;
  const resolvedTickets = allTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
  const totalResolved = resolvedTickets.length;
  const resolvedWithinSla = resolvedTickets.filter(t => !t.isSlaBreached).length;
  const resolvedBeyondSla = resolvedTickets.filter(t => t.isSlaBreached).length;
  const escalatedToPta = allTickets.filter(t => t.status === 'ESCALATED_PTA' || t.isSlaBreached).length;
  const currentlyPending = allTickets.filter(t => t.status === 'REGISTERED' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS').length;

  const slaCompliancePercentage = totalResolved > 0 
    ? Math.round((resolvedWithinSla / totalResolved) * 1000) / 10 
    : 100;

  // Calculate Mean Time to Repair (MTTR in hours)
  const totalResolutionHours = resolvedTickets.reduce((acc, t) => acc + (t.resolutionTimeHours || 0), 0);
  const meanTimeToRepairHours = totalResolved > 0 
    ? Math.round((totalResolutionHours / totalResolved) * 10) / 10 
    : 0;

  // Customer satisfaction rate
  const ratedTickets = allTickets.filter(t => t.feedbackRating !== undefined);
  const satisfiedCount = ratedTickets.filter(t => (t.feedbackRating || 0) >= 4).length;
  const satisfactionRatePercentage = ratedTickets.length > 0 
    ? Math.round((satisfiedCount / ratedTickets.length) * 100) 
    : 95;

  const categories: ComplaintCategory[] = [
    'OFC_CUT',
    'SPEED_DEGRADATION',
    'FREQUENT_DISCONNECT',
    'DNS_ROUTING',
    'CPE_ONT_FAULT',
    'BILLING_PAYMENT',
    'NEW_PROVISIONING'
  ];

  const categoryStats = categories.map(cat => {
    const catTickets = allTickets.filter(t => t.category === cat);
    const resolvedCat = catTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
    const withinSla = resolvedCat.filter(t => !t.isSlaBreached).length;
    const breached = catTickets.filter(t => t.isSlaBreached).length;
    const catHours = resolvedCat.reduce((acc, t) => acc + (t.resolutionTimeHours || 0), 0);
    const avgHours = resolvedCat.length > 0 ? Math.round((catHours / resolvedCat.length) * 10) / 10 : 0;

    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      total: catTickets.length,
      withinSla,
      breached,
      avgHours
    };
  });

  const report: PTAMonthlyReport = {
    periodMonth: monthQuery,
    district: districtQuery,
    totalReceived,
    totalResolved,
    resolvedWithinSla,
    resolvedBeyondSla,
    escalatedToPta,
    currentlyPending,
    slaCompliancePercentage,
    meanTimeToRepairHours,
    satisfactionRatePercentage,
    categoryStats,
    licensee: config,
    generatedAt: new Date().toISOString()
  };

  res.json(report);
});

// CSV Export for PTA Submission
apiRouter.get('/reports/export-csv', (_req: Request, res: Response) => {
  const tickets = storage.getTickets();
  const config = storage.getConfig();

  let csv = 'Ticket Number,District,Circuit ID,Customer Name,Phone,Category,Priority,Status,Created At,SLA Target Hours,Resolved At,MTTR Hours,SLA Breached,Root Cause,Corrective Action\n';

  tickets.forEach(t => {
    const targetHours = t.priority === 'P1_CRITICAL' ? 8 : t.priority === 'P2_MAJOR' ? 24 : 48;
    csv += `"${t.ticketNumber}","${t.district}","${t.circuitId}","${t.customerName}","${t.customerPhone}","${t.category}","${t.priority}","${t.status}","${t.createdAt}","${targetHours}","${t.resolvedAt || ''}","${t.resolutionTimeHours || ''}","${t.isSlaBreached ? 'YES' : 'NO'}","${(t.rootCauseCategory || '').replace(/"/g, '""')}","${(t.correctiveAction || '').replace(/"/g, '""')}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=PTA_CVAS_${config.registeredDistrict}_Complaints_${new Date().toISOString().slice(0, 10)}.csv`);
  res.send(csv);
});

// Reset database
apiRouter.post('/system/reset', (_req: Request, res: Response) => {
  storage.resetToSampleData();
  res.json({ message: 'Database reset to sample state successfully' });
});
