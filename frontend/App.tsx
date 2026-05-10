// App Root - Fully offline-first with settings, WebView, and digest caching
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ActivityIndicator, StyleSheet,
} from 'react-native';
import { COLORS, FONTS } from './src/utils/theme';
import { getDeviceId, isOnboardedLocally } from './src/utils/storage';
import api from './src/services/api';
import ErrorBoundary from './src/components/ErrorBoundary';
import OnboardingFlow from './src/screens/OnboardingFlow';
import DigestFeed from './src/screens/DigestFeed';
import ArticleWebView from './src/screens/ArticleWebView';
import SettingsScreen from './src/screens/SettingsScreen';

type AppState = 'loading' | 'onboarding' | 'feed' | 'webview' | 'settings';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [webViewUrl, setWebViewUrl] = useState('');
  const [webViewTitle, setWebViewTitle] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      await getDeviceId();
      const localOnboarded = await isOnboardedLocally();
      if (!localOnboarded) {
        if (mounted.current) setAppState('onboarding');
      } else {
        if (mounted.current) setAppState('feed');
      }
      await api.probeBackend();
    } catch {
      if (mounted.current) setAppState('onboarding');
    }
  };

  const handleOnboardingComplete = useCallback(() => {
    if (mounted.current) setAppState('feed');
  }, []);

  const handleOpenArticleUrl = useCallback((url: string, title: string) => {
    setWebViewUrl(url);
    setWebViewTitle(title);
    setAppState('webview');
  }, []);

  const handleCloseWebView = useCallback(() => {
    setAppState('feed');
  }, []);

  const handleOpenSettings = useCallback(() => {
    setAppState('settings');
  }, []);

  const handleCloseSettings = useCallback(() => {
    setAppState('feed');
  }, []);

  if (appState === 'loading') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>✦</Text>
        <Text style={styles.title}>Curator</Text>
        <ActivityIndicator size="small" color={COLORS.primaryLight} />
      </View>
    );
  }

  if (appState === 'onboarding') {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  if (appState === 'webview') {
    return (
      <ArticleWebView
        url={webViewUrl}
        title={webViewTitle}
        onBack={handleCloseWebView}
      />
    );
  }

  if (appState === 'settings') {
    return <SettingsScreen onBack={handleCloseSettings} />;
  }

  return (
    <ErrorBoundary>
      <DigestFeed
        onArticlePress={() => {}}
        onOpenArticleUrl={handleOpenArticleUrl}
        onOpenSettings={handleOpenSettings}
      />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  icon: { fontSize: 36, color: COLORS.primaryLight },
  title: { fontSize: 24, color: COLORS.text, ...FONTS.bold },
});
