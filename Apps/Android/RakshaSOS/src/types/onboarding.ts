export type LanguageCode = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn' | 'kn';

export type BloodGroup =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | '';

export type UserProfileDraft = {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: BloodGroup;
  knownAllergies: string;
  chronicConditions: string;
  emergencyDoctorName: string;
  emergencyDoctorPhone: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  address: string;
  city: string;
  pincode: string;
  medicalNotes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
};

export type OnboardingState = {
  hasSeenTutorial: boolean;
  hasCompletedProfile: boolean;
  profile: UserProfileDraft;
};

export const emptyProfileDraft: UserProfileDraft = {
  fullName: '',
  phone: '',
  dateOfBirth: '',
  gender: '',
  bloodGroup: '',
  knownAllergies: '',
  chronicConditions: '',
  emergencyDoctorName: '',
  emergencyDoctorPhone: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  address: '',
  city: '',
  pincode: '',
  medicalNotes: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
};
