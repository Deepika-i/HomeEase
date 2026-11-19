
import { useEffect, useState, useRef } from 'react';
import type { ComponentRef } from 'react';

import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';

import { auth } from '../lib/firebase';

import {
  getUserBookings,
  updateUserBooking,
} from '@/utils/firestoreBookingStorage';

type BookingItem = {
  id: string;
  service: string;
  status: string;
  preferredDate: string;
  preferredTime: string;
  address?: string;
  landmark?: string;
  additionalRequirements?: string;
  [key: string]: any;
};

export default function EditBookingScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{ id: string }>();

  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [booking, setBooking] = useState<BookingItem | null>(null);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [requirements, setRequirements] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load the selected customer's booking from Firestore
  useEffect(() => {
    let isActive = true;

    const loadBooking = async () => {
      try {
        // Wait for Firebase to restore the login session
        await auth.authStateReady();

        const user = auth.currentUser;

        if (!user) {
          Alert.alert(
            'Login Required',
            'Please login to edit your booking.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/auth'),
              },
            ]
          );

          return;
        }

        // Fetch only this customer's bookings
        const bookings = await getUserBookings(user.uid);

        const selected = bookings.find(
          (item) => item.id === id
        ) as BookingItem | undefined;

        if (!selected) {
          Alert.alert(
            'Booking Not Found',
            'This booking does not belong to your account or no longer exists.',
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );

          return;
        }

        if (
          selected.status !== 'Waiting for Provider Response'
        ) {
          Alert.alert(
            'Editing Unavailable',
            'This booking can no longer be edited.',
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );

          return;
        }

        if (isActive) {
          setBooking(selected);

          setDate(selected.preferredDate || '');
          setTime(selected.preferredTime || '');
          setAddress(selected.address || '');
          setLandmark(selected.landmark || '');
          setRequirements(
            selected.additionalRequirements || ''
          );
        }
      } catch (error) {
        console.log('Loading booking error:', error);

        Alert.alert(
          'Error',
          'Unable to load your booking. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadBooking();

    return () => {
      isActive = false;
    };
  }, [id, router]);

  // Save updated booking to the current customer's Firestore account
  const handleSave = async () => {
    Keyboard.dismiss();

    if (!date.trim() || !time.trim() || !address.trim()) {
      Alert.alert(
        'Missing Information',
        'Please enter the preferred date, time and address.'
      );

      return;
    }

    if (!booking) {
      Alert.alert('Error', 'Booking information is unavailable.');
      return;
    }

    try {
      setSaving(true);

      // Check the currently logged-in customer
      await auth.authStateReady();

      const user = auth.currentUser;

      if (!user) {
        Alert.alert(
          'Login Required',
          'Please login to update your booking.'
        );

        router.replace('/auth');
        return;
      }

      // Check the latest booking status before updating
      const latestBookings = await getUserBookings(user.uid);

      const latestBooking = latestBookings.find(
        (item) => item.id === id
      );

      if (
        !latestBooking ||
        latestBooking.status !== 'Waiting for Provider Response'
      ) {
        Alert.alert(
          'Update Unavailable',
          'This booking is no longer eligible for editing.'
        );

        router.back();
        return;
      }

      // Update only this customer's booking
      await updateUserBooking(
        user.uid,
        id,
        {
          preferredDate: date.trim(),
          preferredTime: time.trim(),
          address: address.trim(),
          landmark: landmark.trim(),
          additionalRequirements: requirements.trim(),
          updatedAt: new Date().toISOString(),
        }
      );

      Alert.alert(
        'Success',
        'Your booking has been updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.log('Updating booking error:', error);

      Alert.alert(
        'Error',
        'Unable to update your booking. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#B85D32"
        />
      </View>
    );
  }

  // Booking unavailable screen
  if (!booking) {
    return (
      <View style={styles.center}>
        <Text style={styles.unavailableText}>
          Booking information is unavailable.
        </Text>

        <Pressable
          style={styles.saveButton}
          onPress={() => router.back()}
        >
          <Text style={styles.saveButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>
            Edit Booking
          </Text>

          <Text style={styles.subtitle}>
            Update your booking information
          </Text>

          <Text style={styles.service}>
            {booking.service}
          </Text>

          {/* Preferred Date */}
          <Text style={styles.label}>
            Preferred Date *
          </Text>

          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="Enter preferred date"
            placeholderTextColor="#A9978D"
            returnKeyType="next"
          />

          {/* Preferred Time */}
          <Text style={styles.label}>
            Preferred Time *
          </Text>

          <TextInput
            style={styles.input}
            value={time}
            onChangeText={setTime}
            placeholder="Enter preferred time"
            placeholderTextColor="#A9978D"
            returnKeyType="next"
          />

          {/* Full Address */}
          <Text style={styles.label}>
            Full Address *
          </Text>

          <TextInput
            style={[styles.input, styles.addressInput]}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your full address"
            placeholderTextColor="#A9978D"
            multiline
            returnKeyType="default"
          />

          {/* Landmark */}
          <Text style={styles.label}>
            Landmark
          </Text>

          <TextInput
            style={styles.input}
            value={landmark}
            onChangeText={setLandmark}
            placeholder="Enter nearby landmark"
            placeholderTextColor="#A9978D"
            returnKeyType="next"
          />

          {/* Additional Requirements */}
          <Text style={styles.label}>
            Additional Requirements
          </Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            value={requirements}
            onChangeText={setRequirements}
            placeholder="Enter any additional requirements"
            placeholderTextColor="#A9978D"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({
                  animated: true,
                });
              }, 300);
            }}
          />

          {/* Save Changes */}
          <Pressable
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
          </Pressable>

          {/* Cancel */}
          <Pressable
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>
              Cancel
            </Text>
          </Pressable>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1E5',
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 50,
    flexGrow: 1,
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
    marginBottom: 20,
  },

  service: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B85D32',
    marginBottom: 12,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#392D28',
    marginTop: 15,
    marginBottom: 7,
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#392D28',
    minHeight: 50,
  },

  addressInput: {
    minHeight: 75,
    textAlignVertical: 'top',
  },

  textArea: {
    height: 110,
    textAlignVertical: 'top',
  },

  saveButton: {
    backgroundColor: '#B85D32',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 28,
    minHeight: 52,
  },

  disabledButton: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },

  cancelButton: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 15,
  },

  cancelButtonText: {
    color: '#8C756A',
    fontWeight: '600',
    fontSize: 15,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF1E5',
    padding: 25,
  },

  unavailableText: {
    color: '#392D28',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
