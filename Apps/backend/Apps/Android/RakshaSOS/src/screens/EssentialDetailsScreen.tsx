import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseconfig';
import { useApp } from '../context/AppContext';
import { resolveNextSetupRoute } from '../services/onboardingFlow';
import { colors } from '../theme/colors';
import { BloodGroup, UserProfileDraft } from '../types/onboarding';

const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const genderOptions = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'];

type FieldProps = {
  label: string;
  value: string;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
  onChangeText: (value: string) => void;
};

function Field({ label, value, placeholder, keyboardType = 'default', multiline, onChangeText }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

export default function EssentialDetailsScreen({ navigation, route }: { navigation: any; route: any }) {
  const [saving, setSaving] = useState(false);
  const { onboarding, updateProfile, completeProfile, t } = useApp();
  const profile = onboarding.profile;

  const setField = (field: keyof UserProfileDraft, value: string) => {
    updateProfile({ [field]: value });
  };

  const handleContinue = async () => {
    const requiredFields = [
      profile.fullName,
      profile.phone,
      profile.dateOfBirth,
      profile.gender,
      profile.bloodGroup,
      profile.emergencyContactName,
      profile.emergencyContactPhone,
    ];

    if (requiredFields.some((value) => !value)) {
      alert('Please complete name, phone, date of birth, gender, blood group, and emergency contact.');
      return;
    }

    const returnTo = route.params?.returnTo;

    if (!auth.currentUser) {
      navigation.replace(returnTo ?? 'Signup');
      return;
    }

    setSaving(true);
    try {
      const setup = await completeProfile(auth.currentUser.uid);
      navigation.replace(returnTo ?? resolveNextSetupRoute(setup));
    } catch (error) {
      alert('Could not save your essential details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} contentInsetAdjustmentBehavior="automatic">
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="id-card" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>{t('detailsTitle')}</Text>
            <Text style={styles.subtitle}>{t('detailsSubtitle')}</Text>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressTop}>
              <Text style={styles.progressTitle}>Profile readiness</Text>
              <Text style={styles.progressValue}>UI draft</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={styles.progressFill} />
            </View>
            <Text style={styles.progressHint}>These fields map cleanly to a future user profile document.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal information</Text>
            <Field
              label="Full name"
              value={profile.fullName}
              placeholder="Aarohi Sharma"
              onChangeText={(value) => setField('fullName', value)}
            />
            <Field
              label="Phone number"
              value={profile.phone}
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              onChangeText={(value) => setField('phone', value)}
            />
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Field
                  label="Date of birth"
                  value={profile.dateOfBirth}
                  placeholder="DD/MM/YYYY"
                  keyboardType="numeric"
                  onChangeText={(value) => setField('dateOfBirth', value)}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.fieldLabel}>Blood group</Text>
                <View style={styles.chipGrid}>
                  {bloodGroups.map((group) => (
                    <Pressable
                      key={group}
                      onPress={() => setField('bloodGroup', group)}
                      style={[styles.smallChip, profile.bloodGroup === group && styles.chipSelected]}
                    >
                      <Text style={[styles.smallChipText, profile.bloodGroup === group && styles.chipSelectedText]}>
                        {group}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.optionWrap}>
              {genderOptions.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setField('gender', option)}
                  style={[styles.optionChip, profile.gender === option && styles.chipSelected]}
                >
                  <Text style={[styles.optionText, profile.gender === option && styles.chipSelectedText]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location details</Text>
            <Field
              label="Home address"
              value={profile.address}
              placeholder="House, street, area"
              multiline
              onChangeText={(value) => setField('address', value)}
            />
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Field
                  label="City"
                  value={profile.city}
                  placeholder="Mumbai"
                  onChangeText={(value) => setField('city', value)}
                />
              </View>
              <View style={styles.rowItem}>
                <Field
                  label="Pincode"
                  value={profile.pincode}
                  placeholder="400001"
                  keyboardType="numeric"
                  onChangeText={(value) => setField('pincode', value)}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency contact</Text>
            <Field
              label="Contact name"
              value={profile.emergencyContactName}
              placeholder="Meera Sharma"
              onChangeText={(value) => setField('emergencyContactName', value)}
            />
            <Field
              label="Contact phone"
              value={profile.emergencyContactPhone}
              placeholder="+91 91234 56789"
              keyboardType="phone-pad"
              onChangeText={(value) => setField('emergencyContactPhone', value)}
            />
            <Field
              label="Relation"
              value={profile.emergencyContactRelation}
              placeholder="Mother, friend, partner"
              onChangeText={(value) => setField('emergencyContactRelation', value)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical notes</Text>
            <Field
              label="Known allergies"
              value={profile.knownAllergies}
              placeholder="Penicillin, dust"
              onChangeText={(value) => setField('knownAllergies', value)}
            />
            <Field
              label="Chronic conditions"
              value={profile.chronicConditions}
              placeholder="Asthma, diabetes, none"
              onChangeText={(value) => setField('chronicConditions', value)}
            />
            <Field
              label="Medicines or extra notes"
              value={profile.medicalNotes}
              placeholder="Example: allergic to penicillin, asthma inhaler in bag"
              multiline
              onChangeText={(value) => setField('medicalNotes', value)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Doctor and insurance</Text>
            <Field
              label="Emergency doctor name"
              value={profile.emergencyDoctorName}
              placeholder="Dr. Sharma"
              onChangeText={(value) => setField('emergencyDoctorName', value)}
            />
            <Field
              label="Emergency doctor phone"
              value={profile.emergencyDoctorPhone}
              placeholder="+91 88888 88888"
              keyboardType="phone-pad"
              onChangeText={(value) => setField('emergencyDoctorPhone', value)}
            />
            <Field
              label="Insurance provider"
              value={profile.insuranceProvider}
              placeholder="LIC Health"
              onChangeText={(value) => setField('insuranceProvider', value)}
            />
            <Field
              label="Policy number"
              value={profile.insurancePolicyNumber}
              placeholder="POLICY123456"
              onChangeText={(value) => setField('insurancePolicyNumber', value)}
            />
          </View>

          <Pressable style={[styles.primaryButton, saving && styles.primaryButtonDisabled]} onPress={handleContinue} disabled={saving}>
            <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : t('saveContinue')}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 24,
    gap: 18,
  },
  header: {
    gap: 12,
    paddingTop: 8,
  },
  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  title: {
    color: colors.ink,
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '600',
  },
  progressCard: {
    borderRadius: 18,
    backgroundColor: colors.navy,
    padding: 18,
    gap: 12,
  },
  progressTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  progressValue: {
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  progressFill: {
    width: '62%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  progressHint: {
    color: '#DBEAFE',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  section: {
    borderRadius: 20,
    backgroundColor: colors.surface,
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
  field: {
    gap: 8,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  textArea: {
    minHeight: 92,
    paddingTop: 14,
    lineHeight: 21,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  smallChip: {
    minWidth: 42,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.line,
  },
  smallChipText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    minHeight: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  chipSelectedText: {
    color: '#FFFFFF',
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
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
