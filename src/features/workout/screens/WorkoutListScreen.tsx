import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList } from '../../../navigation/types';
import { useWorkouts } from '../../../hooks/useWorkouts';
import { getCardioSessions, deleteCardioSession } from '../../../storage/cardioStorage';
import { WorkoutSession, CardioSession } from '../../../types';
import { colors } from '../../../constants/colors';
import { formatShort, toDateStr } from '../../../utils/date';
import EmptyState from '../../../components/ui/EmptyState';

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;

interface DateRow {
  dateKey: string;
  dateLabel: string;
  exerciseCount: number;
  cardioCount: number;
  sessionIds: string[];
  cardioSessionIds: string[];
}

export default function WorkoutListScreen() {
  const navigation = useNavigation<Nav>();
  const { sessions, loading, remove, reload } = useWorkouts();
  const [cardioSessions, setCardioSessions] = useState<CardioSession[]>([]);
  const [showMenu, setShowMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reload();
      getCardioSessions().then(setCardioSessions);
    }, [reload])
  );

  const dateRows: DateRow[] = useMemo(() => {
    const byDate: Record<string, DateRow> = {};

    sessions.forEach((session: WorkoutSession) => {
      const dateKey = toDateStr(new Date(session.date));
      if (!byDate[dateKey]) {
        byDate[dateKey] = {
          dateKey,
          dateLabel: formatShort(session.date),
          exerciseCount: 0,
          cardioCount: 0,
          sessionIds: [],
          cardioSessionIds: [],
        };
      }
      byDate[dateKey].sessionIds.push(session.id);
      byDate[dateKey].exerciseCount += session.exercises.length;
    });

    cardioSessions.forEach((cs: CardioSession) => {
      const dateKey = toDateStr(new Date(cs.date));
      if (!byDate[dateKey]) {
        byDate[dateKey] = {
          dateKey,
          dateLabel: formatShort(cs.date),
          exerciseCount: 0,
          cardioCount: 0,
          sessionIds: [],
          cardioSessionIds: [],
        };
      }
      byDate[dateKey].cardioSessionIds.push(cs.id);
      byDate[dateKey].cardioCount += 1;
    });

    return Object.values(byDate).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [sessions, cardioSessions]);

  const confirmDelete = (row: DateRow) => {
    Alert.alert(
      'Delete Day',
      `Remove all workouts and cardio logged on ${row.dateLabel}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Promise.all([
              ...row.sessionIds.map(id => remove(id)),
              ...row.cardioSessionIds.map(id => deleteCardioSession(id)),
            ]).then(() => getCardioSessions().then(setCardioSessions));
          },
        },
      ]
    );
  };

  function daySubtitle(row: DateRow): string {
    const parts: string[] = [];
    if (row.exerciseCount > 0)
      parts.push(`${row.exerciseCount} ${row.exerciseCount === 1 ? 'exercise' : 'exercises'}`);
    if (row.cardioCount > 0)
      parts.push(`${row.cardioCount} cardio`);
    return parts.join(' · ');
  }

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
              <Text style={styles.subtitle}>{daySubtitle(item)}</Text>
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

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowMenu(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Log type menu */}
      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <TouchableOpacity
            style={styles.menuOption}
            activeOpacity={0.7}
            onPress={() => {
              setShowMenu(false);
              navigation.navigate('ActiveWorkout', undefined);
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.accentDim }]}>
              <Ionicons name="barbell-outline" size={22} color={colors.accent} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Log Strength</Text>
              <Text style={styles.menuSub}>Exercises, sets & reps</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuOption}
            activeOpacity={0.7}
            onPress={() => {
              setShowMenu(false);
              navigation.navigate('SelectMachine');
            }}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
              <Ionicons name="heart-outline" size={22} color={colors.success} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Log Cardio</Text>
              <Text style={styles.menuSub}>Treadmill, EFX, Cycling…</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setShowMenu(false)}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
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
  // Menu sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 20,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  menuSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cancelBtn: {
    marginTop: 8,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' },
});
