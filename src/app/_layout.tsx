
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  Stack,
} from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';
import {
  useColorScheme,
  View,
  Platform,
  StyleSheet,
} from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <AnimatedSplashOverlay />

      <View
        style={
          Platform.OS === 'web'
            ? styles.webAppContainer
            : styles.nativeAppContainer
        }
      >
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            gestureEnabled: true,
          }}
        >
          {/* Customer Tabs */}
          <Stack.Screen name="(tabs)" />

          {/* Service Details */}
          <Stack.Screen name="service-details" />

          {/* Booking */}
          <Stack.Screen name="booking" />

          {/* Customer Authentication */}
          <Stack.Screen name="auth" />

          {/* Booking Confirmation */}
          <Stack.Screen name="booking-confirmation" />

          {/* Edit Booking */}
          <Stack.Screen name="edit-booking" />

          {/* Customer Support Chat */}
          <Stack.Screen name="support-chat" />

          {/* Admin Login */}
          <Stack.Screen name="admin-login" />

          {/* Admin Dashboard */}
          <Stack.Screen name="admin-dashboard" />

          {/* Admin Chat */}
          <Stack.Screen name="admin-chat" />
        </Stack>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  nativeAppContainer: {
    flex: 1,
  },

  webAppContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: '#FFF1E5',
  },
});
