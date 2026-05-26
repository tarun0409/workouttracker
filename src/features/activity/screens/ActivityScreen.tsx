import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { useSettings } from '../../../hooks/useSettings';
import { useSteps } from '../../../hooks/useSteps';
import { getAllSteps } from '../../../storage/stepsStorage';
import { getSessions } from '../../../storage/workoutStorage';
import { colors } from '../../../constants/colors';
import { chartConfig, CHART_WIDTH } from '../../../constants/chartConfig';
import { toDateStr } from '../../../utils/date';
import EmptyState from '../../../components/ui/EmptyState';
import { DailySteps } from '../../../types';

const RING_RADIUS = 70;
const RING_STROKE = 10;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const today = new Date();

interface TodayExercise {
  name: string;
  equipment: string;
  setCount: number;
}

export default function ActivityScreen() {
  const { settings } = useSettings();
  const { steps, setManual } = useSteps(today, settings.stepsMode);
  const [manualInput, setManualInput] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [weekHistory, setWeekHistory] = useState<DailySteps[]>([]);
  const [todayExercises, setTodayExercises] = useState<TodayExercise[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
      loadTodayWorkout();
    }, [])
  );

  const loadHistory = async () => {
    const all = await getAllSteps();
    const last7: DailySteps[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toDateStr(d);
      const found = all.find(s => s.date === dateStr);
      last7.push(found ?? { date: dateStr, count: 0, source: 'auto' });
    }
    setWeekHistory(last7);
  };

  const loadTodayWorkout = async () => {
    const sessions = await getSessions();
    const todayStr = toDateStr(new Date());
    const exercises: TodayExercise[] = [];
    sessions
      .filter(s => toDateStr(new Date(s.date)) === todayStr)
      .forEach(session => {
        session.exercises.forEach(ex => {
          exercises.push({
            name: ex.name,
            equipment: ex.equipment,
            setCount: ex.sets.length,
          });
        });
      });
    setTodayExercises(exercises);
  };

  const goal = settings.dailyStepGoal;
  const stepCount = steps ?? 0;
  const progress = Math.min(stepCount / goal, 1);
  const strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
  const ringColor = progress >= 1 ? colors.success : colors.accent;

  const handleSaveManual = async () => {
    const val = parseInt(manualInput);
    if (!isNaN(val) && val >= 0) {
      await setManual(val);
      await loadHistory();
      setShowManualModal(false);
      setManualInput('');
    }
  };

  const chartLabels = weekHistory.map(d => {
    const date = new Date(d.date + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
  });
  const chartData = weekHistory.map(d => d.count);
  const hasChartData = chartData.some(v => v > 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.screenTitle}>Activity</Text>
      <Text style={styles.dateLabel}>
        {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
      </Text>

      {/* Step ring */}
      <View style={styles.ringContainer}>
        <Svg width={RING_RADIUS * 2 + RING_STROKE * 2} height={RING_RADIUS * 2 + RING_STROKE * 2}>
          <Circle
            cx={RING_RADIUS + RING_STROKE} cy={RING_RADIUS + RING_STROKE}
            r={RING_RADIUS} stroke={colors.border} strokeWidth={RING_STROKE} fill="none"
          />
          <Circle
            cx={RING_RADIUS + RING_STROKE} cy={RING_RADIUS + RING_STROKE}
            r={RING_RADIUS} stroke={ringColor} strokeWidth={RING_STROKE} fill="none"
            strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" rotation="-90"
            origin={`${RING_RADIUS + RING_STROKE}, ${RING_RADIUS + RING_STROKE}`}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Text style={styles.stepCount}>{stepCount.toLocaleString()}</Text>
          <Text style={styles.stepLabel}>steps</Text>
          <Text style={styles.stepGoal}>/ {goal.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.sourceRow}>
        <Text style={styles.sourceLabel}>
          {settings.stepsMode === 'manual' ? 'Manual entry' : 'Auto (pedometer)'}
        </Text>
        {settings.stepsMode === 'manual' && (
          <TouchableOpacity style={styles.manualBtn} onPress={() => setShowManualModal(true)}>
            <Text style={styles.manualBtnText}>Edit today</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Today's gym workout */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Workout</Text>
        {todayExercises.length === 0 ? (
          <View style={styles.noWorkoutCard}>
            <Text style={styles.noWorkoutText}>No workout logged today</Text>
          </View>
        ) : (
          <View style={styles.workoutCard}>
            {todayExercises.map((ex, i) => (
              <View
                key={`${ex.name}-${ex.equipment}-${i}`}
                style={[styles.workoutRow, i < todayExercises.length - 1 && styles.workoutRowBorder]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.workoutName}>{ex.name}</Text>
                  <View style={styles.equipBadge}>
                    <Text style={styles.equipText}>{ex.equipment}</Text>
                  </View>
                </View>
                <Text style={styles.workoutSets}>{ex.setCount} sets</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 7-day step chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Steps — Last 7 Days</Text>
        {hasChartData ? (
          <BarChart
            data={{ labels: chartLabels, datasets: [{ data: chartData }] }}
            width={CHART_WIDTH}
            height={200}
            chartConfig={chartConfig}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero
            style={styles.chart}
            showValuesOnTopOfBars={false}
          />
        ) : (
          <EmptyState
            icon="walk-outline"
            title="No step data yet"
            subtitle="Walk with your phone or enter steps manually"
          />
        )}
      </View>

      {/* Manual entry modal */}
      <Modal visible={showManualModal} transparent animationType="slide">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter Steps for Today</Text>
            <TextInput
              style={styles.modalInput}
              value={manualInput}
              onChangeText={setManualInput}
              keyboardType="number-pad"
              placeholder="e.g. 8500"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setShowManualModal(false); setManualInput(''); }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveManual}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  screenTitle: { fontSize: 28, fontWeight: '700', color: colors.text },
  dateLabel: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 32 },
  ringContainer: { alignItems: 'center', justifyContent: 'center', marginBottom: 16, position: 'relative' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  stepCount: { fontSize: 32, fontWeight: '800', color: colors.text },
  stepLabel: { fontSize: 14, color: colors.textSecondary },
  stepGoal: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 32 },
  sourceLabel: { fontSize: 13, color: colors.textSecondary },
  manualBtn: { backgroundColor: colors.accentDim, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  manualBtnText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  section: { gap: 12, marginBottom: 28 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  noWorkoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  noWorkoutText: { fontSize: 14, color: colors.textSecondary },
  workoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  workoutRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  workoutRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  workoutName: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 3 },
  equipBadge: { alignSelf: 'flex-start', backgroundColor: colors.accentDim, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  equipText: { fontSize: 11, color: colors.accent, fontWeight: '600' },
  workoutSets: { fontSize: 13, color: colors.textSecondary },
  chart: { borderRadius: 12, marginLeft: -16 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalInput: { backgroundColor: colors.surfaceHigh, borderRadius: 12, padding: 14, color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center', borderWidth: 1, borderColor: colors.border },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, backgroundColor: colors.surfaceHigh, borderRadius: 12, padding: 14, alignItems: 'center' },
  modalCancelText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  modalSave: { flex: 1, backgroundColor: colors.accent, borderRadius: 12, padding: 14, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
