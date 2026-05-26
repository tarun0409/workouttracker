import React, { useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList } from '../../../navigation/types';
import { useWorkouts } from '../../../hooks/useWorkouts';
import { WorkoutSession } from '../../../types';
import { colors } from '../../../constants/colors';
import { formatShort, toDateStr } from '../../../utils/date';
import EmptyState from '../../../components/ui/EmptyState';

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;

interface DateRow {
  dateKey: string;
  dateLabel: string;
  exerciseCount: number;
  sessionIds: string[];
}

export default function WorkoutListScreen() {
  const navigation = useNavigation<Nav>();
  const { sessions, loading, remove, reload } = useWorkouts();

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const dateRows: DateRow[] = useMemo(() => {
    const byDate: Record<string, DateRow> = {};
    sessions.forEach((session: WorkoutSession) => {
      const dateKey = toDateStr(new Date(session.date));
      if (!byDate[dateKey]) {
        byDate[dateKey] = {
          dateKey,
          dateLabel: formatShort(session.date),
          exerciseCount: 0,
          sessionIds: [],
        };
      }
      byDate[dateKey].sessionIds.push(session.id);
      byDate[dateKey].exerciseCount += session.exercises.length;
    });
    return Object.values(byDate).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [sessions]);

  const confirmDelete = (row: DateRow) => {
    Alert.alert(
      'Delete Workout',
      `Remove all exercises logged on ${row.dateLabel}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => Promise.all(row.sessionIds.map(id => remove(id))),
        },
      ]
    );
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
        data={dateRows}
        keyExtractor={item => item.dateKey}
        contentContainerStyle={dateRows.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.dateRow}
            onPress={() =>
              navigation.navigate('DayDetail', {
                dateKey: item.dateKey,
                dateLabel: item.dateLabel,
                sessionIds: item.sessionIds,
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.dateInfo}>
              <Text style={styles.dateLabel}>{item.dateLabel}</Text>
              <Text style={styles.exerciseCount}>
                {item.exerciseCount} {item.exerciseCount === 1 ? 'exercise' : 'exercises'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => confirmDelete(item)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.deleteBtn}
            >
              <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="barbell-outline"
            title="No workouts yet"
            subtitle="Tap + to log your first session"
          />
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ActiveWorkout', undefined)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  list: { paddingVertical: 8, paddingBottom: 100 },
  emptyContainer: { flex: 1 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  dateInfo: { flex: 1 },
  dateLabel: { fontSize: 16, fontWeight: '600', color: colors.text },
  exerciseCount: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: 4 },
  separator: { height: 1, backgroundColor: colors.border },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
