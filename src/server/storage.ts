import fs from 'fs';
import path from 'path';
import { ComplaintTicket, User, PTALicenseeConfig, ComplaintCategory, ComplaintPriority, DistrictName } from '../types/index.js';

interface DatabaseSchema {
  config: PTALicenseeConfig;
  users: User[];
  tickets: ComplaintTicket[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'complaints-db.json');

const INITIAL_CONFIG: PTALicenseeConfig = {
  licenseeName: 'Citrus Pvt Ltd',
  licenseNumber: 'CVAS-DATA/DIST-SGD/CITRUS-2024',
  licenseType: 'District CVAS (Class Value Added Services - Data & Internet)',
  registeredDistrict: 'Sargodha',
  regionalPtaOffice: 'PTA Zonal Office, Sargodha / Lahore Region',
  complianceOfficerName: 'Engr. Tariq Mehmood',
  complianceOfficerEmail: 'support.citrus@gmail.com',
  complianceOfficerPhone: '03390480022',
  emergencyNocHelpline: '03390480022',
};

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    name: 'Administrator (Citrus Operations Head)',
    email: 'admin@citrus.net.pk',
    phone: '03390480022',
    cnic: '38403-1122334-0',
    role: 'admin',
    password: 'admin123',
    district: 'Sargodha',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr-1',
    name: 'Muhammad Usman Khan',
    email: 'usman.khan@gmail.com',
    phone: '0300-8654321',
    cnic: '38403-2451893-7',
    role: 'customer',
    password: 'pass123',
    circuitId: 'PK-SGD-0194',
    district: 'Sargodha',
    areaAddress: 'House 42, Block C, Satellite Town, Sargodha',
    connectionType: 'FTTH',
    bandwidthPlan: '50 Mbps Fiber Unlimited',
    status: 'active',
    createdAt: '2026-08-10T09:00:00.000Z'
  },
  {
    id: 'usr-2',
    name: 'Sargodha Citrus Processing & Exports Ltd',
    email: 'it@sargodhacitrus.com.pk',
    phone: '0321-7891234',
    cnic: '38403-9876543-1',
    role: 'customer',
    password: 'pass123',
    circuitId: 'PK-SGD-0820',
    district: 'Sargodha',
    areaAddress: 'University Road Commercial Hub, Sargodha',
    connectionType: 'FTTH',
    bandwidthPlan: '100 Mbps Dedicated CIR Leased Line',
    status: 'active',
    createdAt: '2026-07-01T10:30:00.000Z'
  },
  {
    id: 'usr-3',
    name: 'Farhan Ali Bhatti',
    email: 'farhan.bhatti@gmail.com',
    phone: '0333-6549870',
    cnic: '38403-5612348-9',
    role: 'customer',
    password: 'pass123',
    circuitId: 'PK-SGD-1045',
    district: 'Sargodha',
    areaAddress: 'Plot 18, Street 4, Model Town, Sargodha',
    connectionType: 'FTTH',
    bandwidthPlan: '30 Mbps Fiber Plus',
    status: 'active',
    createdAt: '2026-09-15T14:10:00.000Z'
  },
  {
    id: 'usr-4',
    name: 'Hafiz Bilal Ahmed (NOC Supervisor)',
    email: 'noc.bilal@citrus.net.pk',
    phone: '03390480022',
    cnic: '38403-4321987-5',
    role: 'support_agent',
    password: 'noc123',
    district: 'Sargodha',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z'
  },
  {
    id: 'usr-5',
    name: 'Kamran Haider (Lineman / Splicer)',
    email: 'field.kamran@citrus.net.pk',
    phone: '0301-4455667',
    cnic: '38403-7788990-3',
    role: 'technician',
    password: 'field123',
    district: 'Sargodha',
    status: 'active',
    createdAt: '2026-02-15T08:00:00.000Z'
  },
  {
    id: 'usr-6',
    name: 'Engr. Tariq Mehmood',
    email: 'support.citrus@gmail.com',
    phone: '03390480022',
    cnic: '38403-1122334-5',
    role: 'compliance_officer',
    password: 'pta123',
    district: 'Sargodha',
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z'
  }
];

