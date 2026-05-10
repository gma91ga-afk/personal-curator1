// In-App Article Reader - clean, modern reading experience
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../utils/theme';
import { getUserId } from '../utils/storage';
import api, { ArticleRead } from '../services/api';

const { width } = Dimensions.get('window');

interface ArticleReaderProps {
  articleId: number;
  onBack: () => void;
}

export default function ArticleReader({ articleId, onBack }: ArticleReaderProps) {
  const [article, setArticle] = useState<ArticleRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    getUserId().then(setUserId);
  }, []);

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    setLoading(true);
    try {
      const data = await api.getArticle(articleId);
      setArticle(data);
      // Mark as read
      if (userId) {
        api.markRead(articleId, userId).catch(() => {});
      }
    } catch (error) {
      console.warn('Failed to load article:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load article</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBookmark = async () => {
    if (userId) {
      try {
        await api.bookmarkArticle(articleId, userId);
      } catch (e) {}
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Digest</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleBookmark} style={styles.bookmarkBtn}>
          <Text style={styles.bookmarkIcon}>☆</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Source & metadata */}
        <View style={styles.meta}>
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceText}>{article.source}</Text>
          </View>
          {article.author && (
            <Text style={styles.author}>{article.author}</Text>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{article.title}</Text>

        {/* Summary highlight box */}
        {article.summary && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>AI Summary</Text>
            <Text style={styles.summaryText}>{article.summary}</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Full content */}
        <Text style={styles.content}>{article.content}</Text>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl + 30,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  backArrow: {
    fontSize: 22,
    color: COLORS.primaryLight,
    ...FONTS.semibold,
    marginRight: SPACING.sm,
  },
  backLabel: {
    fontSize: 16,
    color: COLORS.primaryLight,
    ...FONTS.medium,
  },
  bookmarkBtn: {
    padding: SPACING.sm,
  },
  bookmarkIcon: {
    fontSize: 24,
    color: COLORS.textMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  sourceBadge: {
    backgroundColor: COLORS.primary + '25',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  sourceText: {
    fontSize: 12,
    color: COLORS.primaryLight,
    ...FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  author: {
    fontSize: 13,
    color: COLORS.textMuted,
    ...FONTS.medium,
  },
  title: {
    fontSize: 24,
    color: COLORS.text,
    ...FONTS.bold,
    lineHeight: 32,
    marginBottom: SPACING.lg,
  },
  summaryBox: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.primaryLight,
    ...FONTS.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  summaryText: {
    fontSize: 15,
    color: COLORS.text,
    ...FONTS.regular,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  content: {
    fontSize: 16,
    color: COLORS.textSecondary,
    ...FONTS.regular,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  bottomPadding: {
    height: 100,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  backBtn: {
    padding: SPACING.md,
  },
  backBtnText: {
    color: COLORS.primaryLight,
    fontSize: 16,
    ...FONTS.medium,
  },
});
