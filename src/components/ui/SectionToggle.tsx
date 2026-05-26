import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface Props {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export default function SectionToggle({ options, selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.tab, selected === opt && styles.tabActive]}
          onPress={() => onSelect(opt)}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, selected === opt && styles.labelActive]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  labelActive: {
    color: '#fff',
  },
});
