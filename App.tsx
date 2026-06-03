import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import TabNavigator from './src/navigation/TabNavigator';
import { colors } from './src/constants/colors';

const AppTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
    notification: colors.accent,
  },
};

// ── Startup error boundary ────────────────────────────────────────────────────
// Shows any JavaScript error that occurs during initial render as readable
// text instead of a blank screen. Remove once the blank-screen bug is fixed.
interface EBState { error: Error | null }
class StartupErrorBoundary extends React.Component<
  { children: React.ReactNode },
  EBState
> {
  state: EBState = { error: null };

  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <View style={eb.container}>
          <ScrollView contentContainerStyle={eb.scroll}>
            <Text style={eb.heading}>⚠ Startup Error</Text>
            <Text style={eb.message}>{error.message}</Text>
            <Text style={eb.stack}>{error.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  scroll: { padding: 20, paddingTop: 60 },
  heading: { fontSize: 18, fontWeight: '700', color: '#EF4444', marginBottom: 12 },
  message: { fontSize: 14, color: '#FFFFFF', marginBottom: 16, lineHeight: 20 },
  stack: { fontSize: 11, color: '#8A8A8A', fontFamily: 'Courier', lineHeight: 16 },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <StartupErrorBoundary>
      <SafeAreaProvider>
        <NavigationContainer theme={AppTheme}>
          <StatusBar style="light" />
          <TabNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </StartupErrorBoundary>
  );
}
