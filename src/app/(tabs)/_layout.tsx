
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: '#B85C30',
        tabBarInactiveTintColor: '#999',

        tabBarStyle:
          Platform.OS === 'web'
            ? styles.webTabBar
            : styles.nativeTabBar,

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
           marginBottom: 2,

        },

        tabBarIconStyle: {
          marginTop: 3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home"
              color={color as string}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="compass"
              color={color as string}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: 'My Bookings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="calendar"
              color={color as string }
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person"
              color={color as string}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
 webTabBar: {
  backgroundColor: '#FFF1E6',
  height: 80,
  paddingTop: 6,
  paddingBottom: 14,
  borderTopWidth: 1,
  borderTopColor: '#EAD8C9',
},

  nativeTabBar: {
    backgroundColor: '#FFF1E6',
  },
});
