import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, radius } from '../../theme';

export default function StatBlock({ value, label, sub, icon, color, style }) {
  const c = color || colors.primary;
  return (
    <View style={[s.wrap, style]}>
      {icon && <View style={[s.icon, { backgroundColor: `${c}18` }]}>{icon}</View>}
      <Text style={[s.value, { color: c }]}>{value}</Text>
      <Text style={s.label}>{label}</Text>
      {!!sub && <Text style={s.sub}>{sub}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, gap: 3 },
  icon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  value: { fontSize: fontSize.xxl, fontWeight: '800' },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '500' },
  sub: { fontSize: fontSize.xs, color: colors.textMuted },
});
