// WebView-based Article Reader — shows the full original article
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, FONTS, SPACING } from '../utils/theme';

interface ArticleWebViewProps {
  url: string;
  title: string;
  onBack: () => void;
}

export default function ArticleWebView({ url, title, onBack }: ArticleWebViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Digest</Text>
        </TouchableOpacity>
        <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
        <View style={styles.spacer} />
      </View>

      {/* Loading overlay */}
      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>Could not load article</Text>
          <Text style={styles.errorUrl} numberOfLines={2}>{url}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setError(false); setLoading(true); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView */}
      {!error && (
        <WebView
          source={{ uri: url }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setError(true); setLoading(false); }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          allowsInlineMediaPlayback={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: SPACING.xl + 30, paddingBottom: SPACING.sm,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, marginRight: SPACING.sm },
  backArrow: { fontSize: 22, color: COLORS.primaryLight, ...FONTS.semibold, marginRight: SPACING.sm },
  backLabel: { fontSize: 16, color: COLORS.primaryLight, ...FONTS.medium },
  titleText: { flex: 1, fontSize: 14, color: COLORS.text, ...FONTS.medium },
  spacer: { width: 60 },
  webview: { flex: 1, backgroundColor: '#fff' },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.md },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  errorEmoji: { fontSize: 48, marginBottom: SPACING.md },
  errorText: { fontSize: 18, color: COLORS.text, ...FONTS.semibold, marginBottom: SPACING.sm },
  errorUrl: { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.lg },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontSize: 15, ...FONTS.semibold },
});
