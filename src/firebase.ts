import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { User as UserType, ComplaintTicket, DistrictName, ComplaintCategory, ComplaintPriority, ComplaintStatus } from './types/index.js';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Sanitize string helper to strictly satisfy blueprint boundaries
function clampStr(val: string | undefined | null, minLen: number, maxLen: number, fallback: string): string {
  const clean = (val || '').trim();
  const base = clean.length >= minLen ? clean : fallback;
  return base.slice(0, maxLen);
}

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 64) || 'id_default';
}

export async function signInCustomerWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutFirebaseUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged };
export type { FirebaseUser };

export async function getCloudCustomerProfile(uid: string): Promise<UserType | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const data = snap.data();
    const createdIso =
      data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
    return {
      id: data.customerId || uid,
      name: data.name,
      email: data.email,
      phone: data.phone,
      cnic: data.cnic,
      role: 'customer',
      district: (data.district as DistrictName) || 'Faisalabad',
      areaAddress: data.areaAddress,
      circuitId: data.circuitId,
      bandwidthPlan: data.bandwidthPlan,
      connectionType: data.connectionType || 'FTTH',
      createdAt: createdIso,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveCloudCustomerProfile(uid: string, user: UserType): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return;
  const path = `users/${uid}`;
  const validDistricts: DistrictName[] = ['Faisalabad', 'Lahore', 'Multan', 'Rawalpindi', 'Islamabad'];
  const district: DistrictName = validDistricts.includes(user.district as DistrictName)
    ? (user.district as DistrictName)
    : 'Faisalabad';
  const validConn = ['FTTH', 'GPON', 'Wireless P2P', 'Copper DSL'];
  const connectionType = validConn.includes(user.connectionType || '') ? user.connectionType! : 'FTTH';

  try {
    const existingSnap = await getDoc(doc(db, 'users', uid));
    if (!existingSnap.exists()) {
      await setDoc(doc(db, 'users', uid), {
        ownerUid: uid,
        customerId: sanitizeId(user.id || uid),
        name: clampStr(user.name, 2, 100, 'Citrus Subscriber'),
        email: clampStr(user.email, 5, 120, auth.currentUser.email || 'subscriber@gmail.com'),
        phone: clampStr(user.phone, 5, 30, '0300-0000000'),
        cnic: clampStr(user.cnic, 5, 25, '33100-0000000-0'),
        district,
        areaAddress: clampStr(user.areaAddress, 2, 250, `${district} Fiber Network`),
        circuitId: clampStr(user.circuitId, 2, 64, `CTR-FSD-FTTH-${Math.floor(1000 + Math.random() * 9000)}`),
        bandwidthPlan: clampStr(user.bandwidthPlan, 2, 100, '50 Mbps Fiber Unlimited'),
        connectionType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'users', uid), {
        name: clampStr(user.name, 2, 100, 'Citrus Subscriber'),
        phone: clampStr(user.phone, 5, 30, '0300-0000000'),
        cnic: clampStr(user.cnic, 5, 25, '33100-0000000-0'),
        district,
        areaAddress: clampStr(user.areaAddress, 2, 250, `${district} Fiber Network`),
        bandwidthPlan: clampStr(user.bandwidthPlan, 2, 100, '50 Mbps Fiber Unlimited'),
        connectionType,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveCloudComplaint(uid: string, ticket: ComplaintTicket, customerEmail: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== uid) return;
  const cleanTicketId = sanitizeId(ticket.id);
  const path = `complaints/${cleanTicketId}`;
  const validDistricts: DistrictName[] = ['Faisalabad', 'Lahore', 'Multan', 'Rawalpindi', 'Islamabad'];
  const district: DistrictName = validDistricts.includes(ticket.district as DistrictName)
    ? (ticket.district as DistrictName)
    : 'Faisalabad';

  try {
    const existingSnap = await getDoc(doc(db, 'complaints', cleanTicketId));
    if (!existingSnap.exists()) {
      await setDoc(doc(db, 'complaints', cleanTicketId), {
        ownerUid: uid,
        ticketId: cleanTicketId,
        ticketNumber: clampStr(ticket.ticketNumber, 3, 64, `PTA-FSD-${Date.now()}`),
        customerId: sanitizeId(ticket.customerId || uid),
        customerName: clampStr(ticket.customerName, 2, 100, 'Citrus Subscriber'),
        customerEmail: clampStr(customerEmail, 5, 120, auth.currentUser.email || 'subscriber@gmail.com'),
        customerPhone: clampStr(ticket.customerPhone, 5, 30, '0300-0000000'),
        circuitId: clampStr(ticket.circuitId, 2, 64, 'CTR-FSD-FTTH'),
        district,
        category: ticket.category || 'SPEED_DEGRADATION',
        priority: ticket.priority || 'P2_MAJOR',
        status: 'REGISTERED',
        subject: clampStr(ticket.subject, 3, 200, `${ticket.category} Fault Reported`),
        description: clampStr(ticket.description, 3, 1500, 'Fiber service issue reported via customer portal.'),
        latestOnlineUpdate: clampStr(ticket.latestOnlineUpdate || '', 0, 500, ''),
        customerFeedbackComment: clampStr(ticket.feedbackComments || '', 0, 500, ''),
        customerRating: typeof ticket.feedbackRating === 'number' ? ticket.feedbackRating : 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const existingData = existingSnap.data();
      if (existingData.status !== 'CLOSED') {
        await updateDoc(doc(db, 'complaints', cleanTicketId), {
          status: ticket.status || existingData.status,
          latestOnlineUpdate: clampStr(ticket.latestOnlineUpdate || existingData.latestOnlineUpdate || '', 0, 500, ''),
          customerFeedbackComment: clampStr(
            ticket.feedbackComments || existingData.customerFeedbackComment || '',
            0,
            500,
            ''
          ),
          customerRating:
            typeof ticket.feedbackRating === 'number'
              ? ticket.feedbackRating
              : existingData.customerRating || 0,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToCustomerCloudComplaints(
  uid: string,
  onReceive: (tickets: ComplaintTicket[]) => void
): () => void {
  const path = 'complaints';
  const q = query(collection(db, 'complaints'), where('ownerUid', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: ComplaintTicket[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        const createdIso =
          d.createdAt instanceof Timestamp ? d.createdAt.toDate().toISOString() : new Date().toISOString();
        const slaHours = d.priority === 'P1_CRITICAL' ? 8 : d.priority === 'P2_MAJOR' ? 24 : 48;
        const slaDeadline = new Date(new Date(createdIso).getTime() + slaHours * 3600000).toISOString();

        return {
          id: d.ticketId || docSnap.id,
          ticketNumber: d.ticketNumber,
          customerId: d.customerId,
          customerName: d.customerName,
          customerPhone: d.customerPhone,
          customerCnic: '33100-0000000-0',
          circuitId: d.circuitId,
          district: d.district as DistrictName,
          tehsilArea: `${d.district} Fiber Sector`,
          connectionType: 'FTTH',
          bandwidthPlan: '50 Mbps Fiber Unlimited',
          category: d.category as ComplaintCategory,
          priority: d.priority as ComplaintPriority,
          status: d.status as ComplaintStatus,
          subject: d.subject,
          description: d.description,
          createdAt: createdIso,
          slaDeadline,
          isSlaBreached: false,
          latestOnlineUpdate: d.latestOnlineUpdate || undefined,
          feedbackRating: d.customerRating > 0 ? d.customerRating : undefined,
          feedbackComments: d.customerFeedbackComment || undefined,
          isCustomerSatisfied: d.customerRating >= 4,
          timeline: [
            {
              id: `tl-${docSnap.id}`,
              timestamp: createdIso,
              action: 'Complaint Logged & Synced to Google Cloud',
              performedBy: d.customerName,
              role: 'customer',
              notes: d.description,
            },
          ],
        };
      });
      onReceive(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
