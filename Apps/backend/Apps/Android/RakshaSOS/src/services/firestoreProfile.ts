import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../config/firebaseconfig';
import { emptyProfileDraft, LanguageCode, UserProfileDraft } from '../types/onboarding';

export type UserSetupSnapshot = {
  languagePreference?: LanguageCode;
  hasCompletedProfile: boolean;
  hasSeenTutorial: boolean;
  profile: UserProfileDraft;
};

const usersPath = 'users';

function cleanList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseList(value: unknown) {
  return Array.isArray(value) ? value.join(', ') : '';
}

function isLanguageCode(value: unknown): value is LanguageCode {
  return ['en', 'hi', 'mr', 'ta', 'te', 'bn', 'kn'].includes(String(value));
}

export async function ensureUserDocument(uid: string, email?: string | null) {
  const userRef = doc(db, usersPath, uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    await setDoc(userRef, {
      email: email ?? '',
      is_verified: false,
      has_completed_profile: false,
      has_seen_tutorial: false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return;
  }

  await setDoc(
    userRef,
    {
      email: email ?? snap.data().email ?? '',
      updated_at: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getUserSetup(uid: string): Promise<UserSetupSnapshot> {
  const userRef = doc(db, usersPath, uid);
  const medicalRef = doc(db, usersPath, uid, 'medical_profiles', 'profile');
  const contactRef = doc(db, usersPath, uid, 'emergency_contacts', 'primary');

  const [userSnap, medicalSnap, contactSnap] = await Promise.all([
    getDoc(userRef),
    getDoc(medicalRef),
    getDoc(contactRef),
  ]);

  const userData = userSnap.exists() ? userSnap.data() : {};
  const medicalData = medicalSnap.exists() ? medicalSnap.data() : {};
  const contactData = contactSnap.exists() ? contactSnap.data() : {};

  const profile: UserProfileDraft = {
    ...emptyProfileDraft,
    fullName: String(userData.full_name ?? ''),
    phone: String(userData.phone_number ?? ''),
    dateOfBirth: String(userData.dob ?? ''),
    gender: String(userData.gender ?? ''),
    address: String(userData.address ?? ''),
    city: String(userData.city ?? ''),
    pincode: String(userData.pincode ?? ''),
    bloodGroup: (medicalData.blood_group as UserProfileDraft['bloodGroup']) ?? '',
    knownAllergies: parseList(medicalData.known_allergies),
    chronicConditions: String(medicalData.chronic_conditions ?? ''),
    emergencyDoctorName: String(medicalData.emergency_doctor_name ?? ''),
    emergencyDoctorPhone: String(medicalData.emergency_doctor_phone ?? ''),
    insuranceProvider: String(medicalData.insurance_provider ?? ''),
    insurancePolicyNumber: String(medicalData.insurance_policy_number ?? ''),
    medicalNotes: String(medicalData.medical_notes ?? ''),
    emergencyContactName: String(contactData.name ?? ''),
    emergencyContactPhone: String(contactData.phone_number ?? ''),
    emergencyContactRelation: String(contactData.relationship ?? ''),
  };

  const derivedProfileComplete = Boolean(
    profile.fullName &&
      profile.phone &&
      profile.dateOfBirth &&
      profile.gender &&
      profile.bloodGroup &&
      profile.emergencyContactName &&
      profile.emergencyContactPhone,
  );

  return {
    languagePreference: isLanguageCode(userData.language_preference) ? userData.language_preference : undefined,
    hasCompletedProfile: Boolean(userData.has_completed_profile) || derivedProfileComplete,
    hasSeenTutorial: Boolean(userData.has_seen_tutorial),
    profile,
  };
}

export async function saveLanguagePreference(uid: string, language: LanguageCode) {
  await setDoc(
    doc(db, usersPath, uid),
    {
      language_preference: language,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function saveEssentialProfile(uid: string, profile: UserProfileDraft, language: LanguageCode) {
  await Promise.all([
    setDoc(
      doc(db, usersPath, uid),
      {
        phone_number: profile.phone,
        full_name: profile.fullName,
        dob: profile.dateOfBirth,
        gender: profile.gender.toLowerCase(),
        language_preference: language,
        address: profile.address,
        city: profile.city,
        pincode: profile.pincode,
        is_verified: false,
        has_completed_profile: true,
        updated_at: serverTimestamp(),
      },
      { merge: true },
    ),
    setDoc(
      doc(db, usersPath, uid, 'medical_profiles', 'profile'),
      {
        blood_group: profile.bloodGroup,
        known_allergies: cleanList(profile.knownAllergies),
        chronic_conditions: profile.chronicConditions,
        emergency_doctor_name: profile.emergencyDoctorName,
        emergency_doctor_phone: profile.emergencyDoctorPhone,
        insurance_provider: profile.insuranceProvider,
        insurance_policy_number: profile.insurancePolicyNumber,
        medical_notes: profile.medicalNotes,
      },
      { merge: true },
    ),
    setDoc(
      doc(db, usersPath, uid, 'emergency_contacts', 'primary'),
      {
        name: profile.emergencyContactName,
        relationship: profile.emergencyContactRelation,
        phone_number: profile.emergencyContactPhone,
        priority: 'primary',
        is_notified_on_sos: true,
      },
      { merge: true },
    ),
    setDoc(
      doc(db, usersPath, uid, 'settings', 'permissions'),
      {
        location_access: false,
        voice_mic_access: false,
        camera_access: false,
        background_data_access: false,
      },
      { merge: true },
    ),
  ]);
}

export async function markTutorialSeen(uid: string) {
  await setDoc(
    doc(db, usersPath, uid),
    {
      has_seen_tutorial: true,
      updated_at: serverTimestamp(),
    },
    { merge: true },
  );
}
