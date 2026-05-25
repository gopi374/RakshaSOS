import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseconfig';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const { onboarding, t } = useApp();
  const userEmail = auth.currentUser?.email || 'developer@example.com';
  const displayName = onboarding.profile.fullName || userEmail.split('@')[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 55,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      alert('Failed to log out.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} contentInsetAdjustmentBehavior="automatic">
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.eyebrow}>RakshaSOS command center</Text>
            <Text style={styles.title}>Hello, {displayName}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.sosCard, { opacity: fadeAnim }]}>
          <View style={styles.sosTop}>
            <View>
              <Text style={styles.sosLabel}>Emergency mode</Text>
              <Text style={styles.sosTitle}>Hold to send SOS</Text>
            </View>
            <Ionicons name="shield-checkmark" size={30} color="#FFFFFF" />
          </View>
          <Pressable style={styles.sosButton} onPress={() => alert('SOS backend hook will connect here.')}>
            <Ionicons name="radio" size={24} color={colors.primary} />
            <Text style={styles.sosButtonText}>SOS</Text>
          </Pressable>
          <Text style={styles.sosHint}>UI ready: this button can later call the alert API with profile, location, and contacts.</Text>
        </Animated.View>

        <View style={styles.grid}>
          <View style={styles.metricCard}>
            <Ionicons name="person-circle" size={28} color={colors.blue} />
            <Text style={styles.metricValue}>{onboarding.hasCompletedProfile ? 'Ready' : 'Draft'}</Text>
            <Text style={styles.metricLabel}>Safety profile</Text>
          </View>
          <View style={styles.metricCard}>
            <Ionicons name="call" size={28} color={colors.success} />
            <Text style={styles.metricValue}>{onboarding.profile.emergencyContactName ? '1' : '0'}</Text>
            <Text style={styles.metricLabel}>SOS contacts</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prepared actions</Text>
          <View style={styles.actionRow}>
            <Ionicons name="location" size={22} color={colors.primary} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Share live location</Text>
              <Text style={styles.actionText}>Placeholder UI for future location permission and sharing flow.</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <Ionicons name="medical" size={22} color={colors.primary} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Medical snapshot</Text>
              <Text style={styles.actionText}>{onboarding.profile.medicalNotes || 'No medical notes added yet.'}</Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <Ionicons name="people" size={22} color={colors.primary} />
            <View style={styles.actionCopy}>
              <Text style={styles.actionTitle}>Trusted contact</Text>
              <Text style={styles.actionText}>
                {onboarding.profile.emergencyContactName || 'Add a trusted contact in your profile.'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t('signOut')}</Text>
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
    padding: 24,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 18,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 4,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  sosCard: {
    borderRadius: 24,
    backgroundColor: colors.primary,
    padding: 20,
    gap: 18,
  },
  sosTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sosLabel: {
    color: '#FEE2E2',
    fontSize: 13,
    fontWeight: '900',
  },
  sosTitle: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 3,
  },
  sosButton: {
    height: 86,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  sosButtonText: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '900',
  },
  sosHint: {
    color: '#FEE2E2',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 8,
  },
  metricValue: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  section: {
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 16,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCopy: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  actionText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  logoutButton: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
});
