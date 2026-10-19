export type UserRole = 'customer' | 'support_agent' | 'technician' | 'compliance_officer' | 'admin';

export type DistrictName = 
  | 'Faisalabad'
  | 'Rawalpindi'
  | 'Lahore'
  | 'Peshawar'
  | 'Multan'
  | 'Gujranwala'
  | 'Sialkot'
  | 'Hyderabad'
  | 'Quetta'
  | 'Islamabad'
  | 'Abbottabad';

export type ComplaintCategory =
  | 'OFC_CUT'
  | 'SPEED_DEGRADATION'
  | 'FREQUENT_DISCONNECT'
  | 'DNS_ROUTING'
  | 'CPE_ONT_FAULT'
  | 'BILLING_PAYMENT'
  | 'NEW_PROVISIONING';

export type ComplaintPriority = 'P1_CRITICAL' | 'P2_MAJOR' | 'P3_STANDARD';

export type ComplaintStatus =
  | 'REGISTERED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED_PTA';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnic: string; // Pakistani CNIC e.g. 33100-1234567-1
  role: UserRole;
  password?: string; // Login Password for staff/customer
  circuitId?: string; // ISP Connection / Circuit ID e.g. PK-FSD-0194
  district: DistrictName;
  areaAddress?: string;
  connectionType?: 'FTTH' | 'GPON' | 'Wireless P2P' | 'Copper DSL';
  bandwidthPlan?: string;
  status?: 'active' | 'suspended';
  createdAt: string;
}

export interface TicketTimelineEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  role: string;
  notes?: string;
}

export interface ComplaintTicket {
  id: string;
  ticketNumber: string; // e.g. PTA-FSD-2026-0042
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerCnic: string;
  circuitId: string;
  district: DistrictName;
  tehsilArea: string;
  connectionType: 'FTTH' | 'GPON' | 'Wireless P2P' | 'Copper DSL';
  bandwidthPlan: string;
  
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  
  subject: string;
  description: string;
  assignedTechnician?: string;
  
  // Technical diagnostics
  opticalPowerRx?: string; // e.g. -22.5 dBm
  pingLatencyMs?: number; // e.g. 18 ms
  packetLossPercent?: number; // e.g. 2%
  
  // Root Cause Analysis (Mandatory for PTA Compliance)
  rootCauseCategory?: string;
  rootCauseNotes?: string;
  correctiveAction?: string;
  
  // SLA Timings (PTA CVAS Targets: P1 = 8h, P2 = 24h, P3 = 48h)
  createdAt: string;
  slaDeadline: string;
  assignedAt?: string;
  resolvedAt?: string;
  closedAt?: string;
  isSlaBreached: boolean;
  resolutionTimeHours?: number;
  
  // Customer Feedback
  feedbackRating?: number; // 1-5 stars
  feedbackComments?: string;
  isCustomerSatisfied?: boolean;
  
  // NOC Acknowledgment & Online Updates
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  latestOnlineUpdate?: string;
  latestOnlineUpdateAt?: string;
  
  timeline: TicketTimelineEntry[];
}

export interface PTALicenseeConfig {
  licenseeName: string;
  licenseNumber: string; // e.g. CVAS-DATA/DIST-FSD/2024-819
  licenseType: string; // District CVAS (Data & Class Value Added Services)
  registeredDistrict: DistrictName;
  regionalPtaOffice: string; // PTA Zonal Office, Lahore/Rawalpindi
  complianceOfficerName: string;
  complianceOfficerEmail: string;
  complianceOfficerPhone: string;
  emergencyNocHelpline: string;
}

export interface PTAMonthlyReport {
  periodMonth: string; // e.g. "October 2026"
  district: DistrictName;
  totalReceived: number;
  totalResolved: number;
  resolvedWithinSla: number;
  resolvedBeyondSla: number;
  escalatedToPta: number;
  currentlyPending: number;
  slaCompliancePercentage: number;
  meanTimeToRepairHours: number;
  satisfactionRatePercentage: number;
  
  categoryStats: {
    category: ComplaintCategory;
    label: string;
    total: number;
    withinSla: number;
    breached: number;
    avgHours: number;
  }[];
  
  licensee: PTALicenseeConfig;
  generatedAt: string;
}

export interface SystemStats {
  osPlatform: string;
  nodeVersion: string;
  uptimeSeconds: number;
  memoryUsageMb: number;
  totalTickets: number;
  activeUsers: number;
  serverTime: string;
}
