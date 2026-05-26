import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface Props {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, sub, accent }: Props) {
  return (
    <View style={[styles.card, accent && styles.accentCard]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, accent && styles.accentValue]}>{value}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accentCard: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  accentValue: {
    color: colors.accent,
  },
  sub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
