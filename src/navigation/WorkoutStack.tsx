import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutStackParamList } from './types';
import WorkoutListScreen from '../features/workout/screens/WorkoutListScreen';
import DayDetailScreen from '../features/workout/screens/DayDetailScreen';
import EditWorkoutScreen from '../features/workout/screens/EditWorkoutScreen';
import ActiveWorkoutScreen from '../features/workout/screens/ActiveWorkoutScreen';
import AddExerciseScreen from '../features/workout/screens/AddExerciseScreen';
import ExerciseHistoryScreen from '../features/workout/screens/ExerciseHistoryScreen';
import SettingsScreen from '../features/settings/screens/SettingsScreen';
import SelectMachineScreen from '../features/cardio/screens/SelectMachineScreen';
import LogCardioScreen from '../features/cardio/screens/LogCardioScreen';
import EditCardioScreen from '../features/cardio/screens/EditCardioScreen';
import { colors } from '../constants/colors';

const Stack = createNativeStackNavigator<WorkoutStackParamList>();

export default function WorkoutStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen
        name="WorkoutList"
        component={WorkoutListScreen}
        options={({ navigation }) => ({
          title: 'Workouts',
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="DayDetail"
        component={DayDetailScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="EditWorkout"
        component={EditWorkoutScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ title: 'New Workout' }}
      />
      <Stack.Screen
        name="AddExercise"
        component={AddExerciseScreen}
        options={{ title: 'Add Exercise', presentation: 'modal' }}
      />
      <Stack.Screen
        name="ExerciseHistory"
        component={ExerciseHistoryScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings', presentation: 'modal' }}
      />
      <Stack.Screen
        name="SelectMachine"
        component={SelectMachineScreen}
        options={{ title: 'Select Machine' }}
      />
      <Stack.Screen
        name="LogCardio"
        component={LogCardioScreen}
        options={{ title: '' }}
      />
      <Stack.Screen
        name="EditCardio"
        component={EditCardioScreen}
        options={{ title: '' }}
      />
    </Stack.Navigator>
  );
}
