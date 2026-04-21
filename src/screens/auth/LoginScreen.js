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

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
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
          <Text style={styles.title}>SmokeFree</Text>
          <Text style={styles.subtitle}>Track. Understand. Quit.</Text>
        </View>

        <View style={styles.form}>
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
              placeholder="••••••••"
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

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>
              Don't have an account?{' '}
              <Text style={{ color: colors.primary }}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const friendlyError = (code) => {
  switch (code) {
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/too-many-requests': return 'Too many attempts. Try later.';
    default: return 'Login failed. Please try again.';
  }
};

const createStyles = (colors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  emoji: { fontSize: 64, marginBottom: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, letterSpacing: 1 },
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
