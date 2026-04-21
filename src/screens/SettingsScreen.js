import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Platform, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../theme';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getSettings, saveSettings, DEFAULT_SETTINGS } from '../services/smokingService';

const CURRENCIES = ['₹', '$', '€', '£', '¥'];

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await getSettings(user.uid);
      setSettings(s);
    } catch (e) { console.error(e); }
  }, [user.uid]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const set = (key, val) => setSettings((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    const price = parseFloat(settings.pricePerPack);
    const count = parseInt(settings.cigarettesPerPack, 10);
    if (!price || price <= 0 || !count || count <= 0) return;
    setSaving(true);
    try {
      await saveSettings(user.uid, { ...settings, pricePerPack: price, cigarettesPerPack: count });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleLogout = () => {
    const doLogout = () => logout();
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out of SmokeFree?')) doLogout();
    } else {
      const { Alert } = require('react-native');
      Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: doLogout },
      ]);
    }
  };

  const costPerCig = settings.pricePerPack && settings.cigarettesPerPack
    ? (parseFloat(settings.pricePerPack) / parseInt(settings.cigarettesPerPack, 10)).toFixed(2)
    : '0.00';

  return (
    <View style={s.root}>
      <View style={s.pageHeader}>
        <Text style={s.pageTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Profile */}
        <Card style={s.profile}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(user.displayName || user.email || '?')[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>{user.displayName || 'User'}</Text>
            <Text style={s.profileEmail}>{user.email}</Text>
          </View>
        </Card>

        {/* Pricing */}
        <Text style={s.sectionLabel}>Cigarette Pricing</Text>
        <Card style={s.card}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Price per Pack</Text>
              <TextInput
                style={s.input}
                value={String(settings.pricePerPack)}
                onChangeText={(v) => set('pricePerPack', v)}
                keyboardType="numeric"
                placeholder="300"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>Cigarettes per Pack</Text>
              <TextInput
                style={s.input}
                value={String(settings.cigarettesPerPack)}
                onChangeText={(v) => set('cigarettesPerPack', v)}
                keyboardType="numeric"
                placeholder="20"
                placeholderTextColor={colors.textMuted}
              />
            </View>
          </View>

          <View style={s.costRow}>
            <Ionicons name="calculator-outline" size={16} color={colors.primary} />
            <Text style={s.costText}>Cost per cigarette: <Text style={{ color: colors.primary, fontWeight: '700' }}>{settings.currency}{costPerCig}</Text></Text>
          </View>
        </Card>

        {/* Currency */}
        <Text style={s.sectionLabel}>Currency</Text>
        <Card style={s.card}>
          <View style={s.currRow}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[s.currBtn, settings.currency === c && s.currBtnActive]}
                onPress={() => set('currency', c)}
              >
                <Text style={[s.currTxt, settings.currency === c && s.currTxtActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Save */}
        <Button
          label={saved ? '✓ Saved!' : 'Save Settings'}
          variant={saved ? 'primaryOutline' : 'primary'}
          size="lg"
          fullWidth
          loading={saving}
          onPress={handleSave}
        />

        {/* Sign Out */}
        <Button
          label="Sign Out"
          variant="ghost"
          size="md"
          fullWidth
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />}
        />

        <Text style={s.version}>SmokeFree Tracker v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  pageHeader: { padding: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.background, borderBottomWidth: 1, borderColor: colors.border },
  pageTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 40 },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: -spacing.xs },

  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary },
  profileName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  profileEmail: { fontSize: fontSize.sm, color: colors.textSecondary },

  card: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  fieldLabel: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.sm, fontSize: fontSize.md, color: colors.text,
    backgroundColor: colors.surface,
  },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryLight, padding: spacing.sm, borderRadius: radius.sm },
  costText: { fontSize: fontSize.sm, color: colors.textSecondary },

  currRow: { flexDirection: 'row', gap: spacing.sm },
  currBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface },
  currBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  currTxt: { fontSize: fontSize.md, fontWeight: '600', color: colors.textSecondary },
  currTxtActive: { color: colors.primary },

  version: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', paddingBottom: spacing.sm },
});
