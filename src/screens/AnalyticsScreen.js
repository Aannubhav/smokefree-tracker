import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, fontSize } from '../theme';
import {
  getTodayUrges,
  getTodaySummary,
  getUrgeCountsForDays,
  getRecentSummaries,
  getUrgeHourlyDistribution,
} from '../services/smokingService';

const formatHour = (h) => {
  if (h === 0) return '12a';
  if (h < 12) return `${h}a`;
  if (h === 12) return '12p';
  return `${h - 12}p`;
};

const MiniBar = ({ value, max, color, colors }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 60 }}>
    <View
      style={{
        width: '70%',
        height: Math.max(2, (value / Math.max(max, 1)) * 60),
        backgroundColor: value === 0 ? colors.border : color,
        borderRadius: 3,
      }}
    />
  </View>
);

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [todayUrges, setTodayUrges] = useState([]);
  const [todaySummary, setTodaySummary] = useState({ count: 0 });
  const [urgeCounts7, setUrgeCounts7] = useState([]);
  const [smokeCounts7, setSmokeCounts7] = useState([]);
  const [urgeHourly, setUrgeHourly] = useState(new Array(24).fill(0));
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [urges, summary, urgeDays, smokeDays, urgeHours] = await Promise.all([
        getTodayUrges(user.uid),
        getTodaySummary(user.uid),
        getUrgeCountsForDays(user.uid, 7),
        getRecentSummaries(user.uid, 7),
        getUrgeHourlyDistribution(user.uid),
      ]);
      setTodayUrges(urges);
      setTodaySummary(summary);
      setUrgeCounts7(urgeDays);
      setSmokeCounts7(smokeDays);
      setUrgeHourly(urgeHours);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const todayUrgeCount = todayUrges.length;
  const todaySmokeCount = todaySummary.count;
  const totalToday = todayUrgeCount + todaySmokeCount;
  const resistRate = totalToday > 0 ? Math.round((todayUrgeCount / totalToday) * 100) : 0;

  const max7 = Math.max(
    ...urgeCounts7.map((d) => d.count),
    ...smokeCounts7.map((d) => d.count),
    1
  );

  const peakUrgeHour = urgeHourly.indexOf(Math.max(...urgeHourly));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.title}>Urge Analytics</Text>
        <Text style={styles.subtitle}>Track what you resist, not just what you smoke</Text>

        {/* Today's battle */}
        <Text style={styles.sectionLabel}>TODAY'S BATTLE</Text>
        <View style={styles.statRow}>
          <View style={[styles.statCard, { borderColor: colors.success }]}>
            <Text style={[styles.statBig, { color: colors.success }]}>{todayUrgeCount}</Text>
            <Text style={styles.statDesc}>Urges{'\n'}Resisted</Text>
          </View>
          <View style={[styles.statCard, { borderColor: colors.primary }]}>
            <Text style={[styles.statBig, { color: colors.primary }]}>{todaySmokeCount}</Text>
            <Text style={styles.statDesc}>Smokes{'\n'}Had</Text>
          </View>
        </View>

        {/* Resistance rate */}
        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Urge Resistance Rate Today</Text>
          <Text style={[styles.rateValue, { color: resistRate >= 50 ? colors.success : colors.warning }]}>
            {resistRate}%
          </Text>
          <View style={styles.rateBarBg}>
            <View
              style={[
                styles.rateBarFill,
                {
                  width: `${resistRate}%`,
                  backgroundColor: resistRate >= 50 ? colors.success : colors.warning,
                },
              ]}
            />
          </View>
          <Text style={styles.rateHint}>
            {totalToday === 0
              ? 'No urges or smokes logged yet today.'
              : resistRate >= 70
              ? 'Outstanding! You\'re crushing it today.'
              : resistRate >= 50
              ? 'More than half resisted — keep going!'
              : 'Tough day. Every resisted urge counts.'}
          </Text>
        </View>

        {/* 7-day comparison */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>7-Day Comparison</Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={styles.legendLabel}>Urges Resisted</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.legendLabel}>Smokes</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', height: 70, gap: 4, marginTop: spacing.sm }}>
            {urgeCounts7.map((u, i) => {
              const s = smokeCounts7[i] || { count: 0 };
              return (
                <View key={u.date} style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 1 }}>
                  <MiniBar value={u.count} max={max7} color={colors.success} colors={colors} />
                  <MiniBar value={s.count} max={max7} color={colors.primary} colors={colors} />
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', marginTop: 6 }}>
            {urgeCounts7.map((u) => (
              <Text
                key={u.date}
                style={{ flex: 1, textAlign: 'center', fontSize: 9, color: colors.textMuted }}
                numberOfLines={1}
              >
                {format(parseISO(u.date), 'EEE')}
              </Text>
            ))}
          </View>
        </View>

        {/* Hourly urge distribution */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>When Urges Hit</Text>
          <Text style={styles.chartSubtitle}>
            Last 7 days · Peak: {peakUrgeHour >= 0 && Math.max(...urgeHourly) > 0 ? formatHour(peakUrgeHour) : '–'}
          </Text>
          <View style={{ flexDirection: 'row', height: 70, gap: 1, marginTop: spacing.sm }}>
            {urgeHourly.map((val, i) => {
              const maxH = Math.max(...urgeHourly, 1);
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: 60 }}>
                  <View
                    style={{
                      width: '80%',
                      height: Math.max(2, (val / maxH) * 60),
                      backgroundColor: val === 0 ? colors.border : colors.info,
                      borderRadius: 2,
                    }}
                  />
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', marginTop: 6 }}>
            {urgeHourly.map((_, i) => (
              <Text
                key={i}
                style={{ flex: 1, textAlign: 'center', fontSize: 8, color: colors.textMuted }}
                numberOfLines={1}
              >
                {i % 6 === 0 ? formatHour(i) : ''}
              </Text>
            ))}
          </View>
        </View>

        {/* Today's urge log */}
        <Text style={styles.sectionLabel}>TODAY'S URGE LOG{todayUrgeCount > 0 ? ` (${todayUrgeCount})` : ''}</Text>

        {todayUrges.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🛡️</Text>
            <Text style={styles.emptyText}>No urges logged today</Text>
            <Text style={styles.emptySubText}>
              Use "I Resisted an Urge!" on the Dashboard to track your wins.
            </Text>
          </View>
        ) : (
          todayUrges.map((u, idx) => {
            const ts = u.timestamp?.toDate ? u.timestamp.toDate() : new Date(u.timestamp);
            return (
              <View key={u.id} style={styles.urgeEntry}>
                <View style={styles.urgeEntryLeft}>
                  <View style={styles.shieldBadge}>
                    <Text style={styles.shieldText}>💪</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.urgeTime}>{format(ts, 'h:mm a')}</Text>
                    <Text style={styles.urgeDate}>{format(ts, 'MMM d, yyyy')}</Text>
                    {!!u.trigger && (
                      <View style={styles.triggerBadge}>
                        <Text style={styles.triggerText}>{u.trigger}</Text>
                      </View>
                    )}
                    {!!u.note && <Text style={styles.urgeNote}>{u.note}</Text>}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.lg },

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },

  statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
  },
  statBig: { fontSize: fontSize.xxxl, fontWeight: '800' },
  statDesc: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 16 },

  rateCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  rateLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  rateValue: { fontSize: fontSize.xxl, fontWeight: '800', marginBottom: spacing.sm },
  rateBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  rateBarFill: { height: '100%', borderRadius: 4 },
  rateHint: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },

  chartCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: 4 },
  chartSubtitle: { fontSize: fontSize.xs, color: colors.textSecondary },

  legend: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: fontSize.xs, color: colors.textSecondary },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.sm },
  emptyText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  emptySubText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },

  urgeEntry: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  urgeEntryLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: `${colors.success}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldText: { fontSize: 18 },
  urgeTime: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  urgeDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 1 },
  triggerBadge: {
    backgroundColor: `${colors.success}20`,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  triggerText: { fontSize: fontSize.xs, color: colors.success, fontWeight: '600' },
  urgeNote: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 4 },
});
