import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseconfig';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

export default function ProfileScreen({ navigation }: { navigation: any }) {
  const { language, onboarding, t } = useApp();
  const userEmail = auth.currentUser?.email || 'developer@example.com';
  const displayName = onboarding.profile.fullName || userEmail.split('@')[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.emailText}>{userEmail}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety profile</Text>
          <InfoRow icon="call" label="Phone" value={onboarding.profile.phone || 'Not added'} />
          <InfoRow icon="water" label="Blood group" value={onboarding.profile.bloodGroup || 'Not added'} />
          <InfoRow icon="location" label="City" value={onboarding.profile.city || 'Not added'} />
          <InfoRow
            icon="people"
            label="Emergency contact"
            value={onboarding.profile.emergencyContactName || 'Not added'}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <Pressable style={styles.menuItem} onPress={() => navigation.navigate('Language', { returnTo: 'MainTabs' })}>
            <View style={styles.menuIcon}>
              <Ionicons name="language" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>App language</Text>
              <Text style={styles.menuSubtitle}>Current: {language.toUpperCase()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => navigation.navigate('EssentialDetails', { returnTo: 'MainTabs' })}>
            <View style={styles.menuIcon}>
              <Ionicons name="create" size={20} color={colors.primary} />
            </View>
            <View style={styles.menuTextWrap}>
              <Text style={styles.menuTitle}>Edit essential details</Text>
              <Text style={styles.menuSubtitle}>Update profile draft before backend sync.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <InfoRow icon="information-circle" label="App version" value="1.0.0" />
          <InfoRow icon="shield-checkmark" label="Status" value={t('appName') + ' UI prototype'} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <View style={styles.infoCopy}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    padding: 24,
    gap: 18,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 26,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.ink,
    textTransform: 'capitalize',
  },
  emailText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '700',
    marginTop: 4,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  infoCopy: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoValue: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  menuItem: {
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  menuTextWrap: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  menuSubtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
});
