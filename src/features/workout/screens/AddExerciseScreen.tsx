import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getSessions } from '../../../storage/workoutStorage';
import { enqueueExercise } from '../exerciseQueue';
import { colors } from '../../../constants/colors';

// Seed list — always available as suggestions even on first launch
const DEFAULT_EQUIPMENT = [
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
  const equipmentRef = useRef<TextInput>(null);
  const skipNameSuggest = useRef(false);
  const skipEquipmentSuggest = useRef(false);

  const [name, setName] = useState('');
  const [equipment, setEquipment] = useState('Dumbbell');
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [equipmentSuggestions, setEquipmentSuggestions] = useState<string[]>([]);
  const [allNames, setAllNames] = useState<string[]>([]);
  const [allEquipment, setAllEquipment] = useState<string[]>(DEFAULT_EQUIPMENT);

  // Load past exercise names and equipment types from storage
  useEffect(() => {
    getSessions().then(sessions => {
      const names = new Set<string>();
      const equips = new Set<string>(DEFAULT_EQUIPMENT);
      sessions.forEach(s => s.exercises.forEach(e => {
        names.add(e.name);
        equips.add(e.equipment);
      }));
      setAllNames(Array.from(names).sort());
      setAllEquipment(Array.from(equips).sort());
    });
  }, []);

  // Fuzzy suggestions for exercise name
  useEffect(() => {
    if (skipNameSuggest.current) { skipNameSuggest.current = false; return; }
    const q = name.trim();
    if (q.length < 1) { setNameSuggestions([]); return; }
    const scored = allNames
      .map(n => ({ n, score: fuzzyScore(q, n) }))
      .filter(x => x.score < Infinity)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(x => x.n);
    setNameSuggestions(scored);
  }, [name, allNames]);

  // Fuzzy suggestions for equipment
  useEffect(() => {
    if (skipEquipmentSuggest.current) { skipEquipmentSuggest.current = false; return; }
    const q = equipment.trim();
    if (q.length < 1) { setEquipmentSuggestions([]); return; }
    const scored = allEquipment
      .map(e => ({ e, score: fuzzyScore(q, e) }))
      .filter(x => x.score < Infinity)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(x => x.e);
    setEquipmentSuggestions(scored);
  }, [equipment, allEquipment]);

  const handleAdd = () => {
    if (!name.trim() || !equipment.trim()) return;
    enqueueExercise({
      name: toTitleCase(name),
      equipment: toTitleCase(equipment),
    });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Exercise Name ── */}
        <Text style={styles.label}>Exercise Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Bench Press"
          placeholderTextColor={colors.textSecondary}
          autoFocus
          returnKeyType="next"
          onSubmitEditing={() => equipmentRef.current?.focus()}
        />
        {nameSuggestions.length > 0 && (
          <View style={styles.suggestions}>
            {nameSuggestions.map(s => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionItem}
                onPress={() => { skipNameSuggest.current = true; setName(s); setNameSuggestions([]); }}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Equipment ── */}
        <Text style={[styles.label, { marginTop: 24 }]}>Equipment</Text>
        <TextInput
          ref={equipmentRef}
          style={styles.input}
          value={equipment}
          onChangeText={setEquipment}
          placeholder="e.g. Barbell"
          placeholderTextColor={colors.textSecondary}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />
        {equipmentSuggestions.length > 0 && (
          <View style={styles.suggestions}>
            {equipmentSuggestions.map(s => (
              <TouchableOpacity
                key={s}
                style={styles.suggestionItem}
                onPress={() => { skipEquipmentSuggest.current = true; setEquipment(s); setEquipmentSuggestions([]); }}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.addBtn, (!name.trim() || !equipment.trim()) && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={!name.trim() || !equipment.trim()}
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
  input: {
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
