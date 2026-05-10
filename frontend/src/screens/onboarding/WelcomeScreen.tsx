// Welcome Screen - First onboarding screen
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import { ContinueButton } from '../../components/OnboardingComponents';

const { width } = Dimensions.get('window');

interface WelcomeScreenProps {
  onContinue: () => void;
}

export default function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.hero}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✦</Text>
        </View>
        <Text style={styles.title}>Curator</Text>
        <Text style={styles.subtitle}>
          Your personal AI-powered reading companion
        </Text>
      </View>

      <View style={styles.featureList}>
        <FeatureItem icon="🎯" text="Content picked just for your interests" />
        <FeatureItem icon="📚" text="Read everything inside the app" />
        <FeatureItem icon="⏰" text="Daily digests at your schedule" />
        <FeatureItem icon="🧠" text="AI summaries — no fluff, just insight" />
      </View>

      <View style={styles.bottom}>
        <ContinueButton onPress={onContinue} title="Get Started" />
        <Text style={styles.footer}>
          Your data stays on your device. No tracking.
        </Text>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 50,
  },
  hero: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  icon: {
    fontSize: 36,
    color: COLORS.primaryLight,
  },
  title: {
    fontSize: 40,
    color: COLORS.text,
    ...FONTS.bold,
    letterSpacing: -1,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureList: {
    gap: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    flex: 1,
  },
  bottom: {
    gap: SPACING.md,
  },
  footer: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    ...FONTS.regular,
  },
});
