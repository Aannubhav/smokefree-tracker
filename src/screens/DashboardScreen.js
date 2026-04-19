import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, formatDistanceToNow } from 'date-fns';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import {
  logSmoke,
  deleteSmoke,
  getTodaySmokes,
  getTodaySummary,
  getSettings,
} from '../services/smokingService';

const TRIGGERS = ['Stress', 'Boredom', 'After eating', 'Coffee', 'Social', 'Anxiety', 'Habit', 'Other'];

export default function DashboardScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = useState({ count: 0, totalExpense: 0 });
  const [smokes, setSmokes] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [logging, setLogging] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const updateTimeSince = (list) => {
    if (!list || list.length === 0) {
      setTimeSinceLast('');
      return;
    }
    const last = list[0].timestamp?.toDate ? list[0].timestamp.toDate() : new Date(list[0].timestamp);
    setTimeSinceLast(formatDistanceToNow(last, { addSuffix: false }));
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (smokes.length > 0) updateTimeSince(smokes);
    }, 30000);
    return () => clearInterval(timerRef.current);
  }, [smokes]);

  const handleLogSmoke = async () => {
    setLogging(true);
    setModalVisible(false);
    try {
      await logSmoke(user.uid, { note: note.trim(), trigger });
      setNote('');
      setTrigger('');
      await load();
    } catch (e) {
      Alert.alert('Error', 'Failed to log smoke. Check your connection.');
    } finally {
      setLogging(false);
    }
  };

  const handleDelete = (smokeId, dateStr) => {
    Alert.alert('Remove Entry', 'Remove this smoke from your log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteSmoke(user.uid, smokeId, dateStr);
          await load();
        },
      },
    ]);
  };

  const openModal = () => {
    setNote('');
    setTrigger('');
    setModalVisible(true);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const costPerCig = settings
    ? (settings.pricePerPack / settings.cigarettesPerPack).toFixed(1)
    : 0;

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.colors.primary} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user.displayName || 'there'} 👋</Text>
          </View>
          <Text style={styles.dateText}>{format(new Date(), 'EEE, MMM d')}</Text>
        </View>

        {/* Stats cards */}
        <View style={styles.statsRow}>
          <LinearGradient
            colors={['#FF6B35', '#FF4500']}
            style={[styles.statsCard, { flex: 1.2 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.statsValue}>{summary.count}</Text>
            <Text style={styles.statsLabel}>Smoked Today</Text>
            {timeSinceLast ? (
              <Text style={styles.statsSubLabel}>Last: {timeSinceLast} ago</Text>
            ) : (
              <Text style={styles.statsSubLabel}>No smokes today</Text>
            )}
          </LinearGradient>

          <LinearGradient
            colors={['#1A1A3E', '#2A2A5E']}
            style={[styles.statsCard, { flex: 1 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.statsValue}>
              {settings?.currency || '₹'}{summary.totalExpense.toFixed(0)}
            </Text>
            <Text style={styles.statsLabel}>Spent Today</Text>
            <Text style={styles.statsSubLabel}>{settings?.currency || '₹'}{costPerCig}/cig</Text>
          </LinearGradient>
        </View>

        {/* Log Smoke Button */}
        <TouchableOpacity
          style={[styles.logBtn, logging && styles.logBtnDisabled]}
          onPress={openModal}
          disabled={logging}
          activeOpacity={0.8}
        >
          {logging ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Ionicons name="add-circle" size={32} color="#fff" />
              <Text style={styles.logBtnText}>I Just Smoked</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Today's log */}
        <Text style={styles.sectionTitle}>
          Today's Log{smokes.length > 0 ? ` (${smokes.length})` : ''}
        </Text>

        {smokes.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyText}>No smokes logged today!</Text>
            <Text style={styles.emptySubText}>Stay strong. Every minute counts.</Text>
          </View>
        ) : (
          smokes.map((s, idx) => {
            const ts = s.timestamp?.toDate ? s.timestamp.toDate() : new Date(s.timestamp);
            return (
              <View key={s.id} style={styles.entryCard}>
                <View style={styles.entryLeft}>
                  <Text style={styles.entryIndex}>#{smokes.length - idx}</Text>
                  <View>
                    <Text style={styles.entryTime}>{format(ts, 'h:mm a')}</Text>
                    {!!s.trigger && (
                      <View style={styles.triggerBadge}>
                        <Text style={styles.triggerText}>{s.trigger}</Text>
                      </View>
                    )}
                    {!!s.note && <Text style={styles.entryNote}>{s.note}</Text>}
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(s.id, s.date)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={16} color={theme.colors.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Log Smoke Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Log a Smoke</Text>
            <Text style={styles.modalSubtitle}>What triggered the urge?</Text>

            <View style={styles.triggerGrid}>
              {TRIGGERS.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.triggerChip, trigger === t && styles.triggerChipActive]}
                  onPress={() => setTrigger(trigger === t ? '' : t)}
                >
                  <Text style={[styles.triggerChipText, trigger === t && styles.triggerChipTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.noteInput}
              value={note}
              onChangeText={setNote}
              placeholder="Optional note…"
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={140}
            />

            <TouchableOpacity style={styles.modalLogBtn} onPress={handleLogSmoke}>
              <Ionicons name="flame" size={20} color="#fff" />
              <Text style={styles.modalLogBtnText}>Log Smoke</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.lg },
  greeting: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  userName: { fontSize: theme.fontSize.xl, fontWeight: '700', color: theme.colors.text },
  dateText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  statsCard: { borderRadius: theme.radius.lg, padding: theme.spacing.md, minHeight: 100, justifyContent: 'center' },
  statsValue: { fontSize: theme.fontSize.xxxl, fontWeight: '800', color: '#fff' },
  statsLabel: { fontSize: theme.fontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statsSubLabel: { fontSize: theme.fontSize.xs, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  logBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 70,
  },
  logBtnDisabled: { opacity: 0.6 },
  logBtnText: { fontSize: theme.fontSize.xl, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.md },

  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 40, marginBottom: theme.spacing.sm },
  emptyText: { fontSize: theme.fontSize.lg, fontWeight: '600', color: theme.colors.text },
  emptySubText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },

  entryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  entryLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md, flex: 1 },
  entryIndex: { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, width: 24, paddingTop: 2 },
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
  entryNote: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4, maxWidth: 220 },
  deleteBtn: { padding: theme.spacing.sm },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : theme.spacing.lg,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: { fontSize: theme.fontSize.xl, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  modalSubtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  triggerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  triggerChip: {
    borderRadius: theme.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceHigh,
  },
  triggerChipActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(255,107,53,0.15)' },
  triggerChipText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  triggerChipTextActive: { color: theme.colors.primary, fontWeight: '600' },
  noteInput: {
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalLogBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  modalLogBtnText: { color: '#fff', fontSize: theme.fontSize.lg, fontWeight: '700' },
  cancelBtn: { padding: theme.spacing.md, alignItems: 'center' },
  cancelText: { color: theme.colors.textSecondary, fontSize: theme.fontSize.md },
});
