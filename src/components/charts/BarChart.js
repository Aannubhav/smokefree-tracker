import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, radius } from '../../theme';

export default function BarChart({ data = [], color, height = 120, showLabels = true }) {
  const max = Math.max(...data.map((d) => d.value || 0), 1);
  const c = color || colors.primary;

  return (
    <View style={s.wrap}>
      <View style={[s.chart, { height }]}>
        {data.map((item, i) => {
          const pct = (item.value || 0) / max;
          return (
            <View key={i} style={s.col}>
              <View style={s.barWrap}>
                <View style={[s.bar, { height: `${Math.max(pct * 100, 2)}%`, backgroundColor: c, opacity: pct < 0.15 ? 0.3 : 0.85 + pct * 0.15 }]} />
              </View>
              {showLabels && <Text style={s.barLabel} numberOfLines={1}>{item.label}</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function DualBarChart({ data = [], color1, color2, height = 120, showLabels = true }) {
  const max = Math.max(...data.flatMap((d) => [d.v1 || 0, d.v2 || 0]), 1);
  const c1 = color1 || colors.primary;
  const c2 = color2 || colors.accent;

  return (
    <View style={s.wrap}>
      <View style={[s.chart, { height }]}>
        {data.map((item, i) => (
          <View key={i} style={s.col}>
            <View style={s.barWrap}>
              <View style={[s.dualBar, { height: `${Math.max((item.v1 || 0) / max * 100, 2)}%`, backgroundColor: c1 }]} />
              <View style={[s.dualBar, { height: `${Math.max((item.v2 || 0) / max * 100, 2)}%`, backgroundColor: c2 }]} />
            </View>
            {showLabels && <Text style={s.barLabel} numberOfLines={1}>{item.label}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { width: '100%' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  col: { flex: 1, alignItems: 'center', gap: 4 },
  barWrap: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: radius.sm, minHeight: 3 },
  dualBar: { flex: 1, width: '45%', borderRadius: radius.sm / 2, minHeight: 2, marginHorizontal: '2%' },
  barLabel: { fontSize: 9, color: colors.textMuted, textAlign: 'center' },
});
