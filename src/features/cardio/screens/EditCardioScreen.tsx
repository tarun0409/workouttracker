import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, Modal, ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList } from '../../../navigation/types';
import { getMachine } from '../../../constants/cardioMachines';
import { getCardioSessions, saveCardioSession, deleteCardioSession } from '../../../storage/cardioStorage';
import { colors } from '../../../constants/colors';

type Nav = NativeStackNavigationProp<WorkoutStackParamList>;
type Route = RouteProp<WorkoutStackParamList, 'EditCardio'>;

interface LocalInterval {
  id: string;
  duration: string;
  metrics: Record<string, string>;
}

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function EditCardioScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { cardioSessionId, dateLabel } = route.params;

  const [loading, setLoading] = useState(true);
  const [machineId, setMachineId] = useState('');
  const [machineName, setMachineName] = useState('');
  const [intervals, setIntervals] = useState<LocalInterval[]>([]);
  const [workoutDate, setWorkoutDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const intervalsRef = useRef<LocalInterval[]>([]);
  const workoutDateRef = useRef(new Date());
  const isSavingRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => { intervalsRef.current = intervals; }, [intervals]);
  useEffect(() => { workoutDateRef.current = workoutDate; }, [workoutDate]);

  // Pre-populate from storage
  useEffect(() => {
    (async () => {
      const all = await getCardioSessions();
      const session = all.find(s => s.id === cardioSessionId);
      if (!session) { navigation.goBack(); return; }

      const machine = getMachine(session.machine);
      setMachineId(session.machine);
      setMachineName(session.machineName);

      const d = new Date(session.date);
      setWorkoutDate(d);
      workoutDateRef.current = d;

      setIntervals(
        session.intervals.map(i => ({
          id: i.id,
          duration: i.durationMinutes > 0 ? String(i.durationMinutes) : '',
          metrics: machine
            ? Object.fromEntries(
                machine.metrics.map(m => [
                  m.key,
                  i.metrics[m.key] > 0 ? String(i.metrics[m.key]) : '',
                ])
              )
            : {},
        }))
      );
      setLoading(false);
    })();
  }, []);

  // Back guard
  useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      if (isSavingRef.current) return;
      e.preventDefault();
      Alert.alert('Discard Changes?', 'Going back will discard unsaved edits.', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });
  }, [navigation]);

  const machine = getMachine(machineId);

  const addInterval = () => {
    const last = intervals[intervals.length - 1];
    setIntervals(prev => [
      ...prev,
      { id: makeId(), duration: '', metrics: { ...(last?.metrics ?? {}) } },
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

  const saveChanges = useCallback(async () => {
    if (!machine) return;
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

    isSavingRef.current = true;
    // Delete then re-save preserves the original ID (same as EditWorkout pattern).
    await deleteCardioSession(cardioSessionId);
    await saveCardioSession({
      id: cardioSessionId,
      date: workoutDateRef.current.toISOString(),
      machine: machineId,
      machineName,
      intervals: valid,
    });
    navigation.goBack();
  }, [navigation, cardioSessionId, machineId, machineName, machine]);

  // Header
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
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date row */}
        <TouchableOpacity
          style={styles.dateRow}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={17} color={colors.accent} />
          <Text style={styles.dateText}>{formatDate(workoutDate)}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
        </TouchableOpacity>

        {machine && (
          <>
            {/* Column headers */}
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
          </>
        )}
      </ScrollView>

      {/* Android date picker */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={workoutDate}
          mode="date"
          onChange={(_, date) => { setShowDatePicker(false); if (date) setWorkoutDate(date); }}
          maximumDate={new Date()}
        />
      )}

      {/* iOS date picker sheet */}
      <Modal
        visible={Platform.OS === 'ios' && showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        />
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
  scroll: { padding: 16, paddingBottom: 40 },
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
    marginBottom: 20,
  },
  dateText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  colNum: { flex: 0.4, textAlign: 'center' },
  colDuration: { flex: 0.75 },
  colMetric: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  headerCell: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
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
    backgroundColor: colors.surfaceHigh,
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
