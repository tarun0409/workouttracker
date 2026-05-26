import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getSessions } from '../../../storage/workoutStorage';
import { enqueueExercise } from '../exerciseQueue';
import { colors } from '../../../constants/colors';

const EQUIPMENT = [
  'Barbell', 'Dumbbell', 'Smith Machine', 'Cable',
  'Bodyweight', 'Kettlebell', 'Machine', 'Band', 'Other',
];

// ── Fuzzy helpers ──────────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const row = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, row[j], row[j - 1]);
      prev = tmp;
    }
  }
  return row[n];
}

/** Lower score = better match. Infinity = no match. */
function fuzzyScore(query: string, candidate: string): number {
  const q = query.toLowerCase().trim();
  const c = candidate.toLowerCase().trim();
  if (c === q) return 0;
  if (c.startsWith(q)) return 1;
  if (c.includes(q)) return 2;
  const dist = levenshtein(q, c);
  const threshold = Math.floor(q.length / 3) + 1;
  if (dist <= threshold) return 3 + dist;
  return Infinity;
}

function toTitleCase(str: string): string {
  return str.trim().replace(/\b\w/g, c => c.toUpperCase());
}

// ──────────────────────────────────────────────────────────────────────────────

export default function AddExerciseScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState('Barbell');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allNames, setAllNames] = useState<string[]>([]);

  useEffect(() => {
    getSessions().then(sessions => {
      const names = new Set<string>();
      sessions.forEach(s => s.exercises.forEach(e => names.add(e.name)));
      setAllNames(Array.from(names).sort());
    });
  }, []);

  useEffect(() => {
    const q = name.trim();
    if (q.length < 1) { setSuggestions([]); return; }
    const scored = allNames
      .map(n => ({ n, score: fuzzyScore(q, n) }))
      .filter(x => x.score < Infinity)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(x => x.n);
    setSuggestions(scored);
  }, [name, allNames]);

  const handleAdd = () => {
    if (!name.trim()) return;
    enqueueExercise({ name: toTitleCase(name), equipment });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Exercise Name</Text>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Bench Press"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />

        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map(s => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionItem}
                onPress={() => { setName(s); setSuggestions([]); }}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.label, { marginTop: 24 }]}>Equipment</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipRow}>
            {EQUIPMENT.map(eq => (
              <TouchableOpacity
                key={eq}
                style={[styles.chip, equipment === eq && styles.chipActive]}
                onPress={() => setEquipment(eq)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, equipment === eq && styles.chipTextActive]}>{eq}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity
          style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!name.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>Add to Workout</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, gap: 8, paddingBottom: 40 },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestions: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: { color: colors.text, fontSize: 15 },
  chipScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  chipRow: { flexDirection: 'row', gap: 8, paddingRight: 20 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  addBtnDisabled: { backgroundColor: colors.border },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
