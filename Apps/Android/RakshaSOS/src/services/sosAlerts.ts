import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import * as Location from 'expo-location';
import { db, storage } from '../config/firebaseconfig';

export type SosOptionId = 'police' | 'hospital' | 'guardians' | 'fire';

export type EmergencyContactSnapshot = {
  id: string;
  name: string | null;
  relationship: string | null;
  phone_number: string | null;
  priority: string | null;
  is_notified_on_sos: boolean;
};

export type IncidentEvidenceDraft = {
  note?: string;
  photoUri?: string | null;
  audioUri?: string | null;
};

export type ActiveSosAlertSnapshot = {
  id: string;
  type: string | null;
  status: string | null;
  start_time: unknown;
  client_created_at: unknown;
  accepted_at: unknown;
  accepted_by_hospital: string | null;
  accepted_by_name: string | null;
  ambulance_eta: unknown;
  ambulance_lat: number | null;
  ambulance_lng: number | null;
  eta_updated_at: unknown;
  end_time: unknown;
  hospitals_notified: unknown;
  police_station_id: string | null;
  last_known_lat: number | null;
  last_known_lng: number | null;
  cloud_function_pending_fields: string[];
};

type UploadedIncidentEvidence = {
  note: string | null;
  photo_url: string | null;
  audio_url: string | null;
};

const usersPath = 'users';

const CLOUD_FUNCTION_PENDING_FIELDS = [
  'accepted_at',
  'accepted_by_hospital',
  'accepted_by_name',
  'ambulance_eta',
  'ambulance_lat',
  'ambulance_lng',
  'audio_recording_url',
  'end_time',
  'eta_updated_at',
  'hospitals_notified',
  'police_station_id',
  'resolved_by',
];

const mapSosType = (sosType: SosOptionId | null) => {
  switch (sosType) {
    case 'police':
      return 'police';
    case 'hospital':
      return 'hospital';
    case 'guardians':
      return 'guardian';
    case 'fire':
      return 'fire';
    default:
      return 'general';
  }
};

const ACTIVE_SOS_STATUSES = new Set([
  'triggered',
  'broadcasted',
  'pending',
  'accepted',
  'active',
  'acknowledged',
  'assigned',
  'dispatched',
  'en_route',
  'on_the_way',
  'responding',
  'arrived',
]);

const TERMINAL_SOS_STATUSES = new Set(['cancelled', 'canceled', 'resolved', 'closed', 'completed']);

const safeString = (value: unknown, fallback = '') => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value).trim();
};

const safeNullableString = (value: unknown) => {
  const text = safeString(value);
  return text || null;
};

const safeList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => safeString(item)).filter(Boolean);
  }

  const text = safeString(value);
  return text ? [text] : [];
};

const safeNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const getMillis = (value: unknown) => {
  if (!value) {
    return 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (typeof value === 'object') {
    const timestampLike = value as { toDate?: () => Date; seconds?: number };
    if (typeof timestampLike.toDate === 'function') {
      return timestampLike.toDate().getTime();
    }
    if (typeof timestampLike.seconds === 'number') {
      return timestampLike.seconds * 1000;
    }
  }

  return 0;
};

const mapActiveSosAlert = (id: string, data: Record<string, unknown>): ActiveSosAlertSnapshot => ({
  id,
  type: safeNullableString(data.type),
  status: safeNullableString(data.status),
  start_time: data.start_time,
  client_created_at: data.client_created_at,
  accepted_at: data.accepted_at,
  accepted_by_hospital: safeNullableString(data.accepted_by_hospital),
  accepted_by_name: safeNullableString(data.accepted_by_name),
  ambulance_eta: data.ambulance_eta,
  ambulance_lat: safeNumber(data.ambulance_lat),
  ambulance_lng: safeNumber(data.ambulance_lng),
  eta_updated_at: data.eta_updated_at,
  end_time: data.end_time,
  hospitals_notified: data.hospitals_notified,
  police_station_id: safeNullableString(data.police_station_id),
  last_known_lat: safeNumber(data.last_known_lat),
  last_known_lng: safeNumber(data.last_known_lng),
  cloud_function_pending_fields: safeList(data.cloud_function_pending_fields),
});

async function getLiveLocationSnapshot() {
  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    return {
      last_known_lat: null,
      last_known_lng: null,
      location_accuracy_m: null,
      location_altitude_m: null,
      location_heading: null,
      location_speed_mps: null,
      location_captured_at: null,
      location_permission_status: permission.status,
    };
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    last_known_lat: location.coords.latitude,
    last_known_lng: location.coords.longitude,
    location_accuracy_m: location.coords.accuracy,
    location_altitude_m: location.coords.altitude,
    location_heading: location.coords.heading,
    location_speed_mps: location.coords.speed,
    location_captured_at: new Date(location.timestamp).toISOString(),
    location_permission_status: permission.status,
  };
}

