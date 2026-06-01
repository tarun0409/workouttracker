/**
 * DIAGNOSTIC BUILD — identifies which module crashes at evaluation time.
 *
 * Strategy: require() each suspect module inside useEffect with try/catch.
 * - If the screen shows "Initializing..." → App() rendered (bundle load OK)
 * - If the screen is blank → bundle evaluation crashed before App() ran
 * - If a module row shows ✗ → that module threw during require()
 *
 * DO NOT use top-level import for the suspects — that would evaluate them
 * at bundle-load time and we'd get blank screen instead of the error message.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function App() {
  const [lines, setLines] = useState<string[]>(['App() rendered ✓', 'Running module checks...']);

  useEffect(() => {
    const results: string[] = ['App() rendered ✓'];

    const check = (label: string, fn: () => unknown) => {
      try {
        fn();
        results.push(`✓  ${label}`);
      } catch (e: any) {
        results.push(`✗  ${label}`);
        results.push(`   → ${e?.message ?? String(e)}`);
        setLines([...results, '', '--- stopped here ---']);
        return false;
      }
      return true;
    };

    // Each require() path must be a literal string so Metro bundles it.
    // Using arrow functions so they're only evaluated when called.
    const ok =
      check('@expo/vector-icons', () => require('@expo/vector-icons')) &&
      check('AsyncStorage', () => require('@react-native-async-storage/async-storage')) &&
      check('workoutStorage', () => require('./src/storage/workoutStorage')) &&
      check('useWorkouts', () => require('./src/hooks/useWorkouts')) &&
      check('settingsStorage', () => require('./src/storage/settingsStorage')) &&
      check('useSettings', () => require('./src/hooks/useSettings')) &&
      check('stepsStorage', () => require('./src/storage/stepsStorage')) &&
      check('useSteps', () => require('./src/hooks/useSteps')) &&
      check('EmptyState', () => require('./src/components/ui/EmptyState')) &&
      check('colors', () => require('./src/constants/colors')) &&
      check('WorkoutListScreen', () => require('./src/features/workout/screens/WorkoutListScreen')) &&
      check('DayDetailScreen', () => require('./src/features/workout/screens/DayDetailScreen')) &&
      check('ActiveWorkoutScreen', () => require('./src/features/workout/screens/ActiveWorkoutScreen')) &&
      check('EditWorkoutScreen', () => require('./src/features/workout/screens/EditWorkoutScreen')) &&
      check('AddExerciseScreen', () => require('./src/features/workout/screens/AddExerciseScreen')) &&
      check('ExerciseHistoryScreen', () => require('./src/features/workout/screens/ExerciseHistoryScreen')) &&
      check('SettingsScreen', () => require('./src/features/settings/screens/SettingsScreen')) &&
      check('ActivityScreen', () => require('./src/features/activity/screens/ActivityScreen')) &&
      check('ProgressScreen', () => require('./src/features/progress/screens/ProgressScreen')) &&
      check('TabNavigator', () => require('./src/navigation/TabNavigator')) &&
      check('WorkoutStack', () => require('./src/navigation/WorkoutStack'));

    if (ok) {
      results.push('', '✓ ALL MODULES OK');
    }
    setLines(results);
  }, []);

  return (
    <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
      {lines.map((line, i) => (
        <Text key={i} style={line.startsWith('✗') || line.startsWith('   →') ? styles.err : styles.ok}>
          {line}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0F0F0F' },
  content: { padding: 28, paddingTop: 80, paddingBottom: 60 },
  ok: { color: '#ccc', fontSize: 13, lineHeight: 24 },
  err: { color: '#EF4444', fontSize: 13, lineHeight: 24, fontWeight: '700' },
});
