import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { spacing, radius, fontSize } from '../../theme';
import { saveSettings, DEFAULT_SETTINGS } from '../../services/smokingService';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Name, email required. Password min 6 chars.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await register(email.trim().toLowerCase(), password, name.trim());
      await saveSettings(user.uid, { ...DEFAULT_SETTINGS, displayName: name.trim() });
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.emoji}>🚬</Text>
          <Text style={styles.title}>Get Started</Text>
          <Text style={styles.subtitle}>Create your free account</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Min 6 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eye}>
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>
              Already have an account?{' '}
              <Text style={{ color: colors.primary }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const friendlyError = (code) => {
  switch (code) {
    case 'auth/email-already-in-use': return 'This email is already registered.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/weak-password': return 'Password is too weak.';
    default: return 'Registration failed. Please try again.';
  }
};

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  emoji: { fontSize: 56, marginBottom: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: 4 },
  form: { gap: spacing.sm },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  passRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  eye: { padding: spacing.md, marginLeft: -44 },
  error: { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
  link: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.md,
  },
});