const INITIAL_TICKETS: ComplaintTicket[] = [
  {
    id: 'tkt-1',
    ticketNumber: 'PTA-FSD-2026-0041',
    customerId: 'usr-2',
    customerName: 'Al-Madina Textile Mills Ltd (Commercial)',
    customerPhone: '0321-7891234',
    customerCnic: '33102-9876543-1',
    circuitId: 'PK-FSD-0820',
    district: 'Sargodha',
    tehsilArea: 'Khurrianwala Industrial Area',
    connectionType: 'FTTH',
    bandwidthPlan: '100 Mbps Dedicated CIR Leased Line',
    category: 'OFC_CUT',
    priority: 'P1_CRITICAL',
    status: 'IN_PROGRESS',
    subject: 'Complete Media Outage - Underground Fiber Cut near Jaranwala Road',
    description: 'Corporate leased line disconnected since 02:30 PM. Optical red light LOS blinking on Huawei ONT. Critical export dispatch halted.',
    assignedTechnician: 'Kamran Haider (Lineman / Splicer)',
    opticalPowerRx: '-38.2 dBm (LOS Detected)',
    pingLatencyMs: 0,
    packetLossPercent: 100,
    rootCauseCategory: 'Third-Party Excavation / WASA Drain Work',
    rootCauseNotes: 'WASA construction excavator snagged 48-core backbone optical cable near Canal Pull.',
    correctiveAction: 'Splicing crew on site with Fujikura fusion splicer. 36 cores restored; remaining 12 in progress.',
    createdAt: '2026-10-18T09:30:00.000Z',
    slaDeadline: '2026-10-18T17:30:00.000Z', // 8 hr SLA
    assignedAt: '2026-10-18T09:45:00.000Z',
    isSlaBreached: false,
    timeline: [
      {
        id: 'tl-1',
        timestamp: '2026-10-18T09:30:00.000Z',
        action: 'Complaint Registered via Customer Portal',
        performedBy: 'Al-Madina Textile Mills Ltd',
        role: 'Customer',
        notes: 'Priority P1 Critical assigned automatically based on Dedicated CIR & Complete Outage'
      },
      {
        id: 'tl-2',
        timestamp: '2026-10-18T09:45:00.000Z',
        action: 'Assigned to Field Splicing Team',
        performedBy: 'Hafiz Bilal Ahmed',
        role: 'NOC Dispatch',
        notes: 'Dispatched emergency van with OTDR and spare 48-core armored patch'
      },
      {
        id: 'tl-3',
        timestamp: '2026-10-18T11:15:00.000Z',
        action: 'Field Inspection & OTDR Trace',
        performedBy: 'Kamran Haider',
        role: 'Lineman',
        notes: 'Cut point located at 3.4km from OLT rack. Excavation pit cleared.'
      }
    ]
  },
  {
    id: 'tkt-2',
    ticketNumber: 'PTA-FSD-2026-0038',
    customerId: 'usr-1',
    customerName: 'Muhammad Usman Khan',
    customerPhone: '0300-8654321',
    customerCnic: '33100-2451893-7',
    circuitId: 'PK-FSD-0194',
    district: 'Sargodha',
    tehsilArea: 'Madina Town',
    connectionType: 'FTTH',
    bandwidthPlan: '50 Mbps Fiber Unlimited',
    category: 'SPEED_DEGRADATION',
    priority: 'P2_MAJOR',
    status: 'RESOLVED',
    subject: 'High Latency & Speed Capped at 4 Mbps during peak hours',
    description: 'Subscribed to 50 Mbps package but getting only 3.8 Mbps on fast.com and speedtest. High jitter during online video meetings.',
    assignedTechnician: 'Kamran Haider (Lineman / Splicer)',
    opticalPowerRx: '-21.8 dBm (Normal)',
    pingLatencyMs: 14,
    packetLossPercent: 0,
    rootCauseCategory: 'PON Port Saturated / Bandwidth Profile Glitch',
    rootCauseNotes: 'Customer PPPoE session had stale QoS rate-limit rule from previous month billing cycle.',
    correctiveAction: 'Reprovisioned PPPoE profile on MikroTik CCR2004 Core BRAS. Verified throughput at 51.4 Mbps.',
    createdAt: '2026-10-17T11:00:00.000Z',
    slaDeadline: '2026-10-18T11:00:00.000Z', // 24 hr SLA
    assignedAt: '2026-10-17T11:30:00.000Z',
    resolvedAt: '2026-10-17T15:20:00.000Z',
    isSlaBreached: false,
    resolutionTimeHours: 4.33,
    feedbackRating: 5,
    feedbackComments: 'Speed is fully restored back to 50 Mbps. Thank you for prompt resolution.',
    isCustomerSatisfied: true,
    timeline: [
      {
        id: 'tl-4',
        timestamp: '2026-10-17T11:00:00.000Z',
        action: 'Complaint Registered',
        performedBy: 'Muhammad Usman Khan',
        role: 'Customer'
      },
      {
        id: 'tl-5',
        timestamp: '2026-10-17T15:20:00.000Z',
        action: 'QoS Profile Reprovisioned & Speed Restored',
        performedBy: 'Hafiz Bilal Ahmed',
        role: 'NOC Support',
        notes: 'Confirmed speed test 51.2 Mbps downlink / 50.8 Mbps uplink.'
      }
    ]
  },
  {
    id: 'tkt-3',
    ticketNumber: 'PTA-FSD-2026-0035',
    customerId: 'usr-3',
    customerName: 'Farhan Ali Bhatti',
    customerPhone: '0333-6549870',
    customerCnic: '33104-5612348-9',
    circuitId: 'PK-FSD-1045',
    district: 'Sargodha',
    tehsilArea: 'Peoples Colony No. 1',
    connectionType: 'FTTH',
    bandwidthPlan: '30 Mbps Fiber Plus',
    category: 'FREQUENT_DISCONNECT',
    priority: 'P2_MAJOR',
    status: 'CLOSED',
    subject: 'Internet Drops Every 15 Minutes - High Optical Attenuation',
    description: 'ONU LOS light flickers red intermittently. Fiber drop cable bent during wall paint work in the house.',
    assignedTechnician: 'Kamran Haider (Lineman / Splicer)',
    opticalPowerRx: '-27.9 dBm (Severe Attenuation)',
    pingLatencyMs: 38,
    packetLossPercent: 12,
    rootCauseCategory: 'Damaged Indoor Drop Cable / Tight Bend',
    rootCauseNotes: 'Indoor single-mode drop fiber had sharp 90-degree kink behind wooden cupboard causing high macro-bending loss.',
    correctiveAction: 'Re-pulled 15 meters G.657 bend-insensitive drop wire and respliced SC/APC mechanical connector. Power improved to -19.2 dBm.',
    createdAt: '2026-10-15T08:15:00.000Z',
    slaDeadline: '2026-10-16T08:15:00.000Z',
    assignedAt: '2026-10-15T08:45:00.000Z',
    resolvedAt: '2026-10-15T13:45:00.000Z',
    closedAt: '2026-10-15T15:00:00.000Z',
    isSlaBreached: false,
    resolutionTimeHours: 5.5,
    feedbackRating: 5,
    feedbackComments: 'Technician Kamran visited and replaced the damaged cable within 5 hours. Very satisfied.',
    isCustomerSatisfied: true,
    timeline: [
      {
        id: 'tl-6',
        timestamp: '2026-10-15T08:15:00.000Z',
        action: 'Complaint Logged',
        performedBy: 'Farhan Ali Bhatti',
        role: 'Customer'
      },
      {
        id: 'tl-7',
        timestamp: '2026-10-15T13:45:00.000Z',
        action: 'Drop Wire Replaced & Spliced',
        performedBy: 'Kamran Haider',
        role: 'Lineman'
      },
      {
        id: 'tl-8',
        timestamp: '2026-10-15T15:00:00.000Z',
        action: 'Ticket Closed with Customer Feedback',
        performedBy: 'Farhan Ali Bhatti',
        role: 'Customer'
      }
    ]
  },
  {
    id: 'tkt-4',
    ticketNumber: 'PTA-FSD-2026-0030',
    customerId: 'usr-1',
    customerName: 'Muhammad Usman Khan',
    customerPhone: '0300-8654321',
    customerCnic: '33100-2451893-7',
    circuitId: 'PK-FSD-0194',
    district: 'Sargodha',
    tehsilArea: 'Madina Town',
    connectionType: 'FTTH',
    bandwidthPlan: '50 Mbps Fiber Unlimited',
    category: 'BILLING_PAYMENT',
    priority: 'P3_STANDARD',
    status: 'CLOSED',
    subject: 'Advance Billing Invoice Discrepancy & Sales Tax Deduction',
    description: 'Billed Rs. 3,500 instead of agreed promotion price Rs. 3,000 for October. 19.5% PRA Punjab Sales Tax breakdown clarification requested.',
    assignedTechnician: 'Hafiz Bilal Ahmed',
    rootCauseCategory: 'Billing Engine Promotional Discount Expiry',
    rootCauseNotes: '3-month intro coupon expired automatically on billing portal.',
    correctiveAction: 'Credit note of Rs. 500 issued against ledger. Revised invoice emailed.',
    createdAt: '2026-10-12T10:00:00.000Z',
    slaDeadline: '2026-10-14T10:00:00.000Z', // 48 hr SLA
    assignedAt: '2026-10-12T11:00:00.000Z',
    resolvedAt: '2026-10-13T09:30:00.000Z',
    closedAt: '2026-10-13T10:00:00.000Z',
    isSlaBreached: false,
    resolutionTimeHours: 23.5,
    feedbackRating: 4,
    feedbackComments: 'Invoice adjusted in account ledger.',
    isCustomerSatisfied: true,
    timeline: [
      {
        id: 'tl-9',
        timestamp: '2026-10-12T10:00:00.000Z',
        action: 'Billing Dispute Lodged',
        performedBy: 'Muhammad Usman Khan',
        role: 'Customer'
      },
      {
        id: 'tl-10',
        timestamp: '2026-10-13T09:30:00.000Z',
        action: 'Dispute Verified & Credit Issued',
        performedBy: 'Hafiz Bilal Ahmed',
        role: 'Billing Accounts'
      }
    ]
  },
  {
    id: 'tkt-5',
    ticketNumber: 'PTA-FSD-2026-0027',
    customerId: 'usr-3',
    customerName: 'Farhan Ali Bhatti',
    customerPhone: '0333-6549870',
    customerCnic: '33104-5612348-9',
    circuitId: 'PK-FSD-1045',
    district: 'Sargodha',
    tehsilArea: 'Peoples Colony No. 1',
    connectionType: 'FTTH',
    bandwidthPlan: '30 Mbps Fiber Plus',
    category: 'DNS_ROUTING',
    priority: 'P2_MAJOR',
    status: 'CLOSED',
    subject: 'Cannot Access FBR Tax Portal and State Bank PRAL Websites',
    description: 'ISP recursive DNS failing to resolve epay.punjab.gov.pk and iris.fbr.gov.pk. Google DNS 8.8.8.8 works when configured manually.',
    assignedTechnician: 'Hafiz Bilal Ahmed',
    opticalPowerRx: '-20.1 dBm',
    pingLatencyMs: 16,
    packetLossPercent: 0,
    rootCauseCategory: 'Local BIND9 DNS Cache Poisoning / Upstream Sync Failure',
    rootCauseNotes: 'DNS forwarder on 103.x.x.5 failed upstream zone transfer with PKNIC.',
    correctiveAction: 'Flushed BIND9 cache and added secondary upstream routing via PIE (Pakistan Internet Exchange).',
    createdAt: '2026-10-08T14:00:00.000Z',
    slaDeadline: '2026-10-09T14:00:00.000Z',
    assignedAt: '2026-10-08T14:15:00.000Z',
    resolvedAt: '2026-10-08T18:00:00.000Z',
    closedAt: '2026-10-08T19:00:00.000Z',
    isSlaBreached: false,
    resolutionTimeHours: 4.0,
    feedbackRating: 5,
    feedbackComments: 'Resolved quickly within 4 hours. Websites accessible now.',
    isCustomerSatisfied: true,
    timeline: [
      {
        id: 'tl-11',
        timestamp: '2026-10-08T14:00:00.000Z',
        action: 'DNS Routing Issue Registered',
        performedBy: 'Farhan Ali Bhatti',
        role: 'Customer'
      },
      {
        id: 'tl-12',
        timestamp: '2026-10-08T18:00:00.000Z',
        action: 'DNS Cache Flushed & Upstream PIE Sync Verified',
        performedBy: 'Hafiz Bilal Ahmed',
        role: 'NOC Engineer'
      }
    ]
  },
  {
    id: 'tkt-6',
    ticketNumber: 'PTA-FSD-2026-0021',
    customerId: 'usr-2',
    customerName: 'Al-Madina Textile Mills Ltd (Commercial)',
    customerPhone: '0321-7891234',
    customerCnic: '33102-9876543-1',
    circuitId: 'PK-FSD-0820',
    district: 'Sargodha',
    tehsilArea: 'Khurrianwala Industrial Area',
    connectionType: 'FTTH',
    bandwidthPlan: '100 Mbps Dedicated CIR Leased Line',
    category: 'CPE_ONT_FAULT',
    priority: 'P1_CRITICAL',
    status: 'ESCALATED_PTA',
    subject: 'Optical Network Terminal Power Supply Burnout during FESCO Surge',
    description: 'Industrial high voltage spike destroyed OLT SFP transceiver and indoor ONT power unit. Replacement delayed beyond 8-hour statutory PTA window.',
    assignedTechnician: 'Kamran Haider (Lineman / Splicer)',
    opticalPowerRx: '-40 dBm (Power Unit Blown)',
    rootCauseCategory: 'Electrical Grid Surge / Inventory Delay',
    rootCauseNotes: 'Severe power surge destroyed optical front-end. Specialized 10G SFP module was out of stock at district warehouse and sourced from Lahore hub.',
    correctiveAction: 'SFP module delivered via courier and installed with industrial online UPS isolator. Resolution took 11 hours (exceeding 8h SLA). Incident reported to PTA Zonal CPD.',
    createdAt: '2026-10-03T07:00:00.000Z',
    slaDeadline: '2026-10-03T15:00:00.000Z',
    assignedAt: '2026-10-03T07:30:00.000Z',
    resolvedAt: '2026-10-03T18:30:00.000Z',
    closedAt: '2026-10-04T09:00:00.000Z',
    isSlaBreached: true,
    resolutionTimeHours: 11.5,
    feedbackRating: 3,
    feedbackComments: 'The delay in equipment replacement disrupted production shift. SLA breach logged.',
    isCustomerSatisfied: false,
    timeline: [
      {
        id: 'tl-13',
        timestamp: '2026-10-03T07:00:00.000Z',
        action: 'High Priority P1 Complaint Logged',
        performedBy: 'Al-Madina Textile Mills Ltd',
        role: 'Customer'
      },
      {
        id: 'tl-14',
        timestamp: '2026-10-03T15:00:00.000Z',
        action: 'SLA Breach Triggered (8 Hours Expired)',
        performedBy: 'PTA Compliance Engine (System)',
        role: 'Compliance Daemon',
        notes: 'Flagged for PTA Regulatory Annual Inspection Audit'
      },
      {
        id: 'tl-15',
        timestamp: '2026-10-03T18:30:00.000Z',
        action: 'Hardware Installed & Link Restored',
        performedBy: 'Kamran Haider',
        role: 'Lineman'
      }
    ]
  }
];

class StorageManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        if (parsed.tickets && parsed.users && parsed.config) {
          let updated = false;
          if (
            parsed.config.registeredDistrict !== 'Sargodha' ||
            parsed.config.emergencyNocHelpline !== '03390480022' ||
            parsed.config.complianceOfficerEmail === 'compliance@citrus.net.pk'
          ) {
            parsed.config.registeredDistrict = 'Sargodha';
            parsed.config.licenseNumber = 'CVAS-DATA/DIST-SGD/CITRUS-2024';
            parsed.config.emergencyNocHelpline = '03390480022';
            parsed.config.complianceOfficerPhone = '03390480022';
            parsed.config.complianceOfficerEmail = 'support.citrus@gmail.com';
            updated = true;
          }
          for (const u of parsed.users) {
            if (u.email === 'compliance@citrus.net.pk') {
              u.email = 'support.citrus@gmail.com';
              u.phone = '03390480022';
              updated = true;
            }
            if (u.district !== 'Sargodha') {
              u.district = 'Sargodha';
              updated = true;
            }
          }
          for (const t of parsed.tickets) {
            if (t.district !== 'Sargodha') {
              t.district = 'Sargodha';
              updated = true;
            }
          }
          for (const defaultUser of INITIAL_USERS) {
            const existing = parsed.users.find(
              (u: User) => u.id === defaultUser.id || u.email.toLowerCase() === defaultUser.email.toLowerCase()
            );
            if (!existing) {
              parsed.users.unshift(defaultUser);
              updated = true;
            } else if (!existing.password && defaultUser.password) {
              existing.password = defaultUser.password;
              existing.status = existing.status || 'active';
              updated = true;
            }
          }
          if (updated) {
            this.saveDatabase(parsed);
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error reading complaints database file, initializing with defaults:', err);
    }

