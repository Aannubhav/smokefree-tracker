import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors, radius, fontSize, spacing } from '../../theme';

export default function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, icon, fullWidth = false, style,
}) {
  return (
    <TouchableOpacity
      style={[s.base, vs[variant], ss[size], fullWidth && s.full, (disabled || loading) && s.off, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.78}
    >
      {loading
        ? <ActivityIndicator color={['ghost', 'primaryOutline', 'accentOutline'].includes(variant) ? colors.primary : '#fff'} size="small" />
        : <View style={s.row}>{icon}{icon ? <View style={{ width: 6 }} /> : null}<Text style={[s.lbl, ls[variant], lss[size]]}>{label}</Text></View>
      }
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  base: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  lbl: { fontWeight: '700' },
  full: { width: '100%' },
  off: { opacity: 0.5 },
});
const vs = StyleSheet.create({
  primary: { backgroundColor: colors.primary },
  accent: { backgroundColor: colors.accent },
  ghost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
  danger: { backgroundColor: colors.danger },
  primaryOutline: { backgroundColor: colors.primaryLight, borderWidth: 1.5, borderColor: colors.primary },
  accentOutline: { backgroundColor: colors.accentLight, borderWidth: 1.5, borderColor: colors.accent },
});
const ls = StyleSheet.create({
  primary: { color: '#fff' },
  accent: { color: '#fff' },
  ghost: { color: colors.textSecondary },
  danger: { color: '#fff' },
  primaryOutline: { color: colors.primary },
  accentOutline: { color: colors.accentDark },
});
const ss = StyleSheet.create({
  sm: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
  md: { paddingVertical: 13, paddingHorizontal: 20, minHeight: 46 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 54 },
});
const lss = StyleSheet.create({
  sm: { fontSize: fontSize.sm },
  md: { fontSize: fontSize.md },
  lg: { fontSize: fontSize.lg },
});