async function uploadLocalFile(uri: string, path: string, contentType: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, path);

  await uploadBytes(storageRef, blob, { contentType });
  return getDownloadURL(storageRef);
}

async function uploadIncidentEvidence(
  uid: string,
  sosType: SosOptionId | null,
  evidence?: IncidentEvidenceDraft,
): Promise<UploadedIncidentEvidence> {
  const alertType = mapSosType(sosType);
  const createdAt = Date.now();
  const basePath = `sos_alerts/${uid}/${createdAt}-${alertType}`;

  const [photoUrl, audioUrl] = await Promise.all([
    evidence?.photoUri ? uploadLocalFile(evidence.photoUri, `${basePath}/accident-photo.jpg`, 'image/jpeg') : null,
    evidence?.audioUri ? uploadLocalFile(evidence.audioUri, `${basePath}/incident-audio.m4a`, 'audio/mp4') : null,
  ]);

  return {
    note: safeNullableString(evidence?.note),
    photo_url: photoUrl,
    audio_url: audioUrl,
  };
}

export async function getUserEmergencyContacts(uid: string): Promise<EmergencyContactSnapshot[]> {
  const contactsSnap = await getDocs(collection(db, usersPath, uid, 'emergency_contacts'));

  return contactsSnap.docs
    .map((contactDoc) => {
      const data = contactDoc.data();

      return {
        id: contactDoc.id,
        name: safeNullableString(data.name),
        relationship: safeNullableString(data.relationship),
        phone_number: safeNullableString(data.phone_number),
        priority: safeNullableString(data.priority),
        is_notified_on_sos: data.is_notified_on_sos !== false,
      };
    })
    .filter((contact) => contact.name || contact.phone_number);
}

