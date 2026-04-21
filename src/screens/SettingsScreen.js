import React, { useState, useCallback, useMemo } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, fontSize } from '../theme';
import { getSettings, saveSettings } from '../services/smokingService';

const CURRENCIES = ['₹', '$', '€', '£', '¥'];

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
        <ActivityIndicator size="large" color={colors.primary} />
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

        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.card}>
          <Row label="Dark Mode" styles={styles}>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? '#fff' : colors.textMuted}
            />
          </Row>
        </View>

        {/* Cigarette settings */}
        <Text style={styles.sectionTitle}>Cigarette Pricing</Text>
        <View style={styles.card}>
          <Row label="Price per Pack" styles={styles}>
            <TextInput
              style={styles.numInput}
              value={String(settings.pricePerPack)}
              onChangeText={(v) => setSettings((s) => ({ ...s, pricePerPack: v }))}
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
            />
          </Row>
          <Divider colors={colors} />
          <Row label="Cigarettes per Pack" styles={styles}>
            <TextInput
              style={styles.numInput}
              value={String(settings.cigarettesPerPack)}
              onChangeText={(v) => setSettings((s) => ({ ...s, cigarettesPerPack: v }))}
              keyboardType="numeric"
              placeholderTextColor={colors.textMuted}
            />
          </Row>
          <Divider colors={colors} />
          <Row label="Currency" styles={styles}>
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
          <Ionicons name="calculator-outline" size={14} color={colors.textMuted} />
          <Text style={styles.calcText}>
            Cost per cigarette:{' '}
            <Text style={{ color: colors.primary }}>
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
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.accountRowText}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>SmokeFree Tracker v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const Row = ({ label, children, styles }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    {children}
  </View>
);

const Divider = ({ colors }) => <View style={{ height: 1, backgroundColor: colors.border }} />;

const createStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },

  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.xl, fontWeight: '700', color: '#fff' },
  profileName: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  profileEmail: { fontSize: fontSize.sm, color: colors.textSecondary },

  sectionTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  rowLabel: { fontSize: fontSize.md, color: colors.text },
  numInput: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: colors.text,
    fontSize: fontSize.md,
    textAlign: 'right',
    minWidth: 80,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyRow: { flexDirection: 'row', gap: spacing.xs },
  currencyBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceHigh,
  },
  currencyBtnActive: { borderColor: colors.primary, backgroundColor: 'rgba(255,107,53,0.15)' },
  currencyText: { fontSize: fontSize.md, color: colors.textSecondary },
  currencyTextActive: { color: colors.primary, fontWeight: '700' },

  calcHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md, paddingHorizontal: 4 },
  calcText: { fontSize: fontSize.sm, color: colors.textMuted },

  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  saveBtnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },

  accountRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  accountRowText: { flex: 1, fontSize: fontSize.md, color: colors.danger },

  version: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.md },
});
