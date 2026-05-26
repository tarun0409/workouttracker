import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList } from '../../../navigation/types';
import { getSessions, saveSession, deleteSession } from '../../../storage/workoutStorage';
import { dequeueExercise } from '../exerciseQueue';
import { colors } from '../../../constants/colors';

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;
type Route = RouteProp<WorkoutStackParamList, 'EditWorkout'>;

interface LocalSet { id: string; weight: string; reps: string; }
interface LocalExercise { id: string; name: string; equipment: string; sets: LocalSet[]; }

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EditWorkoutScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { dateLabel, sessionIds } = route.params;

  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [workoutDate, setWorkoutDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Refs so callbacks are never stale
  const exercisesRef = useRef<LocalExercise[]>([]);
  const workoutDateRef = useRef(new Date());
  const isSavingRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { exercisesRef.current = exercises; }, [exercises]);
  useEffect(() => { workoutDateRef.current = workoutDate; }, [workoutDate]);

  // Pre-populate from storage
  useEffect(() => {
    (async () => {
      const all = await getSessions();
      const day = all.filter(s => sessionIds.includes(s.id));
      if (day.length > 0) {
        const d = new Date(day[0].date);
        setWorkoutDate(d);
        workoutDateRef.current = d;
      }
      setExercises(
        day.flatMap(s =>
          s.exercises.map(ex => ({
            id: makeId(),
            name: ex.name,
            equipment: ex.equipment,
            sets: ex.sets.map(set => ({
              id: makeId(),
              weight: set.weight > 0 ? set.weight.toString() : '',
              reps: set.reps > 0 ? set.reps.toString() : '',
            })),
          }))
        )
      );
      setLoading(false);
    })();
  }, []);

  // ── Confirm-on-back guard ────────────────────────────────────────────────────
  useEffect(() => {
    return navigation.addListener('beforeRemove', (e) => {
      if (isSavingRef.current) return;   // saving — let it through
      e.preventDefault();
      Alert.alert(
        'Discard Changes?',
        'Going back will discard all unsaved edits.',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action) },
        ],
      );
    });
  }, [navigation]);

  // ── Save changes ─────────────────────────────────────────────────────────────
  const saveChanges = useCallback(async () => {
    const current = exercisesRef.current;
    if (current.length === 0) {
      Alert.alert('Empty Workout', 'Add at least one exercise before saving.');
      return;
    }
    const newSession = {
      id: sessionIds[0],
      date: workoutDateRef.current.toISOString(),
      exercises: current
        .map(ex => ({
          id: ex.id,
          name: ex.name,
          equipment: ex.equipment,
          sets: ex.sets.map((s, idx) => ({
            setNumber: idx + 1,
            weight: parseFloat(s.weight) || 0,
            reps: parseInt(s.reps) || 0,
          })),
        }))
        .filter(ex => ex.sets.length > 0),
    };
    if (newSession.exercises.length === 0) {
      Alert.alert('No Sets', 'Enter at least one set before saving.');
      return;
    }
    isSavingRef.current = true;
    await Promise.all(sessionIds.map(id => deleteSession(id)));
    await saveSession(newSession);
    navigation.goBack();
  }, [navigation, sessionIds]);

  // ── Header (back + save buttons) ─────────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      title: dateLabel,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 4 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={saveChanges} style={{ marginRight: 4 }}>
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 16 }}>Save</Text>
        </TouchableOpacity>
      ),
    });
  }, [saveChanges, dateLabel, navigation]);

  // ── Pick up exercise from AddExercise modal ─────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (loading) return;
      const newEx = dequeueExercise();
      if (!newEx) return;
      setExercises(prev => [
        ...prev,
        {
          id: makeId(),
          name: newEx.name,
          equipment: newEx.equipment,
          sets: [{ id: makeId(), weight: '', reps: '' }],
        },
      ]);
    }, [loading])
  );

  // ── Set / exercise helpers ───────────────────────────────────────────────────
  const addSet = (exerciseId: string) =>
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId
        ? { ...ex, sets: [...ex.sets, { id: makeId(), weight: '', reps: '' }] }
        : ex,
    ));

  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) =>
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId
        ? { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) }
        : ex,
    ));

  const removeSet = (exerciseId: string, setId: string) =>
    setExercises(prev => prev.map(ex =>
      ex.id === exerciseId
        ? { ...ex, sets: ex.sets.filter(s => s.id !== setId) }
        : ex,
    ));

  const removeExercise = (exerciseId: string) =>
    Alert.alert('Remove Exercise', 'Remove this exercise and all its sets?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive',
        onPress: () => setExercises(prev => prev.filter(e => e.id !== exerciseId)) },
    ]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Date selector */}
        <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
          <Ionicons name="calendar-outline" size={17} color={colors.accent} />
          <Text style={styles.dateText}>{formatDate(workoutDate)}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        {exercises.map(ex => (
          <View key={ex.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <View style={styles.equipBadge}>
                  <Text style={styles.equipText}>{ex.equipment}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => removeExercise(ex.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>

            <View style={styles.setHeader}>
              <Text style={[styles.setHeaderCell, { flex: 0.5 }]}>SET</Text>
              <Text style={[styles.setHeaderCell, { flex: 1 }]}>WEIGHT (kg)</Text>
              <Text style={[styles.setHeaderCell, { flex: 1 }]}>REPS</Text>
              <View style={{ width: 28 }} />
            </View>

            {ex.sets.map((set, idx) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={[styles.setNum, { flex: 0.5 }]}>{idx + 1}</Text>
                <TextInput
                  style={[styles.setInput, { flex: 1 }]}
                  value={set.weight}
                  onChangeText={v => updateSet(ex.id, set.id, 'weight', v)}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  returnKeyType="next"
                />
                <TextInput
                  style={[styles.setInput, { flex: 1 }]}
                  value={set.reps}
                  onChangeText={v => updateSet(ex.id, set.id, 'reps', v)}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => removeSet(ex.id, set.id)}
                  style={{ width: 28, alignItems: 'center' }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(ex.id)}>
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addExerciseBtn}
          onPress={() => navigation.navigate('AddExercise')}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date picker — Android shows native dialog, iOS uses bottom sheet */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={workoutDate}
          mode="date"
          onChange={(_, date) => { setShowDatePicker(false); if (date) setWorkoutDate(date); }}
          maximumDate={new Date()}
        />
      )}

      <Modal
        visible={Platform.OS === 'ios' && showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)} />
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>Workout Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
              <Text style={styles.pickerDone}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={workoutDate}
            mode="date"
            display="spinner"
            onChange={(_, date) => { if (date) setWorkoutDate(date); }}
            maximumDate={new Date()}
            textColor={colors.text}
            style={{ width: '100%' }}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  // Date row
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  // Exercise card
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  exerciseName: { fontSize: 17, fontWeight: '700', color: colors.text },
  equipBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentDim,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  equipText: { fontSize: 12, color: colors.accent, fontWeight: '600' },
  setHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  setHeaderCell: { fontSize: 10, color: colors.textSecondary, fontWeight: '700', letterSpacing: 0.5 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setNum: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', fontWeight: '600' },
  setInput: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  addSetText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  addExerciseText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  // Date picker modal
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  pickerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  pickerDone: { fontSize: 16, color: colors.accent, fontWeight: '700' },
});