export async function createSosAlertFromCurrentUser(
  currentUser: User | null,
  sosType: SosOptionId | null,
  evidence?: IncidentEvidenceDraft,
) {
  if (!currentUser) {
    throw new Error('You must be signed in before sending an SOS alert.');
  }

  const userRef = doc(db, usersPath, currentUser.uid);
  const medicalRef = doc(db, usersPath, currentUser.uid, 'medical_profiles', 'profile');

  const [userSnap, medicalSnap, emergencyContacts, locationSnapshot, uploadedEvidence] = await Promise.all([
    getDoc(userRef),
    getDoc(medicalRef),
    getUserEmergencyContacts(currentUser.uid),
    getLiveLocationSnapshot(),
    uploadIncidentEvidence(currentUser.uid, sosType, evidence),
  ]);

  const userData = userSnap.exists() ? userSnap.data() : {};
  const medicalData = medicalSnap.exists() ? medicalSnap.data() : {};
  const primaryContact =
    emergencyContacts.find((contact) => contact.priority === 'primary') ?? emergencyContacts[0] ?? null;

  const victimName =
    safeNullableString(userData.full_name) ??
    safeNullableString(currentUser.displayName) ??
    safeNullableString(currentUser.email);
  const victimEmail = safeNullableString(userData.email) ?? safeNullableString(currentUser.email);
  const victimPhone = safeNullableString(userData.phone_number);

  const clientCreatedAt = new Date().toISOString();
  const alertPayload = {
    accepted_at: null,
    accepted_by_hospital: null,
    accepted_by_name: null,
    ambulance_eta: null,
    ambulance_lat: null,
    ambulance_lng: null,
    audio_recording_url: null,
    blood_group: safeNullableString(medicalData.blood_group),
    broadcasted_at: serverTimestamp(),
    client_created_at: clientCreatedAt,
    chronic_conditions: safeNullableString(medicalData.chronic_conditions),
    client_filled_fields: [
      'user_id',
      'victim_name',
      'victim_email',
      'victim_phone',
      'blood_group',
      'known_allergies',
      'chronic_conditions',
      'medical_profile_snapshot',
      'emergency_contacts',
      'primary_emergency_contact',
      'last_known_lat',
      'last_known_lng',
      'incident_note',
      'incident_photo_url',
      'incident_audio_url',
    ],
    cloud_function_pending_fields: CLOUD_FUNCTION_PENDING_FIELDS,
    emergency_contacts: emergencyContacts,
    end_time: null,
    eta_updated_at: null,
    hospitals_notified: null,
    known_allergies: safeList(medicalData.known_allergies),
    incident_audio_url: uploadedEvidence.audio_url,
    incident_evidence_required: sosType !== null,
    incident_note: uploadedEvidence.note,
    incident_photo_url: uploadedEvidence.photo_url,
    ...locationSnapshot,
    medical_profile_snapshot: {
      blood_group: safeNullableString(medicalData.blood_group),
      chronic_conditions: safeNullableString(medicalData.chronic_conditions),
      emergency_doctor_name: safeNullableString(medicalData.emergency_doctor_name),
      emergency_doctor_phone: safeNullableString(medicalData.emergency_doctor_phone),
      insurance_policy_number: safeNullableString(medicalData.insurance_policy_number),
      insurance_provider: safeNullableString(medicalData.insurance_provider),
      known_allergies: safeList(medicalData.known_allergies),
      medical_notes: safeNullableString(medicalData.medical_notes),
    },
    police_station_id: null,
    primary_emergency_contact: primaryContact,
    resolved_by: null,
    start_time: serverTimestamp(),
    status: 'triggered',
    trigger_source: 'home_screen',
    trigger_type: 'manual_button',
    type: mapSosType(sosType),
    user_id: currentUser.uid,
    victim_address: safeNullableString(userData.address),
    victim_city: safeNullableString(userData.city),
    victim_dob: safeNullableString(userData.dob),
    victim_email: victimEmail,
    victim_gender: safeNullableString(userData.gender),
    victim_name: victimName,
    victim_phone: victimPhone,
    victim_pincode: safeNullableString(userData.pincode),
  };
  const alertRef = await addDoc(collection(db, 'sos_alerts'), alertPayload);

  return {
    ref: alertRef,
    alert: mapActiveSosAlert(alertRef.id, {
      ...alertPayload,
      start_time: clientCreatedAt,
      broadcasted_at: clientCreatedAt,
    }),
  };
}

export function subscribeToActiveSosAlert(
  uid: string,
  onChange: (alert: ActiveSosAlertSnapshot | null) => void,
  onError?: (error: Error) => void,
) {
  const alertsQuery = query(collection(db, 'sos_alerts'), where('user_id', '==', uid));

  return onSnapshot(
    alertsQuery,
    (snapshot) => {
      const activeAlerts = snapshot.docs
        .map((alertDoc) => mapActiveSosAlert(alertDoc.id, alertDoc.data()))
        .filter((alert) => {
          const status = (alert.status ?? '').toLowerCase();
          if (alert.end_time || TERMINAL_SOS_STATUSES.has(status)) {
            return false;
          }

          return !status || ACTIVE_SOS_STATUSES.has(status) || !TERMINAL_SOS_STATUSES.has(status);
        })
        .sort(
          (left, right) =>
            Math.max(getMillis(right.start_time), getMillis(right.client_created_at)) -
            Math.max(getMillis(left.start_time), getMillis(left.client_created_at)),
        );

      onChange(activeAlerts[0] ?? null);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function cancelSosAlert(alertId: string) {
  await updateDoc(doc(db, 'sos_alerts', alertId), {
    cancel_requested_at: serverTimestamp(),
    canceled_at: serverTimestamp(),
    cancellation_source: 'home_screen_slide',
    end_time: serverTimestamp(),
    status: 'cancelled',
  });
}
