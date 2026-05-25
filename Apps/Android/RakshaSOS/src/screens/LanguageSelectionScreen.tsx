import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseconfig';
import { useApp } from '../context/AppContext';
import { resolveNextSetupRoute } from '../services/onboardingFlow';
import { colors } from '../theme/colors';
import { LanguageCode } from '../types/onboarding';

const languages: Array<{ code: LanguageCode; label: string; nativeLabel: string }> = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'Hindi' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'Marathi' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'Tamil' },
  { code: 'te', label: 'Telugu', nativeLabel: 'Telugu' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'Bengali' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'Kannada' },
];

export default function LanguageSelectionScreen({ navigation, route }: { navigation: any; route: any }) {
  const [saving, setSaving] = useState(false);
  const { language, saveUserLanguage, setLanguage, t } = useApp();

  const handleContinue = async () => {
    const returnTo = route.params?.returnTo;
    const currentUser = auth.currentUser;

    if (!currentUser) {
      navigation.replace(returnTo ?? 'EssentialDetails');
      return;
    }

    setSaving(true);
    try {
      const setup = await saveUserLanguage(currentUser.uid, language);
      navigation.replace(returnTo ?? resolveNextSetupRoute(setup));
    } catch (error) {
      alert('Could not save your language preference. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Ionicons name="language" size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t('languageTitle')}</Text>
          <Text style={styles.subtitle}>{t('languageSubtitle')}</Text>
        </View>

        <View style={styles.languageList}>
          {languages.map((item) => {
            const selected = item.code === language;

            return (
              <Pressable
                key={item.code}
                onPress={() => setLanguage(item.code)}
                style={[styles.languageCard, selected && styles.languageCardSelected]}
              >
                <View>
                  <Text style={[styles.nativeLabel, selected && styles.selectedText]}>{item.nativeLabel}</Text>
                  <Text style={styles.label}>{item.label}</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
          onPress={handleContinue}
          disabled={saving}
        >
          <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : t('continue')}</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 24,
  },
  header: {
    gap: 12,
    paddingTop: 18,
  },
  iconBadge: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  languageList: {
    gap: 12,
  },
  languageCard: {
    minHeight: 72,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FFF7F7',
  },
  nativeLabel: {
    color: colors.ink,
    fontSize: 19,
    fontWeight: '800',
  },
  selectedText: {
    color: colors.primaryDark,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  radio: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 'auto',
  },
  primaryButtonDisabled: {
    opacity: 0.72,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
