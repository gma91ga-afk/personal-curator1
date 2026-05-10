// Tone & Depth Preferences Screen
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../../utils/theme';
import {
  OptionList,
  ChipGrid,
  ContinueButton,
  ProgressBar,
} from '../../components/OnboardingComponents';

const TONES = [
  'Analytical & Deep',
  'Casual & Conversational',
  'Concise & Practical',
  'Storytelling & Narrative',
];

const DEPTHS = [
  'Quick summaries (2-3 min reads)',
  'Balanced (5-10 min reads)',
  'Deep dives (15-30 min essays)',
  'Mixed — I like variety',
];

const CONTENT_TYPES = [
  'News & Current Events',
  'Long-form Essays',
  'Tutorials & How-tos',
  'Opinion & Analysis',
  'Research Papers',
  'Industry Newsletters',
  'Tech Release Notes',
];

interface ToneDepthScreenProps {
  personality: Record<string, string>;
  onPersonalityChange: (key: string, value: string) => void;
  selectedContentTypes: string[];
  onContentTypesChange: (types: string[]) => void;
  onContinue: () => void;
}

export default function ToneDepthScreen({
  personality,
  onPersonalityChange,
  selectedContentTypes,
  onContentTypesChange,
  onContinue,
}: ToneDepthScreenProps) {
  const toggleContentType = (type: string) => {
    if (selectedContentTypes.includes(type)) {
      onContentTypesChange(selectedContentTypes.filter((t) => t !== type));
    } else {
      onContentTypesChange([...selectedContentTypes, type]);
    }
  };

  const canContinue =
    !!personality.tone && !!personality.depth && selectedContentTypes.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProgressBar current={1} total={4} />

        <Text style={styles.title}>Your reading style</Text>
        <Text style={styles.subtitle}>
          Help us match the tone and depth you'll love.
        </Text>

        {/* Tone */}
        <Text style={styles.sectionTitle}>Preferred tone</Text>
        <OptionList
          options={TONES}
          selected={personality.tone || null}
          onSelect={(tone) => onPersonalityChange('tone', tone)}
        />

        {/* Depth */}
        <Text style={styles.sectionTitle}>Reading depth</Text>
        <OptionList
          options={DEPTHS}
          selected={personality.depth || null}
          onSelect={(depth) => onPersonalityChange('depth', depth)}
        />

        {/* Content types */}
        <Text style={styles.sectionTitle}>Content you enjoy</Text>
        <ChipGrid
          options={CONTENT_TYPES}
          selected={selectedContentTypes}
          onToggle={toggleContentType}
          style={styles.chipGrid}
        />
      </ScrollView>

      <View style={styles.bottom}>
        <ContinueButton onPress={onContinue} disabled={!canContinue} />
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
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    color: COLORS.text,
    ...FONTS.semibold,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  chipGrid: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  bottom: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl + 10,
  },
});
