import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { getRecentSummaries, getSmokesForDate, getSettings } from '../services/smokingService';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [expandedSmokes, setExpandedSmokes] = useState([]);
  const [loadingExpand, setLoadingExpand] = useState(false);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sums, cfg] = await Promise.all([
        getRecentSummaries(user.uid, 30),
        getSettings(user.uid),
      ]);
      setSummaries(sums.filter((s) => s.count > 0).reverse());
      setSettings(cfg);
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

  const toggleExpand = async (dateStr) => {
    if (expanded === dateStr) {
      setExpanded(null);
      setExpandedSmokes([]);
      return;
    }
    setExpanded(dateStr);
    setLoadingExpand(true);
    try {
      const list = await getSmokesForDate(user.uid, dateStr);
      setExpandedSmokes(list);
    } finally {
      setLoadingExpand(false);
    }
  };

  const labelDate = (dateStr) => {
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'EEE, MMM d');
  };

  const currency = settings?.currency || '₹';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
            tintColor={theme.colors.primary}
          />
        }
      >
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Last 30 days</Text>

        {summaries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No history yet</Text>
            <Text style={styles.emptySubText}>Start logging smokes on the Dashboard.</Text>
          </View>
        ) : (
          summaries.map((s) => (
            <View key={s.date}>
              <TouchableOpacity
                style={[styles.dayCard, expanded === s.date && styles.dayCardExpanded]}
                onPress={() => toggleExpand(s.date)}
                activeOpacity={0.7}
              >
                <View style={styles.dayLeft}>
                  <Text style={styles.dayLabel}>{labelDate(s.date)}</Text>
                  <Text style={styles.dayDateFull}>{format(parseISO(s.date), 'yyyy-MM-dd')}</Text>
                </View>
                <View style={styles.dayRight}>
                  <View style={styles.countBadge}>
                    <Ionicons name="flame" size={12} color={theme.colors.primary} />
                    <Text style={styles.countText}>{s.count}</Text>
                  </View>
                  <Text style={styles.expenseText}>
                    {currency}{s.totalExpense.toFixed(0)}
                  </Text>
                  <Ionicons
                    name={expanded === s.date ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.colors.textMuted}
                  />
                </View>
              </TouchableOpacity>

              {expanded === s.date && (
                <View style={styles.expandedPanel}>
                  {loadingExpand ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : expandedSmokes.length === 0 ? (
                    <Text style={styles.noEntries}>No entries found.</Text>
                  ) : (
                    expandedSmokes.map((smoke, idx) => {
                      const ts = smoke.timestamp?.toDate
                        ? smoke.timestamp.toDate()
                        : new Date(smoke.timestamp);
                      return (
                        <View key={smoke.id} style={styles.smokeEntry}>
                          <View style={styles.timelineDot} />
                          <View style={styles.entryBody}>
                            <Text style={styles.entryTime}>{format(ts, 'h:mm a')}</Text>
                            {!!smoke.trigger && (
                              <View style={styles.triggerBadge}>
                                <Text style={styles.triggerText}>{smoke.trigger}</Text>
                              </View>
                            )}
                            {!!smoke.note && (
                              <Text style={styles.entryNote}>{smoke.note}</Text>
                            )}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },

  title: { fontSize: theme.fontSize.xxl, fontWeight: '700', color: theme.colors.text },
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyText: { fontSize: theme.fontSize.lg, color: theme.colors.text, fontWeight: '600' },
  emptySubText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 4 },

  dayCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dayCardExpanded: { borderColor: theme.colors.primary, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },

  dayLeft: {},
  dayLabel: { fontSize: theme.fontSize.md, fontWeight: '600', color: theme.colors.text },
  dayDateFull: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },

  dayRight: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countText: { fontSize: theme.fontSize.md, fontWeight: '700', color: theme.colors.primary },
  expenseText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },

  expandedPanel: {
    backgroundColor: theme.colors.surfaceHigh,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: theme.colors.primary,
    borderBottomLeftRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  noEntries: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },

  smokeEntry: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md, marginBottom: 12 },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: 5,
    flexShrink: 0,
  },
  entryBody: { flex: 1 },
  entryTime: { fontSize: theme.fontSize.md, fontWeight: '600', color: theme.colors.text },
  triggerBadge: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: theme.radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  triggerText: { fontSize: theme.fontSize.xs, color: theme.colors.primary, fontWeight: '600' },
  entryNote: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 },
});
