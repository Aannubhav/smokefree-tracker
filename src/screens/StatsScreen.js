import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../theme';
import Card from '../components/ui/Card';
import BarChart from '../components/charts/BarChart';
import { getRecentSummaries, getMonthlyTotal, getHourlyDistribution, getSettings } from '../services/smokingService';

export default function StatsScreen() {
  const { user } = useAuth();
  const [monthly, setMonthly] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [prevWeek, setPrevWeek] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [mon, summaries, hrs, cfg] = await Promise.all([
        getMonthlyTotal(user.uid),
        getRecentSummaries(user.uid, 14),
        getHourlyDistribution(user.uid),
        getSettings(user.uid),
      ]);
      setMonthly(mon);
      setSettings(cfg);
      setWeekly(summaries.slice(7));
      setPrevWeek(summaries.slice(0, 7));
      setHourly(hrs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user.uid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const currency = settings?.currency || '₹';
  const thisWeekTotal = weekly.reduce((a, d) => a + d.count, 0);
  const prevWeekTotal = prevWeek.reduce((a, d) => a + d.count, 0);
  const weekChange = prevWeekTotal === 0 ? 0 : ((thisWeekTotal - prevWeekTotal) / prevWeekTotal * 100).toFixed(0);
  const weekUp = thisWeekTotal > prevWeekTotal;

  const weekData = weekly.map((d) => ({
    label: format(new Date(d.date + 'T00:00:00'), 'EEE'),
    value: d.count,
  }));

  const peakHour = hourly.indexOf(Math.max(...hourly));
  const hourData = Array.from({ length: 24 }, (_, i) => ({
    label: i % 6 === 0 ? `${i}h` : '',
    value: hourly[i] || 0,
  }));

  const dailySavings = settings ? ((settings.pricePerPack / settings.cigarettesPerPack) * 5).toFixed(0) : 0;
  const monthlySavings = (dailySavings * 30).toFixed(0);

  return (
    <View style={s.root}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Statistics</Text>
        <Text style={s.pageSub}>Your smoking patterns</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {/* Monthly Overview */}
        <Text style={s.sectionLabel}>This Month</Text>
        <View style={s.row}>
          <Card style={[s.tile, { borderTopWidth: 3, borderTopColor: colors.accent }]}>
            <Ionicons name="flame" size={20} color={colors.accent} />
            <Text style={[s.tileValue, { color: colors.accent }]}>{monthly?.totalSmokes ?? 0}</Text>
            <Text style={s.tileLabel}>Total Smokes</Text>
          </Card>
          <Card style={[s.tile, { borderTopWidth: 3, borderTopColor: colors.primary }]}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            <Text style={[s.tileValue, { color: colors.primary }]}>{currency}{(monthly?.totalExpense ?? 0).toFixed(0)}</Text>
            <Text style={s.tileLabel}>Total Spent</Text>
          </Card>
          <Card style={[s.tile, { borderTopWidth: 3, borderTopColor: colors.success }]}>
            <Ionicons name="trending-down" size={20} color={colors.success} />
            <Text style={[s.tileValue, { color: colors.success }]}>{monthly?.avgPerDay ?? 0}</Text>
            <Text style={s.tileLabel}>Daily Average</Text>
          </Card>
        </View>

        {/* Week Comparison */}
        <Card style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Last 7 Days</Text>
            {prevWeekTotal > 0 && (
              <View style={[s.changePill, { backgroundColor: weekUp ? colors.dangerLight : colors.successLight }]}>
                <Ionicons name={weekUp ? 'trending-up' : 'trending-down'} size={13} color={weekUp ? colors.danger : colors.success} />
                <Text style={[s.changeText, { color: weekUp ? colors.danger : colors.success }]}>
                  {Math.abs(weekChange)}% vs prev week
                </Text>
              </View>
            )}
          </View>
          <BarChart data={weekData} color={colors.accent} height={130} />
          <View style={s.legend}>
            <View style={[s.dot, { backgroundColor: colors.accent }]} />
            <Text style={s.legendText}>Cigarettes per day</Text>
          </View>
        </Card>

        {/* Hourly Distribution */}
        <Card style={s.card}>
          <View style={s.cardHead}>
            <Text style={s.cardTitle}>Hourly Pattern</Text>
            {peakHour >= 0 && (
              <Text style={s.cardSub}>Peak: {peakHour}:00–{peakHour + 1}:00</Text>
            )}
          </View>
          <BarChart data={hourData} color={colors.primary} height={110} />
          <View style={s.legend}>
            <View style={[s.dot, { backgroundColor: colors.primary }]} />
            <Text style={s.legendText}>Smokes in last 7 days</Text>
          </View>
        </Card>

        {/* Savings Projection */}
        {settings && (
          <Card style={[s.card, { backgroundColor: colors.successLight, borderColor: `${colors.success}40` }]}>
            <View style={s.savingsRow}>
              <View style={[s.savingsIcon, { backgroundColor: `${colors.success}25` }]}>
                <Ionicons name="leaf" size={22} color={colors.success} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.savingsTitle}>If you cut 5 cigarettes/day</Text>
                <Text style={s.savingsSub}>
                  Save {currency}{dailySavings}/day · {currency}{monthlySavings}/month
                </Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageHeader: { padding: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.background, borderBottomWidth: 1, borderColor: colors.border },
  pageTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  pageSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  tile: { flex: 1, padding: spacing.md, gap: 6, alignItems: 'flex-start' },
  tileValue: { fontSize: fontSize.xl, fontWeight: '800' },
  tileLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '500' },
  card: { padding: spacing.md, gap: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: fontSize.xs, color: colors.textMuted },
  changePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  changeText: { fontSize: fontSize.xs, fontWeight: '600' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: fontSize.xs, color: colors.textMuted },
  savingsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  savingsIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  savingsTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.success },
  savingsSub: { fontSize: fontSize.sm, color: colors.success },
});
