import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList } from '../../../navigation/types';
import { getSessions } from '../../../storage/workoutStorage';
import { getCardioSessions, deleteCardioSession } from '../../../storage/cardioStorage';
import { CardioSession } from '../../../types';
import { getMachine, metricsSummary } from '../../../constants/cardioMachines';
import { colors } from '../../../constants/colors';
import { toDateStr, formatShort } from '../../../utils/date';
import EmptyState from '../../../components/ui/EmptyState';

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;
type Route = RouteProp<WorkoutStackParamList, 'DayDetail'>;

interface ExerciseItem {
  name: string;
  equipment: string;
  setCount: number;
  sessionId: string;
}

interface CardioItem {
  id: string;
  machineName: string;
  machineId: string;
  totalMinutes: number;
  intervalCount: number;
  firstIntervalSummary: string;
}

export default function DayDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { dateKey, dateLabel } = route.params;

  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [cardioItems, setCardioItems] = useState<CardioItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Strength exercise options sheet
  const [selected, setSelected] = useState<ExerciseItem | null>(null);
  // Cardio options sheet
  const [selectedCardio, setSelectedCardio] = useState<CardioItem | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: dateLabel });
  }, [dateLabel, navigation]);

  const load = useCallback(async () => {
    setLoading(true);

    // Strength exercises
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
            sessionId: session.id,
          });
        });
      });
    setExercises(items);

    // Cardio
    const allCardio = await getCardioSessions();
    const cardio: CardioItem[] = allCardio
      .filter(cs => toDateStr(new Date(cs.date)) === dateKey)
      .map(cs => {
        const machine = getMachine(cs.machine);
        const total = cs.intervals.reduce((sum, i) => sum + i.durationMinutes, 0);
        const firstSummary =
          machine && cs.intervals.length > 0
            ? metricsSummary(machine, cs.intervals[0].metrics)
            : '';
        return {
          id: cs.id,
          machineName: cs.machineName,
          machineId: cs.machine,
          totalMinutes: total,
          intervalCount: cs.intervals.length,
          firstIntervalSummary: firstSummary,
        };
      });
    setCardioItems(cardio);

    setLoading(false);
  }, [dateKey]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ── Strength exercise actions ───────────────────────────────────────────────
  const openOptions = (item: ExerciseItem) => setSelected(item);
  const closeOptions = () => setSelected(null);

  const goEdit = () => {
    if (!selected) return;
    closeOptions();
    navigation.navigate('EditWorkout', {
      dateKey,
      dateLabel,
      sessionIds: [selected.sessionId],
      filterExerciseName: selected.name,
      filterExerciseEquipment: selected.equipment,
    });
  };

  const goHistory = () => {
    if (!selected) return;
    closeOptions();
    navigation.navigate('ExerciseHistory', { name: selected.name, equipment: selected.equipment });
  };

  // ── Cardio actions ─────────────────────────────────────────────────────────
  const openCardioOptions = (item: CardioItem) => setSelectedCardio(item);
  const closeCardioOptions = () => setSelectedCardio(null);

  const goEditCardio = () => {
    if (!selectedCardio) return;
    closeCardioOptions();
    navigation.navigate('EditCardio', {
      cardioSessionId: selectedCardio.id,
      dateLabel,
    });
  };

  const confirmDeleteCardio = () => {
    if (!selectedCardio) return;
    Alert.alert(
      'Delete Cardio',
      `Remove this ${selectedCardio.machineName} session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCardioSession(selectedCardio.id);
            closeCardioOptions();
            load();
          },
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

  const hasBoth = exercises.length > 0 && cardioItems.length > 0;
  const isEmpty = exercises.length === 0 && cardioItems.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={isEmpty ? styles.emptyContainer : styles.scroll}>

        {isEmpty && (
          <EmptyState
            icon="barbell-outline"
            title="No workouts"
            subtitle="No exercises or cardio were logged on this day"
          />
        )}

        {/* ── Strength section ─────────────────────────────────────────────── */}
        {exercises.length > 0 && (
          <>
            {hasBoth && <Text style={styles.sectionLabel}>STRENGTH</Text>}
            {exercises.map((item, index) => (
              <TouchableOpacity
                key={`${item.name}-${item.equipment}-${index}`}
                style={[
                  styles.exerciseRow,
                  index < exercises.length - 1 && styles.rowBorder,
                ]}
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
            ))}
          </>
        )}

        {/* ── Cardio section ───────────────────────────────────────────────── */}
        {cardioItems.length > 0 && (
          <>
            {hasBoth && <Text style={[styles.sectionLabel, { marginTop: 20 }]}>CARDIO</Text>}
            {cardioItems.map((item, index) => {
              const machine = getMachine(item.machineId);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.exerciseRow,
                    index < cardioItems.length - 1 && styles.rowBorder,
                  ]}
                  onPress={() => openCardioOptions(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.cardioIcon, { backgroundColor: 'rgba(34,197,94,0.12)' }]}>
                    <Ionicons
                      name={(machine?.icon ?? 'fitness-outline') as any}
                      size={18}
                      color={colors.success}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{item.machineName}</Text>
                    <Text style={styles.cardioMeta}>
                      {item.totalMinutes} min
                      {item.intervalCount > 1 ? ` · ${item.intervalCount} intervals` : ''}
                    </Text>
                    {item.firstIntervalSummary ? (
                      <Text style={styles.cardioSummary} numberOfLines={1}>
                        {item.firstIntervalSummary}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="ellipsis-horizontal" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* ── Strength exercise options sheet ──────────────────────────────────── */}
      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={closeOptions}
      >
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

      {/* ── Cardio options sheet ──────────────────────────────────────────────── */}
      <Modal
        visible={selectedCardio !== null}
        transparent
        animationType="slide"
        onRequestClose={closeCardioOptions}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={closeCardioOptions} />
        <View style={styles.sheet}>
          {selectedCardio && (
            <>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>{selectedCardio.machineName}</Text>
              <Text style={styles.sheetSets}>
                {selectedCardio.totalMinutes} min · {selectedCardio.intervalCount}{' '}
                {selectedCardio.intervalCount === 1 ? 'interval' : 'intervals'}
              </Text>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.sheetOption} onPress={goEditCardio} activeOpacity={0.7}>
                <Ionicons name="create-outline" size={20} color={colors.text} />
                <Text style={styles.sheetOptionText}>Edit Cardio</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sheetOption} onPress={confirmDeleteCardio} activeOpacity={0.7}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                <Text style={[styles.sheetOptionText, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeCardioOptions} activeOpacity={0.7}>
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
  scroll: { paddingVertical: 8, paddingBottom: 40 },
  emptyContainer: { flex: 1 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  cardioIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardioMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardioSummary: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  // Sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
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
  sheetSets: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
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
