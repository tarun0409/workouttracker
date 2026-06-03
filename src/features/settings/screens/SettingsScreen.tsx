import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Switch, TextInput,
  TouchableOpacity, Platform, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useSettings } from '../../../hooks/useSettings';
import { clearAllData } from '../../../storage/clearAllData';
import { exportData, importData } from '../../../storage/backupStorage';
import { colors } from '../../../constants/colors';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { settings, loaded, update } = useSettings();
  const [goalInput, setGoalInput] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  if (!loaded) return null;

  const isAuto = settings.stepsMode === 'auto';
  const platformLabel = Platform.OS === 'ios' ? 'Auto (iPhone Pedometer)' : 'Auto (Android Pedometer)';

  const handleGoalSave = () => {
    const val = parseInt(goalInput);
    if (!isNaN(val) && val > 0) {
      update({ dailyStepGoal: val });
      setEditingGoal(false);
      setGoalInput('');
    } else {
      Alert.alert('Invalid', 'Please enter a positive number.');
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await exportData();
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `workout_backup_${dateStr}.json`;
      const fileUri = (FileSystem.documentDirectory ?? '') + fileName;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Workout Data',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Saved', `Backup saved to:\n${fileUri}`);
      }
    } catch (e: any) {
      Alert.alert('Export Failed', e?.message ?? 'An unknown error occurred.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      setImporting(true);
      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const data = JSON.parse(content);
      await importData(data);
      Alert.alert(
        'Import Successful',
        'Your data has been restored. Please restart the app to see all changes.',
      );
    } catch (e: any) {
      Alert.alert('Import Failed', e?.message ?? 'Invalid or corrupted backup file.');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'This will permanently delete all workouts, step history, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Done', 'All data has been cleared.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.groupLabel}>Steps Tracking</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{isAuto ? platformLabel : 'Manual Entry'}</Text>
            <Text style={styles.rowSub}>
              {isAuto
                ? 'Steps counted automatically when phone is on you'
                : 'You enter your step count manually each day'}
            </Text>
          </View>
          <Switch
            value={isAuto}
            onValueChange={v => update({ stepsMode: v ? 'auto' : 'manual' })}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <Text style={[styles.groupLabel, { marginTop: 24 }]}>Daily Step Goal</Text>
      <View style={styles.card}>
        {editingGoal ? (
          <View style={styles.goalEditRow}>
            <TextInput
              style={styles.goalInput}
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="number-pad"
              placeholder={settings.dailyStepGoal.toString()}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleGoalSave}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => { setEditingGoal(false); setGoalInput(''); }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.row}
            onPress={() => { setEditingGoal(true); setGoalInput(settings.dailyStepGoal.toString()); }}
            activeOpacity={0.7}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Target Steps</Text>
              <Text style={styles.rowSub}>Shown as the ring goal on the Activity screen</Text>
            </View>
            <Text style={styles.goalValue}>{settings.dailyStepGoal.toLocaleString()}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.note}>
        {Platform.OS === 'android'
          ? 'On Android, auto mode counts steps since the last device reboot.'
          : 'On iPhone, auto mode reads from CoreMotion and works even when the app is closed.'}
      </Text>

      {/* ── Backup & Restore ── */}
      <Text style={[styles.groupLabel, { marginTop: 32 }]}>Backup & Restore</Text>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.row}
          onPress={handleExport}
          disabled={exporting}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Export Data</Text>
            <Text style={styles.rowSub}>Save workouts, cardio and steps as a JSON file</Text>
          </View>
          {exporting
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
        </TouchableOpacity>

        <View style={styles.cardDivider} />

        <TouchableOpacity
          style={styles.row}
          onPress={handleImport}
          disabled={importing}
          activeOpacity={0.7}
        >
          <Ionicons name="cloud-download-outline" size={20} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Import Data</Text>
            <Text style={styles.rowSub}>Restore from a previously exported backup</Text>
          </View>
          {importing
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />}
        </TouchableOpacity>
      </View>

      {/* ── Danger Zone ── */}
      <Text style={[styles.groupLabel, { marginTop: 32 }]}>Danger Zone</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.dangerRow} onPress={handleReset} activeOpacity={0.7}>
          <Text style={styles.dangerText}>Reset All Data</Text>
          <Text style={styles.dangerSub}>Permanently delete all workouts and step history</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 60 },
  groupLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardDivider: { height: 1, backgroundColor: colors.border },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  goalValue: { fontSize: 20, fontWeight: '700', color: colors.accent },
  goalEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  goalInput: {
    flex: 1,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 10,
    padding: 10,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  saveBtnText: { color: '#fff', fontWeight: '700' },
  cancelBtn: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600' },
  note: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 12,
    lineHeight: 18,
  },
  dangerRow: { padding: 16 },
  dangerText: { fontSize: 15, fontWeight: '600', color: colors.danger },
  dangerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