    const initialData: DatabaseSchema = {
      config: INITIAL_CONFIG,
      users: INITIAL_USERS,
      tickets: INITIAL_TICKETS
    };

    this.saveDatabase(initialData);
    return initialData;
  }

  private saveDatabase(dataToSave: DatabaseSchema = this.data): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  // Config operations
  public getConfig(): PTALicenseeConfig {
    return this.data.config;
  }

  public updateConfig(newConfig: Partial<PTALicenseeConfig>): PTALicenseeConfig {
    this.data.config = { ...this.data.config, ...newConfig };
    this.saveDatabase();
    return this.data.config;
  }

  // User operations
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByCircuitId(circuitId: string): User | undefined {
    return this.data.users.find(u => u.circuitId?.toUpperCase() === circuitId.toUpperCase());
  }

  public createUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.saveDatabase();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User {
    const user = this.getUserById(id);
    if (!user) throw new Error(`User with ID ${id} not found`);
    Object.assign(user, updates);
    this.saveDatabase();
    return user;
  }

  public deleteUser(id: string): void {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users.splice(idx, 1);
      this.saveDatabase();
    }
  }

  // Ticket operations
  public getTickets(): ComplaintTicket[] {
    return this.data.tickets;
  }

  public getTicketById(id: string): ComplaintTicket | undefined {
    return this.data.tickets.find(t => t.id === id);
  }

  public getTicketByNumber(ticketNumber: string): ComplaintTicket | undefined {
    return this.data.tickets.find(t => t.ticketNumber.toUpperCase() === ticketNumber.toUpperCase());
  }

  public calculateSlaDeadline(priority: ComplaintPriority, fromDate: Date = new Date()): Date {
    const deadline = new Date(fromDate);
    // PTA CVAS SLA guidelines:
    // P1 (Critical): 8 Hours
    // P2 (Major): 24 Hours
    // P3 (Standard): 48 Hours
    if (priority === 'P1_CRITICAL') {
      deadline.setHours(deadline.getHours() + 8);
    } else if (priority === 'P2_MAJOR') {
      deadline.setHours(deadline.getHours() + 24);
    } else {
      deadline.setHours(deadline.getHours() + 48);
    }
    return deadline;
  }

  public createTicket(input: {
    customerId: string;
    category: ComplaintCategory;
    priority: ComplaintPriority;
    subject: string;
    description: string;
    opticalPowerRx?: string;
    pingLatencyMs?: number;
    packetLossPercent?: number;
  }): ComplaintTicket {
    const customer = this.getUserById(input.customerId);
    if (!customer) {
      throw new Error(`Customer with ID ${input.customerId} not found`);
    }

    const now = new Date();
    const slaDeadline = this.calculateSlaDeadline(input.priority, now);
    const district = customer.district || this.data.config.registeredDistrict;
    
    // Generate official ticket number e.g. PTA-FSD-2026-0045
    const ticketSeq = (this.data.tickets.length + 1).toString().padStart(4, '0');
    const districtCode = district.substring(0, 3).toUpperCase();
    const ticketNumber = `PTA-${districtCode}-${now.getFullYear()}-${ticketSeq}`;

    const newTicket: ComplaintTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerCnic: customer.cnic,
      circuitId: customer.circuitId || `PK-${districtCode}-GUEST`,
      district,
      tehsilArea: customer.areaAddress || 'Urban Central',
      connectionType: customer.connectionType || 'FTTH',
      bandwidthPlan: customer.bandwidthPlan || 'Standard Broadband',
      category: input.category,
      priority: input.priority,
      status: 'REGISTERED',
      subject: input.subject,
      description: input.description,
      opticalPowerRx: input.opticalPowerRx,
      pingLatencyMs: input.pingLatencyMs,
      packetLossPercent: input.packetLossPercent,
      createdAt: now.toISOString(),
      slaDeadline: slaDeadline.toISOString(),
      isSlaBreached: false,
      timeline: [
        {
          id: `tl-${Date.now()}-1`,
          timestamp: now.toISOString(),
          action: 'Complaint Registered in CMS',
          performedBy: customer.name,
          role: 'Customer',
          notes: `PTA Tracking Reference: ${ticketNumber}. SLA Target: ${input.priority === 'P1_CRITICAL' ? '8 Hours' : input.priority === 'P2_MAJOR' ? '24 Hours' : '48 Hours'}`
        }
      ]
    };

    this.data.tickets.unshift(newTicket);
    this.saveDatabase();
    return newTicket;
  }

  public updateTicketStatus(
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
  ): ComplaintTicket {
    const ticket = this.getTicketById(id);
    if (!ticket) {
      throw new Error(`Ticket with ID ${id} not found`);
    }

    const now = new Date();

    if (updates.status && updates.status !== ticket.status) {
      ticket.status = updates.status;

      if (updates.status === 'ASSIGNED' && !ticket.assignedAt) {
        ticket.assignedAt = now.toISOString();
      }

      if (updates.status === 'RESOLVED') {
        ticket.resolvedAt = now.toISOString();
        const createdMs = new Date(ticket.createdAt).getTime();
        const resolvedMs = now.getTime();
        ticket.resolutionTimeHours = Math.round(((resolvedMs - createdMs) / (1000 * 60 * 60)) * 100) / 100;
        
        // Check if breached
        const deadlineMs = new Date(ticket.slaDeadline).getTime();
        ticket.isSlaBreached = resolvedMs > deadlineMs;
      }

      if (updates.status === 'CLOSED') {
        ticket.closedAt = now.toISOString();
      }

      if (updates.status === 'ESCALATED_PTA') {
        ticket.isSlaBreached = true;
      }
    }

    if (updates.assignedTechnician) {
      ticket.assignedTechnician = updates.assignedTechnician;
    }

    if (updates.opticalPowerRx !== undefined) ticket.opticalPowerRx = updates.opticalPowerRx;
    if (updates.pingLatencyMs !== undefined) ticket.pingLatencyMs = updates.pingLatencyMs;
    if (updates.packetLossPercent !== undefined) ticket.packetLossPercent = updates.packetLossPercent;
    if (updates.rootCauseCategory) ticket.rootCauseCategory = updates.rootCauseCategory;
    if (updates.rootCauseNotes) ticket.rootCauseNotes = updates.rootCauseNotes;
    if (updates.correctiveAction) ticket.correctiveAction = updates.correctiveAction;

    ticket.timeline.push({
      id: `tl-${Date.now()}`,
      timestamp: now.toISOString(),
      action: updates.actionNotes || `Status updated to ${ticket.status}`,
      performedBy: updates.performedBy,
      role: updates.role,
      notes: updates.rootCauseNotes || updates.correctiveAction
    });

    this.saveDatabase();
    return ticket;
  }

  public addCustomerFeedback(
    id: string,
    rating: number,
    comments: string,
    isSatisfied: boolean
  ): ComplaintTicket {
    const ticket = this.getTicketById(id);
    if (!ticket) {
      throw new Error(`Ticket with ID ${id} not found`);
    }

    ticket.feedbackRating = rating;
    ticket.feedbackComments = comments;
    ticket.isCustomerSatisfied = isSatisfied;
    ticket.status = 'CLOSED';
    ticket.closedAt = new Date().toISOString();

    ticket.timeline.push({
      id: `tl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'Customer Feedback Submitted',
      performedBy: ticket.customerName,
      role: 'Customer',
      notes: `Rating: ${rating}/5 Stars. Status: Satisfied. Feedback: "${comments}"`
    });

    this.saveDatabase();
    return ticket;
  }

  public acknowledgeTicket(
    id: string,
    performedBy: string,
    notes?: string
  ): ComplaintTicket {
    const ticket = this.getTicketById(id);
    if (!ticket) throw new Error(`Ticket with ID ${id} not found`);

    const now = new Date();
    ticket.acknowledgedAt = now.toISOString();
    ticket.acknowledgedBy = performedBy;
    if (ticket.status === 'REGISTERED') {
      ticket.status = 'ASSIGNED';
      ticket.assignedAt = now.toISOString();
    }

    ticket.timeline.push({
      id: `tl-${Date.now()}`,
      timestamp: now.toISOString(),
      action: 'Complaint Acknowledged (ACK) by NOC',
      performedBy,
      role: 'NOC Operations',
      notes: notes || 'Complaint received, verified in NMS, and dispatched to district maintenance engineer.'
    });

    this.saveDatabase();
    return ticket;
  }

  public postOnlineUpdate(
    id: string,
    updateText: string,
    performedBy: string,
    role: string = 'NOC Operations'
  ): ComplaintTicket {
    const ticket = this.getTicketById(id);
    if (!ticket) throw new Error(`Ticket with ID ${id} not found`);

    const now = new Date();
    ticket.latestOnlineUpdate = updateText;
    ticket.latestOnlineUpdateAt = now.toISOString();

    ticket.timeline.push({
      id: `tl-${Date.now()}`,
      timestamp: now.toISOString(),
      action: 'NOC Online Web Status Update',
      performedBy,
      role,
      notes: updateText
    });

    this.saveDatabase();
    return ticket;
  }

  public resetToSampleData(): void {
    this.data = {
      config: INITIAL_CONFIG,
      users: INITIAL_USERS,
      tickets: INITIAL_TICKETS
    };
    this.saveDatabase();
  }
}

export const storage = new StorageManager();
