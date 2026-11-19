
import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';

import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

import {
  getBookingDraft,
  clearBookingDraft,
} from '@/utils/bookingDraftStorage';

import { saveUserBooking } from '@/utils/firestoreBookingStorage';

type AuthMode = 'login' | 'signup';

type PendingBooking = {
  id: string;
  service: string;
  name: string;
  district: string;
  city: string;
  area: string;
  preferredDate: string;
  preferredTime: string;
  [key: string]: any;
};

export default function AuthScreen() {
  const router = useRouter();

  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  // Scroll the focused field into view
  const handleInputFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true,
      });
    }, 250);
  };

  // Login or Signup
  const handleAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing Details',
        'Please enter your email and password.'
      );
      return;
    }

    if (!email.trim().includes('@')) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.'
      );
      return;
    }

    // Signup validation
    const normalizedPhone = phone.replace(/\D/g, '');

    if (mode === 'signup') {
      if (!/^[6-9]\d{9}$/.test(normalizedPhone)) {
        Alert.alert(
          'Invalid Phone Number',
          'Please enter a valid 10-digit Indian mobile number.'
        );
        return;
      }

      if (password.length < 6) {
        Alert.alert(
          'Weak Password',
          'Password must contain at least 6 characters.'
        );
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert(
          'Password Mismatch',
          'Passwords do not match.'
        );
        return;
      }
    }

    try {
      setLoading(true);

      // Step 1: Login or create Firebase account
      const credential = isLogin
        ? await signInWithEmailAndPassword(
            auth,
            email.trim(),
            password
          )
        : await createUserWithEmailAndPassword(
            auth,
            email.trim(),
            password
          );

      const user = credential.user;

      console.log('Logged-in customer UID:', user.uid);

      // Step 2: Retrieve pending booking
      const pendingBooking =
        await getBookingDraft<PendingBooking>();

      // Step 3: Save phone number for new customers
      if (!isLogin) {
        const profileData: Record<string, string> = {
          phone: normalizedPhone,
          email: user.email || email.trim(),
          updatedAt: new Date().toISOString(),
        };

        if (pendingBooking?.name?.trim()) {
          profileData.name = pendingBooking.name.trim();
        }

        await setDoc(
          doc(db, 'users', user.uid),
          profileData,
          { merge: true }
        );
      }

      // Step 4: Save booking under this customer's UID
      if (pendingBooking) {
        await saveUserBooking(
          user.uid,
          pendingBooking
        );

        // Step 5: Clear temporary draft after successful saving
        await clearBookingDraft();

        // Step 6: Navigate to booking confirmation
        router.replace({
          pathname: '/booking-confirmation',
          params: {
            service: pendingBooking.service,
            name: pendingBooking.name,
            district: pendingBooking.district,
            city: pendingBooking.city,
            area: pendingBooking.area,
            preferredDate: pendingBooking.preferredDate,
            preferredTime: pendingBooking.preferredTime,
          },
        });
      } else {
        Alert.alert(
          'Welcome to HomeEase!',
          'You have successfully logged in.'
        );

        // Safely navigate after login
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error: any) {
      console.log('Authentication / Booking Error:', error);

      let message = 'Something went wrong. Please try again.';

      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Please enter a valid email address.';
          break;

        case 'auth/email-already-in-use':
          message = 'This email is already registered. Please login.';
          break;

        case 'auth/weak-password':
          message = 'Please choose a stronger password.';
          break;

        case 'auth/invalid-credential':
          message = 'Invalid email or password.';
          break;

        case 'auth/user-not-found':
          message = 'No account found with this email address.';
          break;

        case 'auth/wrong-password':
          message = 'Incorrect password. Please try again.';
          break;

        case 'auth/network-request-failed':
          message = 'Please check your internet connection.';
          break;

        case 'permission-denied':
        case 'firestore/permission-denied':
          message =
            'Your account is authenticated, but your information could not be saved. Please check Firestore security rules.';
          break;

        case 'auth/too-many-requests':
          message = 'Too many attempts. Please try again later.';
          break;
      }

      Alert.alert('Unable to Continue', message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        'Email Required',
        'Enter your email address first.'
      );
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(
        auth,
        email.trim()
      );

      Alert.alert(
        'Reset Email Sent',
        'Check your email for the password reset link.'
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.code === 'auth/invalid-email'
          ? 'Please enter a valid email address.'
          : 'Unable to send the reset email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        {/* Back to Home Button */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)')}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>
            ← Back to Home
          </Text>
        </Pressable>

        {/* HomeEase Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>H</Text>
          </View>

          <Text style={styles.brand}>HomeEase</Text>

          <Text style={styles.tagline}>
            Your Home, Our Care.
          </Text>
        </View>

        {/* Authentication Form */}
        <View style={styles.form}>
          <Text style={styles.title}>
            {isLogin ? 'Welcome Back!' : 'Create Account'}
          </Text>

          <Text style={styles.subtitle}>
            {isLogin
              ? 'Login to continue with your booking.'
              : 'Join HomeEase and make home care easier.'}
          </Text>

          {/* Email */}
          <Text style={styles.label}>Email Address</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#A9978D"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            onFocus={handleInputFocus}
            blurOnSubmit={false}
            returnKeyType="next"
          />

          {/* Phone Number - Signup Only */}
          {!isLogin && (
            <>
              <Text style={styles.label}>Phone Number</Text>

              <TextInput
                style={styles.input}
                placeholder="Enter your 10-digit mobile number"
                placeholderTextColor="#A9978D"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(value) =>
                  setPhone(value.replace(/\D/g, '').slice(0, 10))
                }
                onFocus={handleInputFocus}
                maxLength={10}
                blurOnSubmit={false}
                returnKeyType="next"
              />
            </>
          )}

          {/* Password */}
          <Text style={styles.label}>Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#A9978D"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onFocus={handleInputFocus}
            blurOnSubmit={false}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType={isLogin ? 'done' : 'next'}
          />

          {/* Confirm Password */}
          {!isLogin && (
            <>
              <Text style={styles.label}>Confirm Password</Text>

              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#A9978D"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={handleInputFocus}
                blurOnSubmit={false}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
              />
            </>
          )}

          {/* Forgot Password */}
          {isLogin && (
            <Pressable
              style={styles.forgotButton}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotText}>
                Forgot Password?
              </Text>
            </Pressable>
          )}

          {/* Submit */}
          <Pressable
            style={[
              styles.submitButton,
              loading && styles.disabledButton,
            ]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                {isLogin ? 'Login' : 'Create Account'}
              </Text>
            )}
          </Pressable>

          {/* Switch Login / Signup */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
            </Text>

            <Pressable
              onPress={() => {
                setMode(isLogin ? 'signup' : 'login');
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={loading}
            >
              <Text style={styles.switchLink}>
                {isLogin ? 'Sign Up' : 'Login'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Your Home, Our Care. ❤️
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1E5',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 25,
    paddingBottom: 45,
  },

  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 20,
  },

  backButtonText: {
    color: '#B85D32',
    fontSize: 14,
    fontWeight: 'bold',
  },

  header: {
    alignItems: 'center',
    marginBottom: 35,
  },

  logo: {
    width: 65,
    height: 65,
    borderRadius: 22,
    backgroundColor: '#B85D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },

  brand: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#392D28',
  },

  tagline: {
    fontSize: 14,
    color: '#8C756A',
    marginTop: 5,
  },

  form: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 22,
  },

  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#392D28',
  },

  subtitle: {
    fontSize: 14,
    color: '#8C756A',
    marginTop: 8,
    marginBottom: 25,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#392D28',
    marginBottom: 8,
    marginTop: 15,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#392D28',
    backgroundColor: '#FFFCF9',
  },

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },

  forgotText: {
    color: '#B85D32',
    fontWeight: '600',
    fontSize: 13,
  },

  submitButton: {
    height: 53,
    backgroundColor: '#B85D32',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },

  disabledButton: {
    opacity: 0.6,
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 23,
    flexWrap: 'wrap',
  },

  switchText: {
    color: '#8C756A',
    fontSize: 14,
  },

  switchLink: {
    color: '#B85D32',
    fontSize: 14,
    fontWeight: 'bold',
  },

  footer: {
    textAlign: 'center',
    color: '#8C756A',
    marginTop: 30,
    fontSize: 13,
  },
});
