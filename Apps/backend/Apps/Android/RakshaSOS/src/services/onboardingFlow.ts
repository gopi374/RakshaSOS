import { UserSetupSnapshot } from './firestoreProfile';

export function resolveNextSetupRoute(setup: UserSetupSnapshot) {
  if (!setup.languagePreference) {
    return 'Language';
  }

  if (!setup.hasCompletedProfile) {
    return 'EssentialDetails';
  }

  if (!setup.hasSeenTutorial) {
    return 'Tutorial';
  }

  return 'MainTabs';
}
