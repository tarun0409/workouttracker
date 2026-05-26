import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, FlatList,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useWorkouts } from '../../../hooks/useWorkouts';
import { useWorkoutProgress } from '../../../hooks/useWorkoutProgress';
import { colors } from '../../../constants/colors';
import { chartConfig, CHART_WIDTH } from '../../../constants/chartConfig';
import { formatShort } from '../../../utils/date';
import SectionToggle from '../../../components/ui/SectionToggle';
import StatCard from '../../../components/ui/StatCard';
import EmptyState from '../../../components/ui/EmptyState';

export default function ProgressScreen() {
  const { sessions, reload } = useWorkouts();
  const { weeklyVolume, workoutFrequency, allExerciseNames, recentPRs, getExerciseProgress } =
    useWorkoutProgress(sessions);

  const [tab, setTab] = useState<'Overall' | 'Exercise'>('Overall');
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const filteredNames = allExerciseNames.filter(n =>
    n.toLowerCase().includes(search.toLowerCase())
  );

  const exerciseProgress = selectedExercise ? getExerciseProgress(selectedExercise) : [];
  const prForSelected = selectedExercise
    ? recentPRs.find(p => p.name === selectedExercise)
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.screenTitle}>Progress</Text>

      <SectionToggle
        options={['Overall', 'Exercise']}
        selected={tab}
        onSelect={v => setTab(v as 'Overall' | 'Exercise')}
      />

      {tab === 'Overall' ? (
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
              {weeklyVolume.length > 0 ? (
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
              ) : null}

              <Text style={styles.sectionTitle}>Workouts per Week</Text>
              {workoutFrequency.length > 0 ? (
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
              ) : null}

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
      ) : (
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
                    style={styles.exerciseItem}
                    onPress={() => { setSelectedExercise(item); setSearch(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.exerciseItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noResult}>No exercises match "{search}"</Text>
                }
              />
            )
          ) : (
            <View style={styles.exerciseDetail}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setSelectedExercise(null)}
              >
                <Text style={styles.backBtnText}>← All Exercises</Text>
              </TouchableOpacity>

              <Text style={styles.selectedName}>{selectedExercise}</Text>

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
                <EmptyState icon="analytics-outline" title="Not enough data" subtitle="Log this exercise at least twice to see a chart" />
              )}
            </View>
          )}
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
  searchInput: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 13,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  exerciseItemText: { fontSize: 15, color: colors.text, fontWeight: '500' },
  noResult: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  exerciseDetail: { gap: 16 },
  backBtn: { alignSelf: 'flex-start' },
  backBtnText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  selectedName: { fontSize: 22, fontWeight: '700', color: colors.text },
  prHighlight: {
    backgroundColor: colors.accentDim,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: 'center',
    gap: 2,
  },
  prHighlightLabel: { fontSize: 11, color: colors.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  prHighlightValue: { fontSize: 32, fontWeight: '800', color: colors.accent },
  prHighlightSub: { fontSize: 13, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: 12 },
});
