import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList } from '../../../navigation/types';
import { getSessions } from '../../../storage/workoutStorage';
import { colors } from '../../../constants/colors';
import { toDateStr } from '../../../utils/date';
import EmptyState from '../../../components/ui/EmptyState';

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;
type Route = RouteProp<WorkoutStackParamList, 'DayDetail'>;

interface ExerciseItem {
  name: string;
  equipment: string;
  setCount: number;
  sessionId: string;   // which session this exercise belongs to
}

export default function DayDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { dateKey, dateLabel, sessionIds } = route.params;
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ExerciseItem | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: dateLabel });
  }, [dateLabel, navigation]);

  const load = useCallback(async () => {
    setLoading(true);
    const sessions = await getSessions();
    const items: ExerciseItem[] = [];
    sessions
      .filter(s => toDateStr(new Date(s.date)) === dateKey)
      .forEach(session => {
        session.exercises.forEach(ex => {
          items.push({
            name: ex.name,
            equipment: ex.equipment,
            setCount: ex.sets.length,
            sessionId: session.id,   // track ownership so Edit only touches this session
          });
        });
      });
    setExercises(items);
    setLoading(false);
  }, [dateKey]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openOptions = (item: ExerciseItem) => setSelected(item);
  const closeOptions = () => setSelected(null);

  const goEdit = () => {
    if (!selected) return;
    closeOptions();
    // Pass ONLY the session that owns the tapped exercise, not all sessions for
    // the day — otherwise changing the date would move every workout on that day.
    navigation.navigate('EditWorkout', {
      dateKey,
      dateLabel,
      sessionIds: [selected.sessionId],
    });
  };

  const goHistory = () => {
    if (!selected) return;
    closeOptions();
    navigation.navigate('ExerciseHistory', { name: selected.name, equipment: selected.equipment });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={exercises}
        keyExtractor={(item, index) => `${item.name}-${item.equipment}-${index}`}
        contentContainerStyle={exercises.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.exerciseRow}
            onPress={() => openOptions(item)}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.exerciseName}>{item.name}</Text>
              <View style={styles.equipBadge}>
                <Text style={styles.equipText}>{item.equipment}</Text>
              </View>
            </View>
            <Text style={styles.setCount}>{item.setCount} sets</Text>
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="barbell-outline"
            title="No exercises"
            subtitle="No exercises were logged on this day"
          />
        }
      />

      {/* Options bottom sheet */}
      <Modal visible={selected !== null} transparent animationType="slide" onRequestClose={closeOptions}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeOptions} />
        <View style={styles.sheet}>
          {selected && (
            <>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{selected.name}</Text>
              <View style={styles.equipRow}>
                <View style={styles.equipBadgeSheet}>
                  <Text style={styles.equipTextSheet}>{selected.equipment}</Text>
                </View>
                <Text style={styles.sheetSets}>{selected.setCount} sets today</Text>
              </View>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.sheetOption} onPress={goEdit} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={20} color={colors.text} />
                <Text style={styles.sheetOptionText}>Edit Workout</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sheetOption} onPress={goHistory} activeOpacity={0.7}>
                <Ionicons name="trending-up-outline" size={20} color={colors.text} />
                <Text style={styles.sheetOptionText}>View History</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={closeOptions} activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  list: { paddingVertical: 8, paddingBottom: 40 },
  emptyContainer: { flex: 1 },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  exerciseName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  equipBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentDim,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  equipText: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  setCount: { fontSize: 13, color: colors.textSecondary, marginRight: 4 },
  separator: { height: 1, backgroundColor: colors.border },
  // Bottom sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    gap: 4,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  equipRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  equipBadgeSheet: {
    backgroundColor: colors.accentDim,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  equipTextSheet: { fontSize: 12, color: colors.accent, fontWeight: '700' },
  sheetSets: { fontSize: 13, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  sheetOptionText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  cancelBtn: {
    marginTop: 8,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
});
