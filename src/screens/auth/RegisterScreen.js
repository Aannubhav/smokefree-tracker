import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, ScrollView, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, fontSize } from '../../theme';
import Button from '../../components/ui/Button';
import { saveSettings, DEFAULT_SETTINGS } from '../../services/smokingService';

const friendly = (code) => {
  switch (code) {
    case 'auth/email-already-in-use': return 'This email is already registered.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    default: return 'Registration failed. Please try again.';
  }
};

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setError(''); setLoading(true);
    try {
      const u = await register(email.trim().toLowerCase(), password, name.trim());
      await saveSettings(u.uid, DEFAULT_SETTINGS);
    } catch (e) { setError(friendly(e.code)); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={s.brand}>
          <View style={s.logoWrap}>
            <Ionicons name="flame" size={36} color={colors.accent} />
          </View>
          <Text style={s.appName}>SmokeFree</Text>
          <Text style={s.tagline}>Start your journey today.</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          <Text style={s.formTitle}>Create account</Text>

          <View style={s.field}>
            <Text style={s.label}>Full Name</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={s.passRow}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={s.eye}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {!!error && (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <Button label="Create Account" variant="primary" size="lg" fullWidth loading={loading} onPress={handleRegister} style={{ marginTop: spacing.sm }} />

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.switchBtn}>
            <Text style={s.switchText}>Already have an account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  brand: { alignItems: 'center', marginBottom: spacing.xl },
  logoWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  appName: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  tagline: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  form: { gap: spacing.md },
  formTitle: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  field: { gap: 6 },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary },
  input: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.md, fontSize: fontSize.md, color: colors.text, backgroundColor: colors.surface,
  },
  passRow: { flexDirection: 'row', alignItems: 'center' },
  eye: { padding: spacing.md, marginLeft: -48 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerLight, padding: spacing.sm, borderRadius: radius.sm },
  errorText: { fontSize: fontSize.sm, color: colors.danger, flex: 1 },
  switchBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  switchText: { fontSize: fontSize.sm, color: colors.textSecondary },
});
