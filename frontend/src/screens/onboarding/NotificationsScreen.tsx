// Notification Times Screen - Final onboarding step
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import {
  TimePickerList,
  ContinueButton,
  ProgressBar,
} from '../../components/OnboardingComponents';

const DEFAULT_TIMES = ['08:00', '18:00'];

// Simplified time picker — in production use @react-native-community/datetimepicker
function pickTime(): Promise<string | null> {
  return new Promise((resolve) => {
    // For now, show simple options
    Alert.alert(
      'Select Time',
      'Choose a time for your daily digest',
      [
        { text: '7:00 AM', onPress: () => resolve('07:00') },
        { text: '8:00 AM', onPress: () => resolve('08:00') },
        { text: '12:00 PM', onPress: () => resolve('12:00') },
        { text: '6:00 PM', onPress: () => resolve('18:00') },
        { text: '9:00 PM', onPress: () => resolve('21:00') },
        { text: 'Cancel', onPress: () => resolve(null), style: 'cancel' },
      ],
    );
  });
}

interface NotificationsScreenProps {
  notificationTimes: string[];
  onTimesChange: (times: string[]) => void;
  onContinue: () => void;
  onFinish: () => void;
}

export default function NotificationsScreen({
  notificationTimes,
  onTimesChange,
  onContinue,
  onFinish,
}: NotificationsScreenProps) {
  const handleAdd = async () => {
    const time = await pickTime();
    if (time) {
      onTimesChange([...notificationTimes, time]);
    }
  };

  const handleRemove = (index: number) => {
    onTimesChange(notificationTimes.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProgressBar current={3} total={4} />

        <Text style={styles.title}>Your daily digest schedule</Text>
        <Text style={styles.subtitle}>
          Set when you'd like your personalized digest to arrive.
          We'll send a notification with fresh curated content at these times.
        </Text>

        <View style={styles.timeSection}>
          <Text style={styles.sectionTitle}>Notification times</Text>
          <TimePickerList
            times={notificationTimes}
            onAdd={handleAdd}
            onRemove={handleRemove}
            maxTimes={3}
          />
        </View>

        <View style={styles.tipBox}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Morning + evening is a great combo. Start with 8 AM and 6 PM.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <ContinueButton
          onPress={onFinish}
          title={notificationTimes.length > 0 ? "Start Curating 🎉" : "Skip & Start"}
        />
        {notificationTimes.length === 0 && (
          <Text style={styles.skipNote}>
            You can always set notification times later
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    color: COLORS.text,
    ...FONTS.bold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  timeSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.text,
    ...FONTS.semibold,
    marginBottom: SPACING.md,
  },
  tipBox: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    gap: SPACING.sm,
  },
  tipIcon: {
    fontSize: 18,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.primaryLight,
    ...FONTS.regular,
    flex: 1,
    lineHeight: 20,
  },
  bottom: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl + 10,
    gap: SPACING.sm,
  },
  skipNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    ...FONTS.regular,
  },
});
