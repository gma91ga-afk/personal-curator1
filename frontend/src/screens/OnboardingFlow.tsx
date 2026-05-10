// Onboarding Flow Container
// Orchestrates all onboarding screens.
// ALWAYS saves the profile locally first (offline-safe).
// Then tries the backend if available (non-blocking).

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Animated,
} from 'react-native';
import { COLORS, SPACING } from '../utils/theme';
import {
  getDeviceId,
  setUserId,
  saveProfileLocally,
  setOnboardedLocally,
} from '../utils/storage';
import api from '../services/api';

import WelcomeScreen from './onboarding/WelcomeScreen';
import TopicsScreen from './onboarding/TopicsScreen';
import ToneDepthScreen from './onboarding/ToneDepthScreen';
import SourcesScreen from './onboarding/SourcesScreen';
import NotificationsScreen from './onboarding/NotificationsScreen';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0);
  const [deviceId, setDeviceId] = useState<string>('');

  // Profile state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [personality, setPersonality] = useState<Record<string, string>>({});
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>(['HackerNews', 'Reddit', 'RSS Feeds']);
  const [contentVolume, setContentVolume] = useState('Moderate (6-10 articles)');
  const [notificationTimes, setNotificationTimes] = useState<string[]>(['08:00', '18:00']);

  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const transitionTo = useCallback((nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const handleFinish = useCallback(async () => {
    if (!deviceId) return;

    const volumeMap: Record<string, string> = {
      'Light (3-5 articles)': 'light',
      'Moderate (6-10 articles)': 'moderate',
      'Generous (11-15 articles)': 'generous',
      'Deep (16-20 articles)': 'deep',
    };

    const sourceMap: Record<string, string> = {
      'HackerNews': 'hn',
      'Reddit': 'reddit',
      'RSS Feeds': 'rss',
      'Twitter/X': 'twitter',
    };

    const profile = {
      device_id: deviceId,
      topics: selectedTopics,
      personality: {
        tone: personality.tone || 'balanced',
        depth: personality.depth || 'balanced',
      },
      content_preferences: {
        sources: selectedSources.map((s) => sourceMap[s] || s.toLowerCase()),
        content_types: selectedContentTypes,
        content_volume: volumeMap[contentVolume] || 'moderate',
      },
      notification_times: notificationTimes,
    };

    // 1. Save locally FIRST — always works, no network needed
    await saveProfileLocally(profile);

    // 2. Mark onboarding complete locally
    await setOnboardedLocally();

    // 3. Try backend — best effort, don't block
    try {
      const result = await api.saveProfile(profile);
      if (result && result.user_id) {
        await setUserId(result.user_id);
      }
    } catch {
      // Backend unreachable — we already saved locally, proceed
    }

    onComplete();
  }, [deviceId, selectedTopics, personality, selectedContentTypes, selectedSources, contentVolume, notificationTimes, onComplete]);

  const handlePersonalityChange = (key: string, value: string) => {
    setPersonality((prev) => ({ ...prev, [key]: value }));
  };

  const screens = [
    <WelcomeScreen key="welcome" onContinue={() => transitionTo(1)} />,
    <TopicsScreen
      key="topics"
      selectedTopics={selectedTopics}
      onTopicsChange={setSelectedTopics}
      onContinue={() => transitionTo(2)}
    />,
    <ToneDepthScreen
      key="tone"
      personality={personality}
      onPersonalityChange={handlePersonalityChange}
      selectedContentTypes={selectedContentTypes}
      onContentTypesChange={setSelectedContentTypes}
      onContinue={() => transitionTo(3)}
    />,
    <SourcesScreen
      key="sources"
      selectedSources={selectedSources}
      onSourcesChange={setSelectedSources}
      contentVolume={contentVolume}
      onVolumeChange={setContentVolume}
      onContinue={() => transitionTo(4)}
    />,
    <NotificationsScreen
      key="notifications"
      notificationTimes={notificationTimes}
      onTimesChange={setNotificationTimes}
      onContinue={() => transitionTo(5)}
      onFinish={handleFinish}
    />,
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
        {screens[step]}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContainer: {
    flex: 1,
  },
});
