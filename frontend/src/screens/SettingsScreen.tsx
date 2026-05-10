// Settings Screen — edit interests, notification times, sources, cache
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import {
  getSettings, saveSettings, clearCache, clearAll, AppSettings,
} from '../utils/storage';
import { ChipGrid, OptionList, TimePickerList } from '../components/OnboardingComponents';

const TOPICS = [
  'Artificial Intelligence & ML', 'Startups & Business',
  'Science & Technology', 'Design & UX',
  'Programming & DevTools', 'Philosophy & Psychology',
  'Health & Biohacking', 'Finance & Investing',
  'Climate & Energy', 'Culture & Society',
  'Gaming & Entertainment', 'Politics & Policy',
];

const SOURCES = ['HackerNews', 'Reddit', 'RSS Feeds', 'Twitter/X'];
const VOLUMES = ['Light (3-5 articles)', 'Moderate (6-10 articles)', 'Generous (11-15 articles)', 'Deep (16-20 articles)'];

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const update = useCallback(async (partial: Partial<AppSettings>) => {
    await saveSettings(partial);
    setSettings((prev) => prev ? { ...prev, ...partial } : null);
  }, []);

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Remove locally cached articles?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        await clearCache();
        Alert.alert('Done', 'Local cache cleared.');
      }},
    ]);
  };

  const handleResetAll = () => {
    Alert.alert(
      'Reset All Data',
      'This will clear all local data including onboarding settings. You will need to do onboarding again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: async () => {
          await clearAll();
          Alert.alert('Reset', 'All data cleared. Restart the app.');
        }},
      ],
    );
  };

  if (!settings) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Digest</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>Settings</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Interests */}
        <Text style={styles.sectionTitle}>Your Interests</Text>
        <ChipGrid
          options={TOPICS}
          selected={settings.topics}
          onToggle={(topic) => {
            const next = settings.topics.includes(topic)
              ? settings.topics.filter((t) => t !== topic)
              : [...settings.topics, topic];
            update({ topics: next });
          }}
        />
        <Text style={styles.hint}>{settings.topics.length} selected</Text>

        {/* Sources */}
        <Text style={styles.sectionTitle}>Content Sources</Text>
        <ChipGrid
          options={SOURCES}
          selected={settings.sources}
          onToggle={(s) => {
            const next = settings.sources.includes(s)
              ? settings.sources.filter((x) => x !== s)
              : [...settings.sources, s];
            update({ sources: next.length > 0 ? next : settings.sources });
          }}
        />

        {/* Volume */}
        <Text style={styles.sectionTitle}>Daily Volume</Text>
        <OptionList
          options={VOLUMES}
          selected={settings.contentVolume}
          onSelect={(v) => update({ contentVolume: v })}
        />

        {/* Notification Times */}
        <Text style={styles.sectionTitle}>Notification Times</Text>
        <TimePickerList
          times={settings.notificationTimes}
          onAdd={async () => {
            const times = ['07:00', '08:00', '12:00', '18:00', '21:00'];
            Alert.alert('Add Time', 'Choose notification time', [
              ...times.map((t) => ({ text: t, onPress: () => {
                const next = [...settings.notificationTimes, t];
                update({ notificationTimes: next.slice(0, 3) });
              }})),
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
          onRemove={(idx) => {
            const next = settings.notificationTimes.filter((_, i) => i !== idx);
            update({ notificationTimes: next });
          }}
          maxTimes={3}
        />

        {/* Cache */}
        <Text style={styles.sectionTitle}>Storage</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={handleClearCache}>
          <Text style={styles.actionBtnText}>🗑 Clear Cache</Text>
        </TouchableOpacity>

        {/* Danger */}
        <Text style={[styles.sectionTitle, { color: COLORS.error }]}>Danger Zone</Text>
        <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={handleResetAll}>
          <Text style={[styles.actionBtnText, { color: COLORS.error }]}>⚠ Reset All Data</Text>
        </TouchableOpacity>

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutBox}>
          <Text style={styles.aboutTitle}>Curator</Text>
          <Text style={styles.aboutVersion}>Version 1.0.0</Text>
          <Text style={styles.aboutDesc}>
            Your personal AI-powered reading companion. Content curated from HackerNews, Reddit, RSS feeds, and more.
          </Text>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.xl + 30, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm },
  backArrow: { fontSize: 22, color: COLORS.primaryLight, ...FONTS.semibold, marginRight: SPACING.sm },
  backLabel: { fontSize: 16, color: COLORS.primaryLight, ...FONTS.medium },
  topTitle: { fontSize: 18, color: COLORS.text, ...FONTS.bold, flex: 1, textAlign: 'center' },
  spacer: { width: 60 },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.lg },
  sectionTitle: { fontSize: 16, color: COLORS.text, ...FONTS.bold, marginTop: SPACING.lg, marginBottom: SPACING.md },
  hint: { fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.xs },
  actionBtn: {
    backgroundColor: COLORS.surface, padding: SPACING.md,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm,
  },
  dangerBtn: { borderColor: COLORS.error + '40', backgroundColor: COLORS.error + '10' },
  actionBtnText: { fontSize: 15, color: COLORS.text, ...FONTS.medium },
  aboutBox: {
    backgroundColor: COLORS.surface, padding: SPACING.lg,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center',
  },
  aboutTitle: { fontSize: 22, color: COLORS.text, ...FONTS.bold },
  aboutVersion: { fontSize: 13, color: COLORS.textMuted, marginTop: SPACING.xs },
  aboutDesc: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: SPACING.md, lineHeight: 20 },
});
