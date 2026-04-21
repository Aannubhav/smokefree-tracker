import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../theme';
import Card from '../components/ui/Card';
import { getRecentSummaries, getSmokesForDate } from '../services/smokingService';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [daySmokes, setDaySmokes] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDay, setLoadingDay] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getRecentSummaries(user.uid, 30);
      setSummaries(data.filter((d) => d.count > 0).reverse());
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user.uid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleDay = async (dateStr) => {
    if (expanded === dateStr) { setExpanded(null); return; }
    setExpanded(dateStr);
    if (!daySmokes[dateStr]) {
      setLoadingDay(dateStr);
      try {
        const list = await getSmokesForDate(user.uid, dateStr);
        setDaySmokes((p) => ({ ...p, [dateStr]: list }));
      } catch (e) { console.error(e); }
      finally { setLoadingDay(null); }
    }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={s.root}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>History</Text>
        <Text style={s.pageSub}>Last 30 days with smokes</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {summaries.length === 0 ? (
          <Card style={s.empty}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={s.emptyTitle}>No history yet</Text>
            <Text style={s.emptySub}>Your logged smokes will appear here.</Text>
          </Card>
        ) : summaries.map((day) => (
          <Card key={day.date} style={s.dayCard}>
            <TouchableOpacity style={s.dayRow} onPress={() => toggleDay(day.date)} activeOpacity={0.75}>
              <View style={{ gap: 6 }}>
                <Text style={s.dayDate}>{format(new Date(day.date + 'T00:00:00'), 'EEE, MMM d, yyyy')}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[s.pill, { backgroundColor: colors.accentLight }]}>
                    <Ionicons name="flame" size={11} color={colors.accent} />
                    <Text style={[s.pillTxt, { color: colors.accent }]}>{day.count} smokes</Text>
                  </View>
                  <View style={[s.pill, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="wallet-outline" size={11} color={colors.primary} />
                    <Text style={[s.pillTxt, { color: colors.primary }]}>₹{day.totalExpense.toFixed(0)}</Text>
                  </View>
                </View>
              </View>
              <Ionicons name={expanded === day.date ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
            </TouchableOpacity>

            {expanded === day.date && (
              <View style={s.entries}>
                {loadingDay === day.date
                  ? <ActivityIndicator size="small" color={colors.primary} style={{ padding: spacing.md }} />
                  : (daySmokes[day.date] || []).length === 0
                  ? <Text style={s.none}>No detailed records</Text>
                  : (daySmokes[day.date] || []).map((item, i) => {
                      const ts = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
                      return (
                        <View key={item.id} style={[s.entry, i > 0 && { borderTopWidth: 1, borderColor: colors.border }]}>
                          <View style={s.dot} />
                          <View style={{ flex: 1, gap: 4 }}>
                            <Text style={s.entryTime}>{format(ts, 'h:mm a')}</Text>
                            {!!item.trigger && (
                              <View style={s.trigger}><Text style={s.triggerTxt}>{item.trigger}</Text></View>
                            )}
                            {!!item.note && <Text style={s.note}>{item.note}</Text>}
                          </View>
                        </View>
                      );
                    })}
              </View>
            )}
          </Card>
        ))}
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
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  empty: { alignItems: 'center', padding: spacing.xl, gap: 6, borderStyle: 'dashed' },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  emptySub: { fontSize: fontSize.sm, color: colors.textSecondary },
  dayCard: { overflow: 'hidden' },
  dayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  dayDate: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  pillTxt: { fontSize: fontSize.xs, fontWeight: '600' },
  entries: { borderTopWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  none: { fontSize: fontSize.sm, color: colors.textMuted, padding: spacing.md, textAlign: 'center' },
  entry: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm, gap: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, marginTop: 5 },
  entryTime: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  trigger: { alignSelf: 'flex-start', backgroundColor: colors.accentLight, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  triggerTxt: { fontSize: fontSize.xs, color: colors.accentDark, fontWeight: '600' },
  note: { fontSize: fontSize.xs, color: colors.textSecondary },
});
