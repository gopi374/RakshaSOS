import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebaseconfig';
import { useApp } from '../context/AppContext';
import { colors } from '../theme/colors';

const slides = [
  {
    icon: 'radio-outline',
    title: 'Instant SOS alert',
    body: 'Trigger an emergency alert with your live location and key medical details ready for responders.',
  },
  {
    icon: 'people-outline',
    title: 'Trusted contact circle',
    body: 'Keep family, friends, and local helpers one tap away when every second matters.',
  },
  {
    icon: 'document-text-outline',
    title: 'Prepared safety profile',
    body: 'Store essentials once so future backend, ambulance, and police integrations can use clean data.',
  },
] as const;

export default function TutorialScreen({ navigation }: { navigation: any }) {
  const listRef = useRef<FlatList<(typeof slides)[number]>>(null);
  const [index, setIndex] = useState(0);
  const { width } = useWindowDimensions();
  const { completeTutorial, t } = useApp();

  const finish = async () => {
    if (auth.currentUser) {
      await completeTutorial(auth.currentUser.uid);
    }
    navigation.replace('MainTabs');
  };

  const next = () => {
    if (index === slides.length - 1) {
      finish();
      return;
    }

    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable style={styles.skipButton} onPress={finish}>
          <Text style={styles.skipText}>{t('skip')}</Text>
        </Pressable>

        <FlatList
          ref={listRef}
          data={slides}
          keyExtractor={(item) => item.title}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.visual}>
                <View style={styles.pulseOuter}>
                  <View style={styles.pulseInner}>
                    <Ionicons name={item.icon} size={58} color={colors.primary} />
                  </View>
                </View>
                <View style={styles.signalCard}>
                  <Ionicons name="location" size={18} color={colors.blue} />
                  <Text style={styles.signalText}>Location and profile ready</Text>
                </View>
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          )}
        />

        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((slide, slideIndex) => (
              <View key={slide.title} style={[styles.dot, slideIndex === index && styles.activeDot]} />
            ))}
          </View>
          <Pressable style={styles.primaryButton} onPress={next}>
            <Text style={styles.primaryButtonText}>
              {index === slides.length - 1 ? t('getStarted') : t('next')}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 8,
  },
  skipText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '800',
  },
  slide: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  visual: {
    width: '100%',
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseOuter: {
    width: 214,
    height: 214,
    borderRadius: 107,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  pulseInner: {
    width: 138,
    height: 138,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  signalCard: {
    position: 'absolute',
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  signalText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
  },
  body: {
    maxWidth: 320,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    gap: 18,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  activeDot: {
    width: 28,
    backgroundColor: colors.primary,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
