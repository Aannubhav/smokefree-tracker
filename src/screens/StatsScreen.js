import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays, parseISO } from 'date-fns';

import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import {
  getRecentSummaries,
  getMonthlyTotal,
  getHourlyDistribution,
  getSettings,
} from '../services/smokingService';

const W = Dimensions.get('window').width;

const BarChart = ({ data, maxVal, labelFn, color, height = 120 }) => {
  if (!data || data.length === 0) return null;
  const max = maxVal || Math.max(...data, 1);
  return (
    <View style={{ height: height + 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 2 }}>
        {data.map((val, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height }}>
            <View
              style={{
                width: '80%',
                height: Math.max(2, (val / max) * height),
                backgroundColor: val === 0 ? theme.colors.border : color,
                borderRadius: 3,
              }}
            />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 2, marginTop: 6 }}>
        {data.map((_, i) => (
          <Text
            key={i}
            style={{ flex: 1, textAlign: 'center', fontSize: 9, color: theme.colors.textMuted }}
            numberOfLines={1}
          >
            {labelFn(i)}
          </Text>
        ))}
      </View>
    </View>
  );
};

export default function StatsScreen() {
  const { user } = useAuth();
  const [weekly, setWeekly] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [monthly, setMonthly] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sums, mon, hours, cfg] = await Promise.all([
        getRecentSummaries(user.uid, 7),
        getMonthlyTotal(user.uid),
        getHourlyDistribution(user.uid),
        getSettings(user.uid),
      ]);
      setWeekly(sums);
      setMonthly(mon);
      setHourly(hours);
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

  const currency = settings?.currency || '₹';
  const peakHour = hourly.indexOf(Math.max(...hourly));
  const peakLabel = peakHour >= 0 ? formatHour(peakHour) : '–';

  const weeklyTrend = () => {
    if (weekly.length < 2) return null;
    const last3 = weekly.slice(-3).reduce((s, d) => s + d.count, 0);
    const prev3 = weekly.slice(0, 3).reduce((s, d) => s + d.count, 0);
    if (prev3 === 0) return null;
    const change = ((last3 - prev3) / prev3) * 100;
    return change;
  };

  const trend = weeklyTrend();

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
        <Text style={styles.title}>Statistics</Text>
        <Text style={styles.subtitle}>Insights into your habits</Text>

        {/* Monthly overview */}
        {monthly && (
          <View style={styles.overviewRow}>
            <StatTile icon="flame" label="This Month" value={monthly.totalSmokes} unit="smokes" color={theme.colors.primary} />
            <StatTile icon="cash-outline" label="Spent" value={`${currency}${monthly.totalExpense.toFixed(0)}`} unit="30 days" color="#2196F3" />
            <StatTile icon="trending-down-outline" label="Daily Avg" value={monthly.avgPerDay} unit="per day" color={theme.colors.warning} />
          </View>
        )}

        {/* Trend */}
        {trend !== null && (
          <View style={[styles.trendCard, { borderColor: trend > 0 ? theme.colors.danger : theme.colors.success }]}>
            <Text style={styles.trendEmoji}>{trend > 0 ? '📈' : '📉'}</Text>
            <Text style={styles.trendText}>
              You're smoking{' '}
              <Text style={{ color: trend > 0 ? theme.colors.danger : theme.colors.success, fontWeight: '700' }}>
                {Math.abs(trend).toFixed(0)}% {trend > 0 ? 'more' : 'less'}
              </Text>
              {' '}compared to the start of this week.
            </Text>
          </View>
        )}

        {/* Weekly chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Last 7 Days</Text>
          <BarChart
            data={weekly.map((d) => d.count)}
            color={theme.colors.primary}
            labelFn={(i) => weekly[i] ? format(parseISO(weekly[i].date), 'EEE') : ''}
            height={100}
          />
        </View>

        {/* Hourly distribution */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>When You Smoke</Text>
          <Text style={styles.chartSubtitle}>Last 7 days · Peak: {peakLabel}</Text>
          <BarChart
            data={hourly}
            color="#2196F3"
            labelFn={(i) => i % 6 === 0 ? formatHour(i) : ''}
            height={80}
          />
        </View>

        {/* Savings potential */}
        {settings && monthly && (
          <View style={styles.savingsCard}>
            <Text style={styles.savingsTitle}>💰 If you cut 5 per day...</Text>
            <Text style={styles.savingsText}>
              You'd save{' '}
              <Text style={styles.savingsHighlight}>
                {currency}{((5 * settings.pricePerPack / settings.cigarettesPerPack) * 30).toFixed(0)}/month
              </Text>
            </Text>
            <Text style={styles.savingsText}>
              That's{' '}
              <Text style={styles.savingsHighlight}>
                {currency}{((5 * settings.pricePerPack / settings.cigarettesPerPack) * 365).toFixed(0)}/year
              </Text>
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const StatTile = ({ icon, label, value, unit, color }) => (
  <View style={styles.statTile}>
    <Text style={[styles.statTileValue, { color }]}>{value}</Text>
    <Text style={styles.statTileUnit}>{unit}</Text>
    <Text style={styles.statTileLabel}>{label}</Text>
  </View>
);

const formatHour = (h) => {
  if (h === 0) return '12a';
  if (h < 12) return `${h}a`;
  if (h === 12) return '12p';
  return `${h - 12}p`;
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },

  title: { fontSize: theme.fontSize.xxl, fontWeight: '700', color: theme.colors.text },
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },

  overviewRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  statTile: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  statTileValue: { fontSize: theme.fontSize.xl, fontWeight: '800' },
  statTileUnit: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
  statTileLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 },

  trendCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
  },
  trendEmoji: { fontSize: 28 },
  trendText: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 20 },

  chartCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chartTitle: { fontSize: theme.fontSize.lg, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  chartSubtitle: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },

  savingsCard: {
    backgroundColor: 'rgba(76,175,80,0.1)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.success,
    gap: theme.spacing.sm,
  },
  savingsTitle: { fontSize: theme.fontSize.lg, fontWeight: '700', color: theme.colors.text },
  savingsText: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  savingsHighlight: { color: theme.colors.success, fontWeight: '700' },
});
