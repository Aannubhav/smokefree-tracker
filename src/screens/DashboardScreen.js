import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../theme';
import Card from '../components/ui/Card';
import StatBlock from '../components/ui/StatBlock';
import Button from '../components/ui/Button';
import { logSmoke, logUrge, deleteSmoke, getTodaySmokes, getTodaySummary, getSettings } from '../services/smokingService';

const TRIGGERS = ['Stress', 'Boredom', 'After eating', 'Coffee', 'Social', 'Anxiety', 'Habit', 'Other'];

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ count: 0, totalExpense: 0 });
  const [smokes, setSmokes] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(null); // null | 'smoke' | 'urge'
  const [note, setNote] = useState('');
  const [trigger, setTrigger] = useState('');
  const [timeSinceLast, setTimeSinceLast] = useState('');
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const [sum, list, cfg] = await Promise.all([
        getTodaySummary(user.uid),
        getTodaySmokes(user.uid),
        getSettings(user.uid),
      ]);
      setSummary(sum);
      setSmokes(list);
      setSettings(cfg);
      if (list.length) {
        const last = list[0].timestamp?.toDate ? list[0].timestamp.toDate() : new Date(list[0].timestamp);
        setTimeSinceLast(formatDistanceToNow(last, { addSuffix: false }));
      } else {
        setTimeSinceLast('');
      }
    } catch (e) {
      console.error('load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.uid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    timer.current = setInterval(() => {
      if (smokes.length) {
        const last = smokes[0].timestamp?.toDate ? smokes[0].timestamp.toDate() : new Date(smokes[0].timestamp);
        setTimeSinceLast(formatDistanceToNow(last, { addSuffix: false }));
      }
    }, 30000);
    return () => clearInterval(timer.current);
  }, [smokes]);

  const openForm = (type) => {
    setNote(''); setTrigger('');
    setForm(form === type ? null : type);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setForm(null);
    try {
      if (form === 'smoke') await logSmoke(user.uid, { note: note.trim(), trigger });
      else await logUrge(user.uid, { note: note.trim(), trigger });
      setNote(''); setTrigger('');
      await load();
    } catch (e) {
      console.error('submit error', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, date) => {
    const doDelete = async () => { await deleteSmoke(user.uid, id, date); await load(); };
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this entry?')) doDelete();
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Remove', 'Delete this smoke entry?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const currency = settings?.currency || '₹';
  const costPerCig = settings ? (settings.pricePerPack / settings.cigarettesPerPack).toFixed(1) : 0;

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greet}>{greeting()},</Text>
            <Text style={s.name}>{user.displayName || 'there'} 👋</Text>
          </View>
          <View style={s.datePill}>
            <Text style={s.dateText}>{format(new Date(), 'EEE, MMM d')}</Text>
          </View>
        </View>

        {/* Stats */}
        <Card style={s.statsCard} padding={false}>
          <View style={s.statsRow}>
            <View style={[s.statCell, { borderRightWidth: 1, borderColor: colors.border }]}>
              <StatBlock
                value={summary.count}
                label="Smoked Today"
                sub={timeSinceLast ? `Last: ${timeSinceLast} ago` : 'None yet today'}
                icon={<Ionicons name="flame" size={18} color={colors.accent} />}
                color={colors.accent}
              />
            </View>
            <View style={s.statCell}>
              <StatBlock
                value={`${currency}${summary.totalExpense.toFixed(0)}`}
                label="Spent Today"
                sub={`${currency}${costPerCig}/cigarette`}
                icon={<Ionicons name="wallet-outline" size={18} color={colors.primary} />}
                color={colors.primary}
              />
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={s.btnRow}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: form === 'smoke' ? colors.accentDark : colors.accent }]}
            onPress={() => openForm('smoke')}
            disabled={submitting}
            activeOpacity={0.82}
          >
            {submitting && form !== 'urge'
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="flame" size={22} color="#fff" />
                  <Text style={s.actionBtnText}>I Smoked</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: form === 'urge' ? colors.primaryDark : colors.primary }]}
            onPress={() => openForm('urge')}
            disabled={submitting}
            activeOpacity={0.82}
          >
            {submitting && form !== 'smoke'
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="shield-checkmark" size={22} color="#fff" />
                  <Text style={s.actionBtnText}>Resisted Urge</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* Inline Form */}
        {form && (
          <Card style={[s.formCard, { borderColor: form === 'smoke' ? colors.accent : colors.primary }]}>
            <Text style={s.formTitle}>
              {form === 'smoke' ? '🚬 Log a smoke' : '💪 Log resisted urge'}
            </Text>
            <Text style={s.formSub}>What triggered it?</Text>

            <View style={s.chips}>
              {TRIGGERS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.chip, trigger === t && {
                    backgroundColor: form === 'smoke' ? colors.accentLight : colors.primaryLight,
                    borderColor: form === 'smoke' ? colors.accent : colors.primary,
                  }]}
                  onPress={() => setTrigger(trigger === t ? '' : t)}
                >
                  <Text style={[s.chipText, trigger === t && { color: form === 'smoke' ? colors.accentDark : colors.primaryDark, fontWeight: '600' }]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={s.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note… (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={140}
            />

            <View style={s.formBtns}>
              <Button label="Cancel" variant="ghost" size="sm" onPress={() => setForm(null)} style={{ flex: 1 }} />
              <Button
                label={form === 'smoke' ? 'Log Smoke' : 'Log Resisted'}
                variant={form === 'smoke' ? 'accent' : 'primary'}
                size="sm"
                onPress={handleSubmit}
                style={{ flex: 2 }}
              />
            </View>
          </Card>
        )}

        {/* Today's Log */}
        <View style={s.section}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Today's Log</Text>
            {smokes.length > 0 && (
              <View style={s.badge}>
                <Text style={s.badgeText}>{smokes.length}</Text>
              </View>
            )}
          </View>

          {smokes.length === 0 ? (
            <Card style={s.emptyCard}>
              <Text style={s.emptyEmoji}>✨</Text>
              <Text style={s.emptyTitle}>No smokes logged today!</Text>
              <Text style={s.emptyMsg}>Stay strong. Every minute counts.</Text>
            </Card>
          ) : (
            smokes.map((item, idx) => {
              const ts = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
              return (
                <Card key={item.id} style={s.entry} accent={colors.accent}>
                  <View style={s.entryRow}>
                    <View style={s.entryLeft}>
                      <Text style={s.entryNum}>#{smokes.length - idx}</Text>
                      <View style={{ gap: 4 }}>
                        <Text style={s.entryTime}>{format(ts, 'h:mm a')}</Text>
                        {!!item.trigger && (
                          <View style={s.triggerBadge}>
                            <Text style={s.triggerText}>{item.trigger}</Text>
                          </View>
                        )}
                        {!!item.note && <Text style={s.entryNote}>{item.note}</Text>}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id, item.date)} style={s.deleteBtn}>
                      <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
  content: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  greet: { fontSize: fontSize.sm, color: colors.textSecondary },
  name: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  datePill: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
  dateText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: '500' },

  statsCard: { overflow: 'hidden' },
  statsRow: { flexDirection: 'row' },
  statCell: { flex: 1, padding: spacing.md },

  btnRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: radius.lg, minHeight: 52 },
  actionBtnText: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },

  formCard: { borderWidth: 1.5, gap: spacing.sm },
  formTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  formSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipText: { fontSize: fontSize.xs, color: colors.textSecondary },
  noteInput: { borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.sm, fontSize: fontSize.sm, color: colors.text, minHeight: 64, textAlignVertical: 'top' },
  formBtns: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },

  section: { gap: spacing.sm, marginTop: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  badge: { backgroundColor: colors.accentLight, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.accent },

  emptyCard: { alignItems: 'center', paddingVertical: spacing.xl, gap: 6, borderStyle: 'dashed' },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  emptyMsg: { fontSize: fontSize.sm, color: colors.textSecondary },

  entry: { overflow: 'visible' },
  entryRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: spacing.md },
  entryLeft: { flexDirection: 'row', gap: spacing.sm, flex: 1 },
  entryNum: { fontSize: fontSize.xs, color: colors.textMuted, width: 24, paddingTop: 2 },
  entryTime: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  triggerBadge: { alignSelf: 'flex-start', backgroundColor: colors.accentLight, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  triggerText: { fontSize: fontSize.xs, color: colors.accentDark, fontWeight: '600' },
  entryNote: { fontSize: fontSize.xs, color: colors.textSecondary },
  deleteBtn: { padding: 4 },
});
