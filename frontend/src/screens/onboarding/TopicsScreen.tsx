// Topics Selection Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import { ChipGrid, ContinueButton, ProgressBar } from '../../components/OnboardingComponents';

const TOPICS = [
  'Artificial Intelligence & ML',
  'Startups & Business',
  'Science & Technology',
  'Design & UX',
  'Programming & DevTools',
  'Philosophy & Psychology',
  'Health & Biohacking',
  'Finance & Investing',
  'Climate & Energy',
  'Culture & Society',
  'Gaming & Entertainment',
  'Politics & Policy',
];

interface TopicsScreenProps {
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  onContinue: () => void;
}

export default function TopicsScreen({
  selectedTopics,
  onTopicsChange,
  onContinue,
}: TopicsScreenProps) {
  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      onTopicsChange(selectedTopics.filter((t) => t !== topic));
    } else {
      onTopicsChange([...selectedTopics, topic]);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProgressBar current={0} total={4} />

        <Text style={styles.title}>What interests you?</Text>
        <Text style={styles.subtitle}>
          Pick 3-5 topics you'd love to read about. You can always change these later.
        </Text>

        <ChipGrid
          options={TOPICS}
          selected={selectedTopics}
          onToggle={toggleTopic}
          style={styles.chipGrid}
        />

        <Text style={styles.count}>
          {selectedTopics.length} selected
          {selectedTopics.length > 0 && selectedTopics.length < 3
            ? ' (pick at least 3)'
            : ''}
        </Text>
      </ScrollView>

      <View style={styles.bottom}>
        <ContinueButton
          onPress={onContinue}
          disabled={selectedTopics.length < 3}
        />
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
  },
  title: {
    fontSize: 28,
    color: COLORS.text,
    ...FONTS.bold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  chipGrid: {
    marginBottom: SPACING.md,
  },
  count: {
    fontSize: 13,
    color: COLORS.textMuted,
    ...FONTS.medium,
    textAlign: 'center',
  },
  bottom: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl + 10,
  },
});
