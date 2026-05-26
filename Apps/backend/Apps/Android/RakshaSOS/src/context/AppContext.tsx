import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  getUserSetup,
  markTutorialSeen,
  saveEssentialProfile,
  saveLanguagePreference,
  UserSetupSnapshot,
} from '../services/firestoreProfile';
import { emptyProfileDraft, LanguageCode, OnboardingState, UserProfileDraft } from '../types/onboarding';

const LANGUAGE_KEY = '@rakshasos/language';
const ONBOARDING_KEY = '@rakshasos/onboarding';

type TranslationKey =
  | 'appName'
  | 'tagline'
  | 'continue'
  | 'getStarted'
  | 'skip'
  | 'next'
  | 'languageTitle'
  | 'languageSubtitle'
  | 'detailsTitle'
  | 'detailsSubtitle'
  | 'saveContinue'
  | 'loginTitle'
  | 'loginSubtitle'
  | 'signupTitle'
  | 'signupSubtitle'
  | 'home'
  | 'profile'
  | 'signOut';

type AppContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => Promise<void>;
  t: (key: TranslationKey) => string;
  onboarding: OnboardingState;
  updateProfile: (patch: Partial<UserProfileDraft>) => void;
  hydrateUserSetup: (uid: string) => Promise<UserSetupSnapshot>;
  saveUserLanguage: (uid: string, language: LanguageCode) => Promise<UserSetupSnapshot>;
  completeTutorial: (uid: string) => Promise<void>;
  completeProfile: (uid: string) => Promise<UserSetupSnapshot>;
};

const defaultOnboarding: OnboardingState = {
  hasSeenTutorial: false,
  hasCompletedProfile: false,
  profile: emptyProfileDraft,
};

const en: Record<TranslationKey, string> = {
  appName: 'RakshaSOS',
  tagline: 'Emergency help, ready before you need it.',
  continue: 'Continue',
  getStarted: 'Get started',
  skip: 'Skip',
  next: 'Next',
  languageTitle: 'Choose your language',
  languageSubtitle: 'RakshaSOS will use this across alerts, guidance, and profile screens.',
  detailsTitle: 'Essential details',
  detailsSubtitle: 'Keep the basics ready so responders and trusted contacts can act faster.',
  saveContinue: 'Save and continue',
  loginTitle: 'Welcome back',
  loginSubtitle: 'Sign in to continue your safety setup',
  signupTitle: 'Create account',
  signupSubtitle: 'Join RakshaSOS and protect your circle',
  home: 'Home',
  profile: 'Profile',
  signOut: 'Sign out',
};

