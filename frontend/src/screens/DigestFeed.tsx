// Main Digest Feed Screen - shows personalized content
// Loads from local cache first (instant), refreshes data in background
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import {
  getDeviceId,
  getUserId,
  getDigestCache,
  saveDigestCache,
} from '../utils/storage';
import api, { DigestItem } from '../services/api';

interface DigestFeedProps {
  onArticlePress: (articleId: number) => void;
  onOpenArticleUrl: (url: string, title: string) => void;
  onOpenSettings: () => void;
}

const SOURCE_ICONS: Record<string, string> = {
  hackernews: '⬡',
  reddit: '⟐',
  rss: '◈',
  twitter: '⟡',
};

export default function DigestFeed({ onArticlePress, onOpenArticleUrl, onOpenSettings }: DigestFeedProps) {
  const [digest, setDigest] = useState<DigestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [userId, setUserId] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<string>('');
  const [cachedTime, setCachedTime] = useState<string>('');

  const deviceIdRef = useRef(deviceId);
  deviceIdRef.current = deviceId;

  // Load device ID and show cached digest immediately
  useEffect(() => {
    getDeviceId().then((id) => {
      setDeviceId(id);
    });
    getUserId().then(setUserId);

    // Show cached digest instantly (sub-millisecond — from local storage)
    getDigestCache().then((cached) => {
      if (cached && cached.length > 0) {
        setDigest(cached as DigestItem[]);
        setLoading(false);
        setCachedTime('Cached');
      }
    });
  }, []);

  // Listen for app foreground to refresh in background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && deviceIdRef.current) {
        // App returned to foreground — refresh in background, keep showing cache
        silentRefresh(deviceIdRef.current);
      }
    });
    return () => sub.remove();
  }, []);

  // Once deviceId is known, fetch fresh data in background (if no cache hit)
  useEffect(() => {
    if (deviceId && digest.length === 0) {
      loadDigest();
    }
  }, [deviceId]);

  const silentRefresh = async (id: string) => {
    console.log('[DigestFeed] silent background refresh');
    const data = await api.generateDigest(id);
    if (data.items && data.items.length > 0) {
      setDigest(data.items as DigestItem[]);
      setIsOffline(false);
      await saveDigestCache(data.items);
    }
  };

  const loadDigest = async () => {
    const id = deviceIdRef.current;
    if (!id) return;
    setLoading(true);
    setFetchStatus('Curating your digest... this takes 3-4 minutes on first load');
    const data = await api.generateDigest(id);
    if (data.items && data.items.length > 0) {
      setDigest(data.items as DigestItem[]);
      setIsOffline(false);
      await saveDigestCache(data.items);
      setFetchStatus('');
    } else {
      // No articles — check cache
      const cached = await getDigestCache();
      if (cached && cached.length > 0) {
        setDigest(cached as DigestItem[]);
        setIsOffline(data.items.length === 0);
        setFetchStatus('');
        setCachedTime('Cached');
      } else {
        setIsOffline(true);
        setFetchStatus('');
      }
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    const id = deviceIdRef.current;
    if (!id) return;
    setRefreshing(true);
    setFetchStatus('Refreshing...');
    const data = await api.generateDigest(id, true);
    if (data.items && data.items.length > 0) {
      setDigest(data.items as DigestItem[]);
      setIsOffline(false);
      await saveDigestCache(data.items);
    }
    setFetchStatus('');
    setRefreshing(false);
  }, []);

  const handleFetchPress = useCallback(async () => {
    const id = deviceIdRef.current;
    if (!id) {
      setFetchStatus('Please wait, initializing...');
      return;
    }
    setLoading(true);
    setFetchStatus('Curating your digest... this takes 3-4 minutes on first load');
    const data = await api.generateDigest(id, true);
    if (data.items && data.items.length > 0) {
      setDigest(data.items as DigestItem[]);
      setIsOffline(false);
      await saveDigestCache(data.items);
      setFetchStatus('');
    } else {
      const cached = await getDigestCache();
      if (cached && cached.length > 0) {
        setDigest(cached as DigestItem[]);
      }
      setFetchStatus('');
    }
    setLoading(false);
  }, []);

  const handleBookmark = async (articleId: number) => {
    if (!userId) return;
    try {
      await api.bookmarkArticle(articleId, userId);
      setDigest((prev) =>
        prev.map((item) =>
          item.id === articleId ? { ...item, bookmarked: !item.bookmarked } : item
        )
      );
    } catch (_) {}
  };

  const renderItem = ({ item }: { item: DigestItem }) => {
    const sourceIcon = SOURCE_ICONS[item.source] || '◈';
    const hasExternalUrl = !!(item as any).external_url;
    return (
      <TouchableOpacity
        style={[styles.card, item.read && styles.cardRead]}
        onPress={() => onArticlePress(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.sourceRow}>
          <Text style={styles.sourceIcon}>{sourceIcon}</Text>
          <Text style={styles.sourceLabel}>{item.source}</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>
              {Math.round(item.relevance_score * 100)}%
            </Text>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={3}>{item.title}</Text>
        <Text style={styles.summary} numberOfLines={3}>{item.summary}</Text>

        <View style={styles.footer}>
          <Text style={styles.author}>{item.author || 'Unknown'}</Text>
          <View style={styles.actions}>
            {hasExternalUrl && (
              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => onOpenArticleUrl((item as any).external_url, item.title)}
              >
                <Text style={styles.linkBtnText}>Read Original ↗</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => handleBookmark(item.id)}
            >
              <Text style={[styles.actionIcon, item.bookmarked && styles.actionActive]}>
                {item.bookmarked ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{fetchStatus || 'Starting...'}</Text>
      </View>
    );
  }

  if (digest.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>No content yet</Text>
        <Text style={styles.emptyText}>
          {isOffline
            ? 'Could not reach the server. Make sure the backend is running at 192.168.100.166:8000'
            : 'No articles found yet. Try fetching a fresh digest.'}
        </Text>
        {fetchStatus ? (
          <Text style={styles.loadingText}>{fetchStatus}</Text>
        ) : (
          <TouchableOpacity style={styles.refreshBtn} onPress={handleFetchPress}>
            <Text style={styles.refreshBtnText}>Fetch My Digest</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Your Digest</Text>
          {cachedTime ? (
            <Text style={styles.headerSub}>📦 {cachedTime} — {digest.length} articles</Text>
          ) : isOffline ? (
            <Text style={styles.headerSubOffline}>⚠ Backend offline</Text>
          ) : (
            <Text style={styles.headerSub}>{digest.length} curated articles</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={onOpenSettings}>
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleFetchPress}>
            <Text style={styles.iconText}>⟳</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={digest}
        renderItem={renderItem}
        keyExtractor={(item) => (item.id || Math.random()).toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg + 30, paddingBottom: SPACING.md,
  },
  headerTitle: { fontSize: 28, color: COLORS.text, ...FONTS.bold },
  headerSub: { fontSize: 13, color: COLORS.textMuted, ...FONTS.regular, marginTop: 2 },
  headerSubOffline: { fontSize: 12, color: COLORS.warning, ...FONTS.medium, marginTop: 2, maxWidth: 240 },
  headerActions: { flexDirection: 'row', gap: SPACING.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 18 },
  list: { padding: SPACING.md, paddingBottom: 100 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardRead: { opacity: 0.7 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm, gap: SPACING.xs },
  sourceIcon: { fontSize: 14, color: COLORS.primaryLight },
  sourceLabel: { fontSize: 12, color: COLORS.textMuted, ...FONTS.medium, textTransform: 'uppercase', letterSpacing: 0.5 },
  scoreBadge: { backgroundColor: COLORS.success + '20', paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.sm, marginLeft: 'auto' },
  scoreText: { fontSize: 11, color: COLORS.success, ...FONTS.semibold },
  title: { fontSize: 16, color: COLORS.text, ...FONTS.semibold, lineHeight: 22, marginBottom: SPACING.sm },
  summary: { fontSize: 14, color: COLORS.textSecondary, ...FONTS.regular, lineHeight: 20, marginBottom: SPACING.md },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { fontSize: 12, color: COLORS.textMuted, ...FONTS.medium },
  actions: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  linkBtn: { backgroundColor: COLORS.primary + '30', paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.sm },
  linkBtnText: { fontSize: 12, color: COLORS.primaryLight, ...FONTS.semibold },
  actionBtn: { padding: SPACING.xs },
  actionIcon: { fontSize: 20, color: COLORS.textMuted },
  actionActive: { color: COLORS.warning },
  loadingText: { fontSize: 14, color: COLORS.textSecondary, marginTop: SPACING.md, textAlign: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyTitle: { fontSize: 20, color: COLORS.text, ...FONTS.semibold, marginBottom: SPACING.sm },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.lg },
  refreshBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.lg },
  refreshBtnText: { color: '#fff', fontSize: 15, ...FONTS.semibold },
});
