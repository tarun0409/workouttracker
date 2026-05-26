import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { RootTabParamList } from './types';
import WorkoutStack from './WorkoutStack';
import ActivityScreen from '../features/activity/screens/ActivityScreen';
import ProgressScreen from '../features/progress/screens/ProgressScreen';
import { colors } from '../constants/colors';

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'Log') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Activity') {
            iconName = focused ? 'walk' : 'walk-outline';
          } else {
            iconName = focused ? 'analytics' : 'analytics-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Log" component={WorkoutStack} options={{ title: 'Log' }} />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          headerShown: true,
          headerTitle: '',
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
        }}
      />
    </Tab.Navigator>
  );
}
