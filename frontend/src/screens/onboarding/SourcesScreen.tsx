// Content Sources Screen
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
  ChipGrid,
  OptionList,
  ContinueButton,
  ProgressBar,
} from '../../components/OnboardingComponents';

const SOURCES = [
  'HackerNews',
  'Reddit',
  'RSS Feeds',
  'Twitter/X',
];

const VOLUMES = [
  'Light (3-5 articles)',
  'Moderate (6-10 articles)',
  'Generous (11-15 articles)',
  'Deep (16-20 articles)',
];

interface SourcesScreenProps {
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
  contentVolume: string;
  onVolumeChange: (volume: string) => void;
  onContinue: () => void;
}

export default function SourcesScreen({
  selectedSources,
  onSourcesChange,
  contentVolume,
  onVolumeChange,
  onContinue,
}: SourcesScreenProps) {
  const toggleSource = (source: string) => {
    if (selectedSources.includes(source)) {
      onSourcesChange(selectedSources.filter((s) => s !== source));
    } else {
      onSourcesChange([...selectedSources, source]);
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
        <ProgressBar current={2} total={4} />

        <Text style={styles.title}>Where should we look?</Text>
        <Text style={styles.subtitle}>
          Choose your content sources. We use free APIs and RSS — no paid subscriptions needed.
        </Text>

        <Text style={styles.sectionTitle}>Content sources</Text>
        <ChipGrid
          options={SOURCES}
          selected={selectedSources}
          onToggle={toggleSource}
          style={styles.chipGrid}
        />

        <Text style={styles.sectionTitle}>Daily volume</Text>
        <OptionList
          options={VOLUMES}
          selected={contentVolume}
          onSelect={onVolumeChange}
        />
      </ScrollView>

      <View style={styles.bottom}>
        <ContinueButton
          onPress={onContinue}
          disabled={selectedSources.length === 0}
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
    marginBottom: SPACING.md,
  },
  bottom: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl + 10,
  },
});
