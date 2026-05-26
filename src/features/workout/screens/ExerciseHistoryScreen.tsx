import React, { useEffect, useState } from 'react';
import {
  View, Text, SectionList, StyleSheet, ActivityIndicator,
  TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList } from '../../../navigation/types';
import { getSessions, renameExercise } from '../../../storage/workoutStorage';
import { colors } from '../../../constants/colors';
import { formatShort, toDateStr } from '../../../utils/date';
import EmptyState from '../../../components/ui/EmptyState';

type Route = RouteProp<WorkoutStackParamList, 'ExerciseHistory'>;

interface SetEntry { setNumber: number; weight: number; reps: number; }
interface HistorySection {
  title: string;
  dateKey: string;
  data: SetEntry[];
  maxWeight: number;
}

function toTitleCase(str: string) {
  return str.trim().replace(/\b\w/g, c => c.toUpperCase());
}

export default function ExerciseHistoryScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { equipment } = route.params;

  // Drives both the header title and data query
  const [currentName, setCurrentName] = useState(route.params.name);
  const [sections, setSections] = useState<HistorySection[]>([]);
  const [pr, setPr] = useState(0);
  const [loading, setLoading] = useState(true);

  // Rename modal
  const [showRename, setShowRename] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  // Update header title + pencil icon whenever currentName changes
  useEffect(() => {
    navigation.setOptions({
      title: currentName,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => { setRenameInput(currentName); setShowRename(true); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ marginRight: 4 }}
        >
          <Ionicons name="pencil-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      ),
    });
  }, [currentName, navigation]);

  // Reload history whenever currentName changes (post-rename)
  useEffect(() => {
    setLoading(true);
    getSessions().then(sessions => {
      let allTimePR = 0;
      const raw: HistorySection[] = [];

      sessions.forEach(session => {
        const ex = session.exercises.find(
          e =>
            e.name.toLowerCase() === currentName.toLowerCase() &&
            e.equipment === equipment
        );
        if (!ex) return;

        const maxW = Math.max(...ex.sets.map(s => s.weight));
        if (maxW > allTimePR) allTimePR = maxW;

        raw.push({
          title: formatShort(session.date),
          dateKey: toDateStr(new Date(session.date)),
          data: ex.sets,
          maxWeight: maxW,
        });
      });

      raw.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
      setSections(raw);
      setPr(allTimePR);
      setLoading(false);
    });
  }, [currentName, equipment]);

  const handleRename = async () => {
    const newName = toTitleCase(renameInput);
    if (!newName || newName.toLowerCase() === currentName.toLowerCase()) {
      setShowRename(false);
      return;
    }
    await renameExercise(currentName, equipment, newName);
    setCurrentName(newName); // triggers data reload
    setShowRename(false);
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
      {/* Equipment badge + PR */}
      <View style={styles.topBar}>
        <View style={styles.equipBadge}>
          <Text style={styles.equipText}>{equipment}</Text>
        </View>
        {pr > 0 && (
          <View style={styles.prBadge}>
            <Text style={styles.prLabel}>PR</Text>
            <Text style={styles.prValue}>{pr} kg</Text>
          </View>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `set-${index}`}
        contentContainerStyle={sections.length === 0 ? { flex: 1 } : styles.list}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionDate}>{section.title}</Text>
            <Text style={styles.sectionMax}>Peak: {section.maxWeight} kg</Text>
          </View>
        )}
        renderSectionFooter={() => <View style={styles.sectionGap} />}
        renderItem={({ item }) => (
          <View style={styles.setRow}>
            <Text style={styles.setNum}>Set {item.setNumber}</Text>
            <View style={styles.setValues}>
              <View style={styles.valueChip}>
                <Text style={styles.valueText}>{item.weight} kg</Text>
              </View>
              <Text style={styles.valueSep}>×</Text>
              <View style={styles.valueChip}>
                <Text style={styles.valueText}>{item.reps} reps</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="barbell-outline"
            title="No history yet"
            subtitle={`Log ${currentName} to see your sets here`}
          />
        }
      />

      {/* Rename modal */}
      <Modal
        visible={showRename}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRename(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename Exercise</Text>
            <Text style={styles.modalSub}>
              Updates "{currentName}" across all past sessions.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={renameInput}
              onChangeText={setRenameInput}
              placeholder="New name"
              placeholderTextColor={colors.textSecondary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleRename}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setShowRename(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleRename}>
                <Text style={styles.modalSaveText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  equipBadge: { backgroundColor: colors.accentDim, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  equipText: { fontSize: 13, color: colors.accent, fontWeight: '700' },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  prLabel: { fontSize: 11, color: colors.accent, fontWeight: '700', letterSpacing: 1 },
  prValue: { fontSize: 18, color: colors.accent, fontWeight: '800' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionDate: {
    fontSize: 13, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  sectionMax: { fontSize: 12, color: colors.textSecondary },
  sectionGap: { height: 4 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setNum: { fontSize: 14, color: colors.text, fontWeight: '600' },
  setValues: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  valueChip: { backgroundColor: colors.surfaceHigh, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  valueText: { fontSize: 14, color: colors.text, fontWeight: '600' },
  valueSep: { fontSize: 14, color: colors.textSecondary },
  // Rename modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalSub: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  modalInput: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancel: {
    flex: 1, backgroundColor: colors.surfaceHigh, borderRadius: 12, padding: 14, alignItems: 'center',
  },
  modalCancelText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  modalSave: { flex: 1, backgroundColor: colors.accent, borderRadius: 12, padding: 14, alignItems: 'center' },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
