import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { getSettings, saveSettings } from '../services/smokingService';

const CURRENCIES = ['₹', '$', '€', '£', '¥'];

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const cfg = await getSettings(user.uid);
      setSettings(cfg);
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleSave = async () => {
    if (!settings) return;
    const price = parseFloat(settings.pricePerPack);
    const count = parseInt(settings.cigarettesPerPack);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid', 'Enter a valid price per pack.');
      return;
    }
    if (isNaN(count) || count <= 0) {
      Alert.alert('Invalid', 'Enter a valid cigarettes per pack number.');
      return;
    }
    setSaving(true);
    try {
      await saveSettings(user.uid, {
        ...settings,
        pricePerPack: price,
        cigarettesPerPack: count,
      });
      Alert.alert('Saved', 'Settings updated successfully.');
    } catch {
      Alert.alert('Error', 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading || !settings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const costPerCig = (
    parseFloat(settings.pricePerPack) / parseInt(settings.cigarettesPerPack)
  ).toFixed(2);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.displayName || user.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user.displayName || 'User'}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        </View>

        {/* Cigarette settings */}
        <Text style={styles.sectionTitle}>Cigarette Pricing</Text>
        <View style={styles.card}>
          <Row label="Price per Pack">
            <TextInput
              style={styles.numInput}
              value={String(settings.pricePerPack)}
              onChangeText={(v) => setSettings((s) => ({ ...s, pricePerPack: v }))}
              keyboardType="numeric"
              placeholderTextColor={theme.colors.textMuted}
            />
          </Row>
          <Divider />
          <Row label="Cigarettes per Pack">
            <TextInput
              style={styles.numInput}
              value={String(settings.cigarettesPerPack)}
              onChangeText={(v) => setSettings((s) => ({ ...s, cigarettesPerPack: v }))}
              keyboardType="numeric"
              placeholderTextColor={theme.colors.textMuted}
            />
          </Row>
          <Divider />
          <Row label="Currency">
            <View style={styles.currencyRow}>
              {CURRENCIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.currencyBtn, settings.currency === c && styles.currencyBtnActive]}
                  onPress={() => setSettings((s) => ({ ...s, currency: c }))}
                >
                  <Text style={[styles.currencyText, settings.currency === c && styles.currencyTextActive]}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Row>
        </View>

        <View style={styles.calcHint}>
          <Ionicons name="calculator-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.calcText}>
            Cost per cigarette:{' '}
            <Text style={{ color: theme.colors.primary }}>
              {settings.currency}{isNaN(parseFloat(costPerCig)) ? '–' : costPerCig}
            </Text>
          </Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Settings</Text>
          )}
        </TouchableOpacity>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.accountRow} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
            <Text style={styles.accountRowText}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>SmokeFree Tracker v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const Row = ({ label, children }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    {children}
  </View>
);

const Divider = () => <View style={styles.divider} />;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },

  title: { fontSize: theme.fontSize.xxl, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.lg },

  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: theme.fontSize.xl, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: theme.fontSize.lg, fontWeight: '600', color: theme.colors.text },
  profileEmail: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },

  sectionTitle: { fontSize: theme.fontSize.sm, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.md },
  rowLabel: { fontSize: theme.fontSize.md, color: theme.colors.text },
  divider: { height: 1, backgroundColor: theme.colors.border },
  numInput: {
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    textAlign: 'right',
    minWidth: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  currencyRow: { flexDirection: 'row', gap: theme.spacing.xs },
  currencyBtn: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceHigh,
  },
  currencyBtnActive: { borderColor: theme.colors.primary, backgroundColor: 'rgba(255,107,53,0.15)' },
  currencyText: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  currencyTextActive: { color: theme.colors.primary, fontWeight: '700' },

  calcHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: theme.spacing.md, paddingHorizontal: 4 },
  calcText: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },

  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  saveBtnText: { color: '#fff', fontSize: theme.fontSize.lg, fontWeight: '700' },

  accountRow: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md, gap: theme.spacing.md },
  accountRowText: { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.danger },

  version: { textAlign: 'center', fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: theme.spacing.md },
});
