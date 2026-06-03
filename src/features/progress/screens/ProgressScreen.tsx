import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, FlatList,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkouts } from '../../../hooks/useWorkouts';
import { useWorkoutProgress } from '../../../hooks/useWorkoutProgress';
import { useCardioProgress, formatMinutes } from '../../../hooks/useCardioProgress';
import { getCardioSessions } from '../../../storage/cardioStorage';
import { getMachine } from '../../../constants/cardioMachines';
import { CardioSession } from '../../../types';
import { colors } from '../../../constants/colors';
import { chartConfig, CHART_WIDTH } from '../../../constants/chartConfig';
import { formatShort } from '../../../utils/date';
import SectionToggle from '../../../components/ui/SectionToggle';
import StatCard from '../../../components/ui/StatCard';
import EmptyState from '../../../components/ui/EmptyState';

const cardioChartConfig = {
  ...chartConfig,
  color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
  propsForDots: { r: '5', strokeWidth: '2', stroke: colors.success },
};

type Tab = 'Overall' | 'Exercise' | 'Cardio';

export default function ProgressScreen() {
  const { sessions, reload } = useWorkouts();
  const { weeklyVolume, workoutFrequency, allExerciseNames, recentPRs, getExerciseProgress } =
    useWorkoutProgress(sessions);

  const [cardioSessions, setCardioSessions] = useState<CardioSession[]>([]);
  const { allMachines, getMachineDetail } = useCardioProgress(cardioSessions);

  const [tab, setTab] = useState<Tab>('Overall');
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      reload();
      getCardioSessions().then(setCardioSessions);
    }, [reload])
  );

  const handleTabChange = (v: string) => {
    setTab(v as Tab);
    setSelectedExercise(null);
    setSelectedMachine(null);
    setSearch('');
  };

  const filteredNames = allExerciseNames.filter(n =>
    n.toLowerCase().includes(search.toLowerCase())
  );
  const exerciseProgress = selectedExercise ? getExerciseProgress(selectedExercise) : [];
  const prForSelected = selectedExercise
    ? recentPRs.find(p => p.name === selectedExercise)
    : null;

  const machineDetail = selectedMachine ? getMachineDetail(selectedMachine) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.screenTitle}>Progress</Text>

      <SectionToggle
        options={['Overall', 'Exercise', 'Cardio']}
        selected={tab}
        onSelect={handleTabChange}
      />

      {/* ── Overall tab ─────────────────────────────────────────────────────── */}
      {tab === 'Overall' && (
        <View style={styles.section}>
          {sessions.length === 0 ? (
            <EmptyState
              icon="analytics-outline"
              title="No data yet"
              subtitle="Log some workouts to see your progress"
            />
          ) : (
            <>
              <Text style={styles.sectionTitle}>Weekly Volume (kg)</Text>
              {weeklyVolume.length > 0 && (
                <BarChart
                  data={{
                    labels: weeklyVolume.map(w => w.label),
                    datasets: [{ data: weeklyVolume.map(w => w.volume) }],
                  }}
                  width={CHART_WIDTH}
                  height={200}
                  chartConfig={chartConfig}
                  yAxisLabel=""
                  yAxisSuffix=""
                  fromZero
                  style={styles.chart}
                />
              )}

              <Text style={styles.sectionTitle}>Workouts per Week</Text>
              {workoutFrequency.length > 0 && (
                <BarChart
                  data={{
                    labels: workoutFrequency.map(w => w.label),
                    datasets: [{ data: workoutFrequency.map(w => w.count) }],
                  }}
                  width={CHART_WIDTH}
                  height={160}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                  }}
                  yAxisLabel=""
                  yAxisSuffix=""
                  fromZero
                  style={styles.chart}
                />
              )}

              {recentPRs.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Personal Records</Text>
                  {recentPRs.map(pr => (
                    <View key={pr.name} style={styles.prRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.prName}>{pr.name}</Text>
                        <Text style={styles.prEquip}>{pr.equipment} · {formatShort(pr.date)}</Text>
                      </View>
                      <View style={styles.prBadge}>
                        <Text style={styles.prWeight}>{pr.weight} kg</Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </View>
      )}

      {/* ── Exercise tab ─────────────────────────────────────────────────────── */}
      {tab === 'Exercise' && (
        <View style={styles.section}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={v => { setSearch(v); setSelectedExercise(null); }}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textSecondary}
          />

          {!selectedExercise ? (
            allExerciseNames.length === 0 ? (
              <EmptyState icon="barbell-outline" title="No exercises logged yet" />
            ) : (
              <FlatList
                data={filteredNames}
                keyExtractor={item => item}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => { setSelectedExercise(item); setSearch(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.listItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noResult}>No exercises match "{search}"</Text>
                }
              />
            )
          ) : (
            <View style={styles.detail}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedExercise(null)}>
                <Text style={styles.backBtnText}>← All Exercises</Text>
              </TouchableOpacity>

              <Text style={styles.detailTitle}>{selectedExercise}</Text>

              {prForSelected && (
                <View style={styles.prHighlight}>
                  <Text style={styles.prHighlightLabel}>All-time PR</Text>
                  <Text style={styles.prHighlightValue}>{prForSelected.weight} kg</Text>
                  <Text style={styles.prHighlightSub}>{formatShort(prForSelected.date)}</Text>
                </View>
              )}

              {exerciseProgress.length >= 2 ? (
                <>
                  <Text style={styles.sectionTitle}>Max Weight (kg)</Text>
                  <LineChart
                    data={{
                      labels: exerciseProgress.map(p => {
                        const d = new Date(p.date + 'T12:00:00');
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }),
                      datasets: [{ data: exerciseProgress.map(p => p.maxWeight) }],
                    }}
                    width={CHART_WIDTH}
                    height={200}
                    chartConfig={chartConfig}
                    bezier
                    style={styles.chart}
                  />
                  <Text style={styles.sectionTitle}>Volume per Session (kg)</Text>
                  <BarChart
                    data={{
                      labels: exerciseProgress.map(p => {
                        const d = new Date(p.date + 'T12:00:00');
                        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                      }),
                      datasets: [{ data: exerciseProgress.map(p => p.volume) }],
                    }}
                    width={CHART_WIDTH}
                    height={200}
                    chartConfig={chartConfig}
                    yAxisLabel=""
                    yAxisSuffix=""
                    fromZero
                    style={styles.chart}
                  />
                </>
              ) : exerciseProgress.length === 1 ? (
                <View style={styles.statsRow}>
                  <StatCard label="Max Weight" value={`${exerciseProgress[0].maxWeight} kg`} accent />
                  <StatCard label="Volume" value={`${exerciseProgress[0].volume} kg`} />
                </View>
              ) : (
                <EmptyState
                  icon="analytics-outline"
                  title="Not enough data"
                  subtitle="Log this exercise at least twice to see a chart"
                />
              )}
            </View>
          )}
        </View>
      )}

      {/* ── Cardio tab ───────────────────────────────────────────────────────── */}
      {tab === 'Cardio' && (
        <View style={styles.section}>
          {cardioSessions.length === 0 ? (
            <EmptyState
              icon="heart-outline"
              title="No cardio logged yet"
              subtitle="Tap + on the Workouts tab to log your first cardio session"
            />
          ) : !selectedMachine ? (
            // Machine list
            <>
              <Text style={styles.sectionTitle}>Your Machines</Text>
              {allMachines.map(m => {
                const machine = getMachine(m.machineId);
                return (
                  <TouchableOpacity
                    key={m.machineId}
                    style={styles.machineCard}
                    onPress={() => setSelectedMachine(m.machineId)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.machineIconWrap}>
                      <Ionicons
                        name={(machine?.icon ?? 'fitness-outline') as any}
                        size={22}
                        color={colors.success}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.machineName}>{m.machineName}</Text>
                      <Text style={styles.machineMeta}>
                        {m.sessionCount} {m.sessionCount === 1 ? 'session' : 'sessions'}
                        {' · '}{formatMinutes(m.totalMinutes)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.border} />
                  </TouchableOpacity>
                );
              })}
            </>
          ) : machineDetail ? (
            // Machine drill-down
            <View style={styles.detail}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedMachine(null)}>
                <Text style={styles.backBtnText}>← All Machines</Text>
              </TouchableOpacity>

              {/* Title */}
              <View style={styles.detailHeader}>
                {(() => {
                  const machine = getMachine(selectedMachine);
                  return (
                    <View style={styles.machineIconWrapLg}>
                      <Ionicons
                        name={(machine?.icon ?? 'fitness-outline') as any}
                        size={26}
                        color={colors.success}
                      />
                    </View>
                  );
                })()}
                <Text style={styles.detailTitle}>{machineDetail.machineName}</Text>
              </View>

              {/* Summary stats */}
              <View style={styles.statsRow}>
                <StatCard
                  label="Sessions"
                  value={String(machineDetail.totalSessions)}
                />
                <StatCard
                  label="Total Time"
                  value={formatMinutes(machineDetail.totalMinutes)}
                />
              </View>

              {/* Weekly minutes bar chart */}
              <Text style={styles.sectionTitle}>Weekly Minutes</Text>
              <BarChart
                data={{
                  labels: machineDetail.weeklyMinutes.map(w => w.label),
                  datasets: [{ data: machineDetail.weeklyMinutes.map(w => w.minutes) }],
                }}
                width={CHART_WIDTH}
                height={180}
                chartConfig={cardioChartConfig}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                style={styles.chart}
              />

              {/* Primary metric line chart — only if 2+ sessions */}
              {machineDetail.sessionPoints.length >= 2 && machineDetail.primaryLabel ? (
                <>
                  <Text style={styles.sectionTitle}>{machineDetail.primaryLabel}</Text>
                  <LineChart
                    data={{
                      labels: machineDetail.sessionPoints.map(p => p.label),
                      datasets: [{ data: machineDetail.sessionPoints.map(p => p.avgPrimary) }],
                    }}
                    width={CHART_WIDTH}
                    height={200}
                    chartConfig={{
                      ...cardioChartConfig,
                      decimalPlaces: machineDetail.primaryDecimal ? 1 : 0,
                    }}
                    bezier
                    style={styles.chart}
                  />
                </>
              ) : machineDetail.sessionPoints.length === 1 &&
                machineDetail.primaryLabel ? (
                <View style={styles.statsRow}>
                  <StatCard
                    label="Last Session"
                    value={`${machineDetail.sessionPoints[0].totalMinutes} min`}
                  />
                  <StatCard
                    label={machineDetail.primaryLabel}
                    value={String(machineDetail.sessionPoints[0].avgPrimary)}
                  />
                </View>
              ) : null}

              {/* Minutes per session line chart — only if 2+ sessions */}
              {machineDetail.sessionPoints.length >= 2 && (
                <>
                  <Text style={styles.sectionTitle}>Minutes per Session</Text>
                  <LineChart
                    data={{
                      labels: machineDetail.sessionPoints.map(p => p.label),
                      datasets: [{ data: machineDetail.sessionPoints.map(p => p.totalMinutes) }],
                    }}
                    width={CHART_WIDTH}
                    height={180}
                    chartConfig={{ ...cardioChartConfig, decimalPlaces: 0 }}
                    bezier
                    style={styles.chart}
                  />
                </>
              )}
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },
  screenTitle: { fontSize: 28, fontWeight: '700', color: colors.text },
  section: { gap: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  chart: { borderRadius: 12, marginLeft: -16 },

  // Strength PR rows
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prName: { fontSize: 15, fontWeight: '600', color: colors.text },
  prEquip: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  prBadge: {
    backgroundColor: colors.accentDim,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  prWeight: { fontSize: 15, fontWeight: '700', color: colors.accent },

  // Search / list
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 13,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  listItemText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  noResult: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },

  // Drill-down shared
  detail: { gap: 16 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  backBtn: { alignSelf: 'flex-start' },
  backBtnText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 12 },

  // PR highlight (exercise tab)
  prHighlight: {
    backgroundColor: colors.accentDim,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    gap: 2,
  },
  prHighlightLabel: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  prHighlightValue: { fontSize: 32, fontWeight: '800', color: colors.accent },
  prHighlightSub: { fontSize: 13, color: colors.textSecondary },

  // Machine cards (cardio tab)
  machineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  machineIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineIconWrapLg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  machineName: { fontSize: 15, fontWeight: '600', color: colors.text },
  machineMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
