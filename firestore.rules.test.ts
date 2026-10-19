/**
 * Firestore Security Rules Verification Suite — Dirty Dozen Payloads
 * Verifies that all 12 adversarial payloads in security_spec.md return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email: string; email_verified: boolean } | null;
  docId?: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Customer Profile',
    collection: 'users',
    operation: 'create',
    docId: 'uid_A',
    auth: { uid: 'uid_A', email: 'usera@gmail.com', email_verified: true },
    payload: { ownerUid: 'uid_B', name: 'Spoofer' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Cross-Customer Profile Read (PII Leak)',
    collection: 'users',
    operation: 'get',
    docId: 'uid_B',
    auth: { uid: 'uid_A', email: 'usera@gmail.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Customer Profile Enumeration (list)',
    collection: 'users',
    operation: 'list',
    auth: { uid: 'uid_A', email: 'usera@gmail.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection on Profile',
    collection: 'users',
    operation: 'create',
    docId: 'uid_A',
    auth: { uid: 'uid_A', email: 'usera@gmail.com', email_verified: true },
    payload: { ownerUid: 'uid_A', isAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Unverified Email Write',
    collection: 'users',
    operation: 'create',
    docId: 'uid_A',
    auth: { uid: 'uid_A', email: 'usera@gmail.com', email_verified: false },
    payload: { ownerUid: 'uid_A' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Cross-Customer Complaint Read',
    collection: 'complaints',
    operation: 'get',
    docId: 'tkt_other',
    auth: { uid: 'uid_A', email: 'usera@gmail.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Unfiltered Complaint List Query',
    collection: 'complaints',
    operation: 'list',
    auth: { uid: 'uid_A', email: 'usera@gmail.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Complaint Ownership Hijack on Update',
    collection: 'complaints',
    operation: 'update',
    docId: 'tkt_1',
    auth: { uid: 'uid_A', email: 'usera@gmail.com', email_verified: true },
    payload: { ownerUid: 'uid_B' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Client Timestamp Forgery',
    collection: 'complaints',
    operation: 'create',
    docId: 'tkt_1',
    auth: { uid: 'uid_A', email: 'usera@gmail.com', email_verified: true },
    payload: { ownerUid: 'uid_A', createdAt: '1999-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Oversized String Resource Exhaustion (DoW)',
    collection: 'complaints',
    operation: 'create',
    docId: 'tkt_1',
    auth: { uid: 'uid_A', email: 'usera@gmail.com', email_verified: true },
    payload: { ownerUid: 'uid_A', description: 'X'.repeat(5000) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal State Bypass on Closed Complaint',
    collection: 'complaints',
    operation: 'update',
    docId: 'tkt_closed',
    auth: { uid: 'uid_A', email: 'usera@gmail.com', email_verified: true },
    payload: { status: 'OPEN' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-Admin Escalation',
    collection: 'admins',
    operation: 'create',
    docId: 'uid_A',
    auth: { uid: 'uid_A', email: 'usera@gmail.com', email_verified: true },
    payload: { uid: 'uid_A', email: 'usera@gmail.com' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