const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  en,
  hi: {
    ...en,
    tagline: 'Zaroorat se pehle emergency madad taiyar rakhein.',
    continue: 'Jaari rakhein',
    getStarted: 'Shuru karein',
    skip: 'Chhodein',
    next: 'Aage',
    languageTitle: 'Apni bhasha chunein',
    languageSubtitle: 'RakshaSOS alerts, guidance aur profile screens me isi bhasha ka use karega.',
    detailsTitle: 'Zaroori jankari',
    detailsSubtitle: 'Basic details taiyar rakhein taaki madad jaldi mil sake.',
    saveContinue: 'Save karein aur jaari rakhein',
    loginTitle: 'Wapas swagat hai',
    signupTitle: 'Account banayein',
  },
  mr: {
    ...en,
    tagline: 'Aapatkalin madat adhich tayar theva.',
    continue: 'Pudhe ja',
    getStarted: 'Suru kara',
    skip: 'Vagala',
    next: 'Pudhe',
    languageTitle: 'Tumchi bhasha nivda',
    languageSubtitle: 'RakshaSOS alerts, guidance ani profile madhye hi bhasha vaprel.',
    detailsTitle: 'Mahatvachi mahiti',
    saveContinue: 'Save karun pudhe ja',
  },
  ta: {
    ...en,
    tagline: 'Avasara udhavi munnaadi tayar irukkattum.',
    continue: 'Thodaravum',
    getStarted: 'Thodangu',
    skip: 'Thavir',
    next: 'Aduthu',
    languageTitle: 'Ungal mozhiya therndhedungal',
    languageSubtitle: 'RakshaSOS alerts, guidance, profile screens-il indha mozhi payanpadum.',
    detailsTitle: 'Mukkiya vivarangal',
    saveContinue: 'Save seithu thodaravum',
  },
  te: {
    ...en,
    tagline: 'Emergency sahayam munduga siddhanga unchandi.',
    continue: 'Konasaginchandi',
    getStarted: 'Prarambhinchandi',
    skip: 'Dataveyi',
    next: 'Taruvata',
    languageTitle: 'Mee bhasha enchukondi',
    languageSubtitle: 'RakshaSOS alerts, guidance, profile screens-lo ee bhasha vadutundi.',
    detailsTitle: 'Avasaramaina vivaralu',
    saveContinue: 'Save chesi konasaginchandi',
  },
  bn: {
    ...en,
    tagline: 'Proyojoner age emergency sahajyo prostut rakhun.',
    continue: 'Chaliye jan',
    getStarted: 'Shuru korun',
    skip: 'Eriye jan',
    next: 'Poroborti',
    languageTitle: 'Apnar bhasha beche nin',
    languageSubtitle: 'RakshaSOS alerts, guidance o profile screens-e ei bhasha use korbe.',
    detailsTitle: 'Proyojonio tothyo',
    saveContinue: 'Save kore chaliye jan',
  },
  kn: {
    ...en,
    tagline: 'Emergency sahayavannu munchitavagi siddha maadi.',
    continue: 'Munduvareyiri',
    getStarted: 'Prarambhisi',
    skip: 'Bidi',
    next: 'Munde',
    languageTitle: 'Nimma bhashayannu aaykemadi',
    languageSubtitle: 'RakshaSOS alerts, guidance mattu profile screens alli ee bhasha balasuttade.',
    detailsTitle: 'Agatya vivaragalu',
    saveContinue: 'Save maadi munduvareyiri',
  },
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [languageState, setLanguageState] = useState<LanguageCode>('en');
  const [onboarding, setOnboarding] = useState<OnboardingState>(defaultOnboarding);

  useEffect(() => {
    async function hydrate() {
      const [storedLanguage, storedOnboarding] = await Promise.all([
        AsyncStorage.getItem(LANGUAGE_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);

      if (storedLanguage && storedLanguage in translations) {
        setLanguageState(storedLanguage as LanguageCode);
      }

      if (storedOnboarding) {
        setOnboarding({ ...defaultOnboarding, ...JSON.parse(storedOnboarding) });
      }
    }

    hydrate().catch(() => undefined);
  }, []);

  const setLanguage = useCallback(async (nextLanguage: LanguageCode) => {
    setLanguageState(nextLanguage);
    await AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage);
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfileDraft>) => {
    setOnboarding((current) => ({
      ...current,
      profile: {
        ...current.profile,
        ...patch,
      },
    }));
  }, []);

  const applyUserSetup = useCallback((setup: UserSetupSnapshot) => {
    if (setup.languagePreference) {
      setLanguageState(setup.languagePreference);
      AsyncStorage.setItem(LANGUAGE_KEY, setup.languagePreference).catch(() => undefined);
    }

    const nextOnboarding = {
      hasSeenTutorial: setup.hasSeenTutorial,
      hasCompletedProfile: setup.hasCompletedProfile,
      profile: setup.profile,
    };

    setOnboarding(nextOnboarding);
    AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(nextOnboarding)).catch(() => undefined);
  }, []);

  const hydrateUserSetup = useCallback(
    async (uid: string) => {
      const setup = await getUserSetup(uid);
      applyUserSetup(setup);
      return setup;
    },
    [applyUserSetup],
  );

  const saveUserLanguage = useCallback(
    async (uid: string, nextLanguage: LanguageCode) => {
      await saveLanguagePreference(uid, nextLanguage);
      setLanguageState(nextLanguage);
      await AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage);
      return hydrateUserSetup(uid);
    },
    [hydrateUserSetup],
  );

  const completeTutorial = useCallback(async (uid: string) => {
    await markTutorialSeen(uid);
    setOnboarding((current) => ({ ...current, hasSeenTutorial: true }));
  }, []);

  const completeProfile = useCallback(
    async (uid: string) => {
      await saveEssentialProfile(uid, onboarding.profile, languageState);
      return hydrateUserSetup(uid);
    },
    [hydrateUserSetup, languageState, onboarding.profile],
  );

  const value = useMemo(
    () => ({
      language: languageState,
      setLanguage,
      t: (key: TranslationKey) => translations[languageState][key],
      onboarding,
      updateProfile,
      hydrateUserSetup,
      saveUserLanguage,
      completeTutorial,
      completeProfile,
    }),
    [
      completeProfile,
      completeTutorial,
      hydrateUserSetup,
      languageState,
      onboarding,
      saveUserLanguage,
      setLanguage,
      updateProfile,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = React.use(AppContext);

  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }

  return context;
}
