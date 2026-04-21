import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../theme';
import Card from '../components/ui/Card';
import { DualBarChart } from '../components/charts/BarChart';
import BarChart from '../components/charts/BarChart';
import {
  getTodaySummary, getTodayUrges,
  getRecentSummaries, getUrgeCountsForDays, getUrgeHourlyDistribution,
} from '../services/smokingService';

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [todaySummary, setTodaySummary] = useState({ count: 0 });
  const [todayUrges, setTodayUrges] = useState([]);
  const [weekData, setWeekData] = useState([]);
  const [hourlyUrges, setHourlyUrges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [sum, urges, smkSummaries, urgeCounts, urgeHourly] = await Promise.all([
        getTodaySummary(user.uid),
        getTodayUrges(user.uid),
        getRecentSummaries(user.uid, 7),
        getUrgeCountsForDays(user.uid, 7),
        getUrgeHourlyDistribution(user.uid),
      ]);
      setTodaySummary(sum);
      setTodayUrges(urges);
      setWeekData(smkSummaries.map((d, i) => ({
        label: format(new Date(d.date + 'T00:00:00'), 'EEE'),
        v1: d.count,
        v2: urgeCounts[i]?.count || 0,
      })));
      setHourlyUrges(urgeHourly);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user.uid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const totalResisted = todayUrges.length;
  const totalSmoked = todaySummary.count;
  const total = totalResisted + totalSmoked;
  const resistRate = total === 0 ? 0 : Math.round((totalResisted / total) * 100);

  const peakUrgeHour = hourlyUrges.indexOf(Math.max(...hourlyUrges));
  const hourData = Array.from({ length: 24 }, (_, i) => ({
    label: i % 6 === 0 ? `${i}h` : '',
    value: hourlyUrges[i] || 0,
  }));

  return (
    <View style={s.root}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Analytics</Text>
        <Text style={s.pageSub}>Urge patterns & resistance</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {/* Today's Battle */}
        <Text style={s.sectionLabel}>Today's Battle</Text>
        <View style={s.row}>
          <Card style={[s.battleCard, { borderTopWidth: 3, borderTopColor: colors.accent }]}>
            <Ionicons name="flame" size={22} color={colors.accent} />
            <Text style={[s.battleNum, { color: colors.accent }]}>{totalSmoked}</Text>
            <Text style={s.battleLabel}>Smoked</Text>
          </Card>
          <Card style={[s.battleCard, { borderTopWidth: 3, borderTopColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
            <Text style={[s.battleNum, { color: colors.primary }]}>{totalResisted}</Text>
            <Text style={s.battleLabel}>Resisted</Text>
          </Card>
          <Card style={[s.battleCard, { borderTopWidth: 3, borderTopColor: resistRate >= 50 ? colors.success : colors.warning }]}>
            <Ionicons name="trophy" size={22} color={resistRate >= 50 ? colors.success : colors.warning} />
            <Text style={[s.battleNum, { color: resistRate >= 50 ? colors.success : colors.warning }]}>{resistRate}%</Text>
            <Text style={s.battleLabel}>Resist Rate</Text>
          </Card>
        </View>

        {/* Rate Card */}
        {total > 0 && (
          <Card style={[s.rateCard, {
            backgroundColor: resistRate >= 70 ? colors.successLight : resistRate >= 40 ? colors.primaryLight : colors.dangerLight,
            borderColor: resistRate >= 70 ? `${colors.success}40` : resistRate >= 40 ? `${colors.primary}40` : `${colors.danger}40`,
          }]}>
            <Text style={[s.rateMsg, { color: resistRate >= 70 ? colors.success : resistRate >= 40 ? colors.primaryDark : colors.danger }]}>
              {resistRate >= 70 ? '🏆 Amazing! You\'re winning the battle today.' :
               resistRate >= 40 ? '💪 Keep going — you\'re making progress.' :
               '🎯 Stay strong. Every resisted urge counts.'}
            </Text>
          </Card>
        )}

        {/* 7-Day Comparison */}
        <Card style={s.card}>
          <Text style={s.cardTitle}>7-Day: Smokes vs Urges Resisted</Text>
          <DualBarChart data={weekData} color1={colors.accent} color2={colors.primary} height={130} />
          <View style={s.legendRow}>
            <View style={s.legendItem}><View style={[s.dot, { backgroundColor: colors.accent }]} /><Text style={s.legendTxt}>Smoked</Text></View>
            <View style={s.legendItem}><View style={[s.dot, { backgroundColor: colors.primary }]} /><Text style={s.legendTxt}>Resisted</Text></View>
          </View>
        </Card>

        {/* Hourly Urge Pattern */}
        <Card style={s.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={s.cardTitle}>Urge Pattern (by hour)</Text>
            {peakUrgeHour >= 0 && <Text style={s.cardSub}>Peak: {peakUrgeHour}:00</Text>}
          </View>
          <BarChart data={hourData} color={colors.primary} height={110} />
        </Card>

        {/* Today's Urge Log */}
        <Text style={s.sectionLabel}>Today's Urges</Text>
        {todayUrges.length === 0 ? (
          <Card style={s.empty}><Text style={s.emptyTxt}>No urges logged today.</Text></Card>
        ) : (
          todayUrges.map((item, i) => {
            const ts = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
            return (
              <Card key={item.id} accent={colors.primary}>
                <View style={[s.urgeRow, { padding: spacing.md }]}>
                  <View style={[s.urgeDot, { backgroundColor: colors.primary }]} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={s.urgeTime}>{format(ts, 'h:mm a')}</Text>
                    {!!item.trigger && (
                      <View style={s.badge}><Text style={s.badgeTxt}>{item.trigger}</Text></View>
                    )}
                    {!!item.note && <Text style={s.urgeNote}>{item.note}</Text>}
                  </View>
                </View>
              </Card>
            );
          })
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
  battleCard: { flex: 1, padding: spacing.md, alignItems: 'center', gap: 4 },
  battleNum: { fontSize: fontSize.xxl, fontWeight: '800' },
  battleLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '500' },
  rateCard: { padding: spacing.md, borderWidth: 1, borderRadius: radius.lg },
  rateMsg: { fontSize: fontSize.sm, fontWeight: '600', textAlign: 'center' },
  card: { padding: spacing.md, gap: spacing.md },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: fontSize.xs, color: colors.textMuted },
  legendRow: { flexDirection: 'row', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: fontSize.xs, color: colors.textMuted },
  empty: { padding: spacing.md, alignItems: 'center' },
  emptyTxt: { fontSize: fontSize.sm, color: colors.textMuted },
  urgeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  urgeDot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
  urgeTime: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.primaryLight, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  urgeNote: { fontSize: fontSize.xs, color: colors.textSecondary },
});
