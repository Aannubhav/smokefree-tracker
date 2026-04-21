import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export default function Card({ children, style, padding = true, accent }) {
  return (
    <View style={[s.card, accent && { borderLeftWidth: 3, borderLeftColor: accent }, padding && s.pad, style]}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pad: { padding: spacing.md },
});
