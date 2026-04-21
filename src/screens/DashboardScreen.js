import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, TextInput, ActivityIndicator,
  RefreshControl, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, fontSize } from '../theme';
import {
  logSmoke, logUrge, deleteSmoke,
  getTodaySmokes, getTodaySummary, getSettings,
} from '../services/smokingService';

const TRIGGERS = ['Stress', 'Boredom', 'After eating', 'Coffee', 'Social', 'Anxiety', 'Habit', 'Other'];

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();

  const [summary, setSummary] = useState({ count: 0, totalExpense: 0 });
  const [smokes, setSmokes] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logging, setLogging] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [formType, setFormType] = useState('smoke');
  const [note, setNote] = useState('');
  const [trigger, setTrigger] = useState('');
  const [timeSinceLast, setTimeSinceLast] = useState('');
  const timerRef = useRef(null);

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
      updateTimeSince(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user.uid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const updateTimeSince = (list) => {
    if (!list?.length) { setTimeSinceLast(''); return; }
    const last = list[0].timestamp?.toDate ? list[0].timestamp.toDate() : new Date(list[0].timestamp);
    setTimeSinceLast(formatDistanceToNow(last, { addSuffix: false }));
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (smokes.length > 0) updateTimeSince(smokes);
    }, 30000);
    return () => clearInterval(timerRef.current);
  }, [smokes]);

  const openForm = (type) => {
    setNote('');
    setTrigger('');
    setFormType(type);
    setFormVisible(true);
  };

  const handleSubmit = async () => {
    setLogging(true);
    setFormVisible(false);
    try {
      if (formType === 'smoke') {
        await logSmoke(user.uid, { note: note.trim(), trigger });
      } else {
        await logUrge(user.uid, { note: note.trim(), trigger });
      }
      setNote('');
      setTrigger('');
      await load();
    } catch (e) {
      Alert.alert('Error', 'Failed to log. Check your connection.');
    } finally {
      setLogging(false);
    }
  };

  const handleDelete = (smokeId, dateStr) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Remove this smoke from your log?')) {
        deleteSmoke(user.uid, smokeId, dateStr).then(load);
      }
    } else {
      Alert.alert('Remove Entry', 'Remove this smoke from your log?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => deleteSmoke(user.uid, smokeId, dateStr).then(load) },
      ]);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const costPerCig = settings ? (settings.pricePerPack / settings.cigarettesPerPack).toFixed(1) : 0;
  const currency = settings?.currency || '₹';
  const isUrge = formType === 'urge';

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary} />
        }
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={[s.greeting, { color: colors.textSecondary }]}>{greeting()},</Text>
            <Text style={[s.userName, { color: colors.text }]}>{user.displayName || 'there'} 👋</Text>
          </View>
          <View style={[s.dateBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.dateText, { color: colors.textSecondary }]}>{format(new Date(), 'EEE, MMM d')}</Text>
          </View>
        </View>

        {/* ── Stat Cards ── */}
        <View style={s.statsRow}>
          <View style={[s.card, s.statCard, { backgroundColor: colors.primary }]}>
            <View style={[s.statIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="flame" size={18} color="#fff" />
            </View>
            <Text style={s.statValue}>{summary.count}</Text>
            <Text style={s.statLabel}>Smoked Today</Text>
            <Text style={s.statSub}>
              {timeSinceLast ? `Last: ${timeSinceLast} ago` : 'Clean so far!'}
            </Text>
          </View>

          <View style={[s.card, s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[s.statIcon, { backgroundColor: `${colors.primary}20` }]}>
              <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            </View>
            <Text style={[s.statValue, { color: colors.text }]}>{currency}{summary.totalExpense.toFixed(0)}</Text>
            <Text style={[s.statLabel, { color: colors.textSecondary }]}>Spent Today</Text>
            <Text style={[s.statSub, { color: colors.textMuted }]}>{currency}{costPerCig}/cigarette</Text>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.primary }, formVisible && formType === 'smoke' && s.actionBtnActive]}
            onPress={() => formVisible && formType === 'smoke' ? setFormVisible(false) : openForm('smoke')}
            disabled={logging}
            activeOpacity={0.8}
          >
            {logging && formType === 'smoke' ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="flame" size={20} color="#fff" />
                <Text style={s.actionBtnText}>I Smoked</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.success }, formVisible && formType === 'urge' && s.actionBtnActive]}
            onPress={() => formVisible && formType === 'urge' ? setFormVisible(false) : openForm('urge')}
            disabled={logging}
            activeOpacity={0.8}
          >
            {logging && formType === 'urge' ? (
              <ActivityIndicator color={colors.success} size="small" />
            ) : (
              <>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
                <Text style={[s.actionBtnText, { color: colors.success }]}>Resisted</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Inline Log Form ── */}
        {formVisible && (
          <View style={[s.card, s.formCard, { backgroundColor: colors.surface, borderColor: isUrge ? colors.success : colors.primary }]}>
            <Text style={[s.formTitle, { color: colors.text }]}>
              {isUrge ? '💪 What triggered the urge?' : '🚬 What triggered the smoke?'}
            </Text>

            <View style={s.chipGrid}>
              {TRIGGERS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    s.chip,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    trigger === t && { borderColor: isUrge ? colors.success : colors.primary, backgroundColor: isUrge ? `${colors.success}15` : `${colors.primary}15` },
                  ]}
                  onPress={() => setTrigger(trigger === t ? '' : t)}
                >
                  <Text style={[
                    s.chipText,
                    { color: colors.textSecondary },
                    trigger === t && { color: isUrge ? colors.success : colors.primary, fontWeight: '600' },
                  ]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[s.noteInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note… (optional)"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={140}
            />

            <View style={s.formActions}>
              <TouchableOpacity style={[s.cancelBtn, { borderColor: colors.border }]} onPress={() => setFormVisible(false)}>
                <Text style={[s.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, { backgroundColor: isUrge ? colors.success : colors.primary }]}
                onPress={handleSubmit}
              >
                <Ionicons name={isUrge ? 'shield-checkmark' : 'flame'} size={16} color="#fff" />
                <Text style={s.submitText}>{isUrge ? 'Log Resisted' : 'Log Smoke'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Today's Log ── */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.text }]}>Today's Log</Text>
          {smokes.length > 0 && (
            <View style={[s.badge, { backgroundColor: `${colors.primary}20` }]}>
              <Text style={[s.badgeText, { color: colors.primary }]}>{smokes.length}</Text>
            </View>
          )}
        </View>

        {smokes.length === 0 ? (
          <View style={[s.card, s.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={s.emptyEmoji}>✨</Text>
            <Text style={[s.emptyTitle, { color: colors.text }]}>No smokes logged today!</Text>
            <Text style={[s.emptySubtitle, { color: colors.textSecondary }]}>Stay strong. Every minute counts.</Text>
          </View>
        ) : (
          smokes.map((item, idx) => {
            const ts = item.timestamp?.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
            return (
              <View key={item.id} style={[s.card, s.entryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[s.entryDot, { backgroundColor: colors.primary }]} />
                <View style={s.entryBody}>
                  <Text style={[s.entryTime, { color: colors.text }]}>{format(ts, 'h:mm a')}</Text>
                  {!!item.trigger && (
                    <View style={[s.triggerPill, { backgroundColor: `${colors.primary}15` }]}>
                      <Text style={[s.triggerPillText, { color: colors.primary }]}>{item.trigger}</Text>
                    </View>
                  )}
                  {!!item.note && <Text style={[s.entryNote, { color: colors.textSecondary }]}>{item.note}</Text>}
                </View>
                <View style={s.entryRight}>
                  <Text style={[s.entryIndex, { color: colors.textMuted }]}>#{smokes.length - idx}</Text>
                  <TouchableOpacity onPress={() => handleDelete(item.id, item.date)} style={s.deleteBtn}>
                    <Ionicons name="trash-outline" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 40, gap: spacing.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  greeting: { fontSize: fontSize.sm },
  userName: { fontSize: fontSize.xl, fontWeight: '700' },
  dateBadge: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  dateText: { fontSize: fontSize.xs, fontWeight: '500' },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
  card: { borderRadius: radius.lg, borderWidth: 1, borderColor: 'transparent' },
  statCard: { flex: 1, padding: spacing.md, gap: 4 },
  statIcon: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: fontSize.xxxl, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  statSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.6)' },

  actionsRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: spacing.md, borderRadius: radius.lg, minHeight: 52,
  },
  actionBtnActive: { opacity: 0.85 },
  actionBtnText: { fontSize: fontSize.md, fontWeight: '700', color: '#fff' },

  formCard: {
    padding: spacing.md, borderWidth: 1.5, gap: spacing.sm,
    borderRadius: radius.lg,
  },
  formTitle: { fontSize: fontSize.md, fontWeight: '600' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  chipText: { fontSize: fontSize.xs },
  noteInput: {
    borderRadius: radius.md, borderWidth: 1, padding: spacing.sm,
    fontSize: fontSize.sm, minHeight: 64, textAlignVertical: 'top',
  },
  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  cancelBtn: { flex: 1, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  cancelText: { fontSize: fontSize.sm, fontWeight: '600' },
  submitBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md, paddingVertical: spacing.sm },
  submitText: { color: '#fff', fontSize: fontSize.sm, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.sm },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700' },
  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: fontSize.xs, fontWeight: '700' },

  emptyCard: { padding: spacing.xl, alignItems: 'center', gap: 6, borderStyle: 'dashed' },
  emptyEmoji: { fontSize: 36 },
  emptyTitle: { fontSize: fontSize.md, fontWeight: '600' },
  emptySubtitle: { fontSize: fontSize.sm, textAlign: 'center' },

  entryCard: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, gap: spacing.sm },
  entryDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  entryBody: { flex: 1, gap: 4 },
  entryTime: { fontSize: fontSize.sm, fontWeight: '600' },
  triggerPill: { alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  triggerPillText: { fontSize: fontSize.xs, fontWeight: '600' },
  entryNote: { fontSize: fontSize.xs },
  entryRight: { alignItems: 'flex-end', gap: 8 },
  entryIndex: { fontSize: fontSize.xs },
  deleteBtn: { padding: 4 },
});
