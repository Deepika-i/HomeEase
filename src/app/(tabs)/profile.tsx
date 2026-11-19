
import { useCallback, useState, useEffect, useRef } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';

import {
  useRouter,
  useFocusEffect,
} from 'expo-router';

import {
  signOut,
  type User,
} from 'firebase/auth';

import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

import { auth, db } from '../../lib/firebase';

import AnimatedButton from '@/components/animated-button';
import AnimatedCard from '@/components/animated-card';

// Animated HomeEase loading screen
function ProfileLoadingScreen() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.loadingIconCircle,
          { transform: [{ scale: pulse }] },
        ]}
      >
        <Text style={styles.loadingHouse}>🏡</Text>
      </Animated.View>

      <Text style={styles.loadingBrand}>HomeEase</Text>

      <Text style={styles.loadingTagline}>
        Your Home, Our Care.
      </Text>

      <ActivityIndicator
        size="large"
        color="#B85D32"
        style={styles.loadingSpinner}
      />

      <Text style={styles.loadingMessage}>
        Loading your profile...
      </Text>

      <Text style={styles.loadingSubtext}>
        Please wait a moment
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const [name, setName] = useState('Guest');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load the current customer's profile
  const loadProfile = useCallback(async () => {
    setLoading(true);

    try {
      await auth.authStateReady();

      const currentUser = auth.currentUser;

      setUser(currentUser);

      if (!currentUser) {
        setName('Guest');
        setEmail('');
        setPhone('');
        setEditing(false);
        return;
      }

      const profileRef = doc(db, 'users', currentUser.uid);

      const profileSnapshot = await getDoc(profileRef);

      if (profileSnapshot.exists()) {
        const profileData = profileSnapshot.data();

        setName(
          profileData.name ||
          currentUser.displayName ||
          'HomeEase Customer'
        );

        setPhone(profileData.phone || '');
      } else {
        setName(
          currentUser.displayName || 'HomeEase Customer'
        );

        setPhone('');
      }

      setEmail(currentUser.email || '');
    } catch (error) {
      console.log('Profile loading error:', error);

      Alert.alert(
        'Error',
        'Unable to load your profile information.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload profile whenever this tab is opened
  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  // Save profile information to Firestore
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert(
        'Login Required',
        'Please login to update your profile.'
      );

      router.push('/auth');
      return;
    }

    try {
      setSaving(true);

      const profileRef = doc(
        db,
        'users',
        currentUser.uid
      );

      await setDoc(
        profileRef,
        {
          name: name.trim(),
          phone: phone.trim(),
          email: currentUser.email || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setName(name.trim());
      setEditing(false);

      Alert.alert(
        'Success',
        'Profile updated successfully!'
      );
    } catch (error) {
      console.log('Profile saving error:', error);

      Alert.alert(
        'Error',
        'Unable to update your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);

              setUser(null);
              setName('Guest');
              setEmail('');
              setPhone('');
              setEditing(false);

              router.replace('/(tabs)');
            } catch (error) {
              console.log('Logout error:', error);

              Alert.alert(
                'Error',
                'Unable to logout. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'My Bookings',
      subtitle: 'View and track your service requests',
      icon: '📋',
      action: () => router.push('/(tabs)/bookings'),
    },
    {
      title: 'Saved Addresses',
      subtitle: 'Manage your home, work and other addresses',
      icon: '📍',
      action: () => {
        if (!auth.currentUser) {
          Alert.alert(
            'Login Required',
            'Please login to manage your saved addresses.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Login',
                onPress: () => router.push('/auth'),
              },
            ]
          );
          return;
        }

        router.push('/saved-addresses');
      },
    },
    {
      title: 'About HomeEase',
      subtitle: 'Learn more about our services',
      icon: '🏠',
      action: () =>
        Alert.alert(
          'About HomeEase',
          'HomeEase – Your Home, Our Care.'
        ),
    },
    {
      title: 'Help & Support',
      subtitle: 'Chat with HomeEase Support',
      icon: '💬',
      action: () => router.push('/support-chat'),
    },
  ];

  if (loading) {
    return <ProfileLoadingScreen />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AnimatedCard>
        <Text style={styles.heading}>My Profile</Text>

        <Text style={styles.subtitle}>
          Manage your account and preferences
        </Text>
      </AnimatedCard>

      {/* Profile Header */}
      <AnimatedCard style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.trim().charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>

        <Text style={styles.profileName}>
          {name}
        </Text>

        <Text style={styles.profileEmail}>
          {email || 'Guest account'}
        </Text>

        {user ? (
          <AnimatedButton
            style={styles.editButton}
            onPress={() => setEditing(!editing)}
          >
            <Text style={styles.editButtonText}>
              {editing ? 'Close Edit' : 'Edit Profile'}
            </Text>
          </AnimatedButton>
        ) : (
          <AnimatedButton
            style={styles.editButton}
            onPress={() => router.push('/auth')}
          >
            <Text style={styles.editButtonText}>
              Login / Sign Up
            </Text>
          </AnimatedButton>
        )}
      </AnimatedCard>

      {/* Edit Profile */}
      {editing && user && (
        <AnimatedCard style={styles.section}>
          <Text style={styles.sectionTitle}>
            Edit Your Details
          </Text>

          <Text style={styles.label}>Full Name</Text>

          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#A18C81"
          />

          <Text style={styles.label}>Email Address</Text>

          <View style={styles.emailBox}>
            <Text style={styles.emailText}>
              {email}
            </Text>
          </View>

          <Text style={styles.helperText}>
            Your login email is managed by Firebase Authentication.
          </Text>

          <Text style={styles.label}>Phone Number</Text>

          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter your phone number"
            placeholderTextColor="#A18C81"
            keyboardType="phone-pad"
          />

          <AnimatedButton
            style={[
              styles.saveButton,
              saving && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                Save Changes
              </Text>
            )}
          </AnimatedButton>
        </AnimatedCard>
      )}

      {/* Account Information */}
      <AnimatedCard style={styles.section} delay={100}>
        <Text style={styles.sectionTitle}>
          Account Information
        </Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Full Name</Text>
          <Text style={styles.infoValue}>{name}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email Address</Text>
          <Text style={styles.infoValue}>
            {email || 'Not logged in'}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Phone Number</Text>
          <Text style={styles.infoValue}>
            {phone || 'Not added yet'}
          </Text>
        </View>
      </AnimatedCard>

      {/* Menu Options */}
      <AnimatedCard style={styles.section} delay={150}>
        <Text style={styles.sectionTitle}>More</Text>

        {menuItems.map((item) => (
          <AnimatedButton
            key={item.title}
            style={styles.menuItem}
            onPress={item.action}
          >
            <Text style={styles.menuIcon}>
              {item.icon}
            </Text>

            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>
                {item.title}
              </Text>

              <Text style={styles.menuSubtitle}>
                {item.subtitle}
              </Text>
            </View>

            <Text style={styles.arrow}>›</Text>
          </AnimatedButton>
        ))}
      </AnimatedCard>

      {/* Logout */}
      {user && (
        <AnimatedButton
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>
            Logout
          </Text>
        </AnimatedButton>
      )}

      <AnimatedCard>
        <Text style={styles.footer}>
          HomeEase – Your Home, Our Care.
        </Text>
      </AnimatedCard>

      {/* Admin Portal */}
      <AnimatedButton
        style={styles.adminPortalButton}
        onPress={() => router.push('/admin-login')}
      >
        <Text style={styles.adminPortalText}>
          Admin Portal
        </Text>
      </AnimatedButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1E5',
  },

  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 35,
  },

  heading: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#392D28',
  },

  subtitle: {
    fontSize: 14,
    color: '#8C756A',
    marginTop: 6,
    marginBottom: 22,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  avatar: {
    width: 75,
    height: 75,
    borderRadius: 40,
    backgroundColor: '#E9A66F',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#392D28',
  },

  profileName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#392D28',
    marginTop: 12,
  },

  profileEmail: {
    fontSize: 13,
    color: '#8C756A',
    marginTop: 5,
  },

  editButton: {
    backgroundColor: '#B85D32',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 9,
    marginTop: 16,
    alignItems: 'center',
  },

  editButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  section: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#392D28',
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    color: '#8C756A',
    marginTop: 12,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 9,
    padding: 12,
    fontSize: 14,
    color: '#392D28',
    backgroundColor: '#FFFAF6',
  },

  emailBox: {
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 9,
    padding: 12,
    backgroundColor: '#F8F0E9',
  },

  emailText: {
    fontSize: 14,
    color: '#8C756A',
  },

  helperText: {
    fontSize: 11,
    color: '#8C756A',
    marginTop: 5,
  },

  saveButton: {
    backgroundColor: '#B85D32',
    padding: 13,
    borderRadius: 9,
    alignItems: 'center',
    marginTop: 20,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },

  infoItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DF',
  },

  infoLabel: {
    fontSize: 12,
    color: '#8C756A',
  },

  infoValue: {
    fontSize: 15,
    color: '#392D28',
    marginTop: 4,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3E8DF',
  },

  menuIcon: {
    fontSize: 23,
    marginRight: 13,
  },

  menuTextContainer: {
    flex: 1,
  },

  menuTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#392D28',
  },

  menuSubtitle: {
    fontSize: 12,
    color: '#8C756A',
    marginTop: 4,
  },

  arrow: {
    fontSize: 25,
    color: '#B85D32',
  },

  logoutButton: {
    backgroundColor: '#FCE5DC',
    borderWidth: 1,
    borderColor: '#D98B70',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },

  logoutButtonText: {
    color: '#A33E27',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },

  footer: {
    textAlign: 'center',
    color: '#8C756A',
    fontSize: 12,
    marginTop: 25,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF1E5',
  },

  adminPortalButton: {
    alignItems: 'center',
    marginTop: 15,
    padding: 10,
  },

  adminPortalText: {
    color: '#8C756A',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Loading screen
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF1E5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  loadingIconCircle: {
    width: 115,
    height: 115,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#EAD8C9',
    marginBottom: 22,
  },

  loadingHouse: {
    fontSize: 58,
  },

  loadingBrand: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#B85D32',
    letterSpacing: 1,
  },

  loadingTagline: {
    fontSize: 15,
    color: '#8C756A',
    marginTop: 7,
  },

  loadingSpinner: {
    marginTop: 35,
    marginBottom: 15,
  },

  loadingMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#392D28',
  },

  loadingSubtext: {
    fontSize: 13,
    color: '#8C756A',
    marginTop: 7,
  },
});
