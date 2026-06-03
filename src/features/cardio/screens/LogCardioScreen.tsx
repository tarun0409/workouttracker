import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StackActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList } from '../../../navigation/types';
import { getMachine } from '../../../constants/cardioMachines';
import { saveCardioSession } from '../../../storage/cardioStorage';
import { colors } from '../../../constants/colors';

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;
type Route = RouteProp<WorkoutStackParamList, 'LogCardio'>;

interface LocalInterval {
  id: string;
  duration: string;
  metrics: Record<string, string>;
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function LogCardioScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const machine = getMachine(route.params.machineId)!;

  const emptyMetrics = () =>
    Object.fromEntries(machine.metrics.map(m => [m.key, '']));

  const [intervals, setIntervals] = useState<LocalInterval[]>([
    { id: makeId(), duration: '', metrics: emptyMetrics() },
  ]);

  const intervalsRef = useRef<LocalInterval[]>(intervals);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { intervalsRef.current = intervals; }, [intervals]);

  useEffect(() => {
    navigation.setOptions({ title: machine.label });
  }, []);

  const addInterval = () => {
    const last = intervals[intervals.length - 1];
    setIntervals(prev => [
      ...prev,
      { id: makeId(), duration: '', metrics: { ...last.metrics } },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const updateDuration = (id: string, v: string) =>
    setIntervals(prev => prev.map(i => i.id === id ? { ...i, duration: v } : i));

  const updateMetric = (id: string, key: string, v: string) =>
    setIntervals(prev =>
      prev.map(i => i.id === id ? { ...i, metrics: { ...i.metrics, [key]: v } } : i)
    );

  const removeInterval = (id: string) => {
    if (intervals.length === 1) return;
    setIntervals(prev => prev.filter(i => i.id !== id));
  };

  const finish = useCallback(async () => {
    const current = intervalsRef.current;
    const valid = current
      .map(i => ({
        id: i.id,
        durationMinutes: parseFloat(i.duration) || 0,
        metrics: Object.fromEntries(
          machine.metrics.map(m => [
            m.key,
            m.decimal
              ? parseFloat(i.metrics[m.key]) || 0
              : parseInt(i.metrics[m.key]) || 0,
          ])
        ),
      }))
      .filter(i => i.durationMinutes > 0);

    if (valid.length === 0) {
      Alert.alert('No Intervals', 'Enter a duration for at least one interval.');
      return;
    }

    await saveCardioSession({
      id: makeId(),
      date: new Date().toISOString(),
      machine: machine.id,
      machineName: machine.label,
      intervals: valid,
    });

    navigation.dispatch(StackActions.popToTop());
  }, [machine, navigation]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Column header */}
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.colNum]}>#</Text>
          <Text style={[styles.headerCell, styles.colDuration]}>MIN</Text>
          {machine.metrics.map(m => (
            <Text key={m.key} style={[styles.headerCell, styles.colMetric]}>
              {m.unit
                ? `${m.label.toUpperCase()} (${m.unit})`
                : m.label.toUpperCase()}
            </Text>
          ))}
          <View style={{ width: 28 }} />
        </View>

        {intervals.map((interval, idx) => (
          <View key={interval.id} style={styles.intervalRow}>
            <Text style={[styles.numText, styles.colNum]}>{idx + 1}</Text>
            <TextInput
              style={[styles.input, styles.colDuration]}
              value={interval.duration}
              onChangeText={v => updateDuration(interval.id, v)}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              returnKeyType="next"
            />
            {machine.metrics.map(m => (
              <TextInput
                key={m.key}
                style={[styles.input, styles.colMetric]}
                value={interval.metrics[m.key]}
                onChangeText={v => updateMetric(interval.id, m.key, v)}
                keyboardType={m.decimal ? 'decimal-pad' : 'number-pad'}
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                returnKeyType="next"
              />
            ))}
            <TouchableOpacity
              onPress={() => removeInterval(interval.id)}
              style={{ width: 28, alignItems: 'center' }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="close"
                size={16}
                color={intervals.length === 1 ? 'transparent' : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addBtn} onPress={addInterval}>
          <Ionicons name="add" size={16} color={colors.accent} />
          <Text style={styles.addText}>Add Interval</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity style={styles.finishBtn} onPress={finish} activeOpacity={0.85}>
        <Text style={styles.finishText}>Save Cardio</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 16, paddingBottom: 110 },
  // Column flex widths
  colNum: { flex: 0.4, textAlign: 'center' },
  colDuration: { flex: 0.75 },
  colMetric: { flex: 1 },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  headerCell: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Interval rows
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  numText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  addText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  // Save button
  finishBtn: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: colors.accent,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  finishText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
