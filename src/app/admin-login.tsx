
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useRouter } from 'expo-router';

import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

// Official HomeEase Admin UID
const ADMIN_UID = 'XORlsuEUPYfsmlFqgXCSaoY1jvz1';

export default function AdminLoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('support.homeease2@gmail.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check whether the current login is already the Admin
  useEffect(() => {
    let active = true;

    const checkAdminSession = async () => {
      await auth.authStateReady();

      if (!active) return;

      if (auth.currentUser?.uid === ADMIN_UID) {
        router.replace('/admin-dashboard' as any);
      } else {
        setChecking(false);
      }
    };

    void checkAdminSession();

    return () => {
      active = false;
    };
  }, [router]);

  // Admin Login
  const handleAdminLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        'Missing Details',
        'Please enter your Admin email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // Verify the Firebase UID
      if (credential.user.uid !== ADMIN_UID) {
        await signOut(auth);

        Alert.alert(
          'Access Denied',
          'This account does not have HomeEase Admin permission.'
        );

        return;
      }

      // Only the approved Admin can continue
      router.replace('/admin-dashboard' as any);
    } catch (error: any) {
      console.log('Admin login error:', error);

      let message = 'Unable to login. Please try again.';

      if (
        error.code === 'auth/invalid-credential'
      ) {
        message = 'Invalid Admin email or password.';
      } else if (
        error.code === 'auth/invalid-email'
      ) {
        message = 'Please enter a valid email address.';
      } else if (
        error.code === 'auth/network-request-failed'
      ) {
        message = 'Please check your internet connection.';
      } else if (
        error.code === 'auth/too-many-requests'
      ) {
        message = 'Too many attempts. Please try again later.';
      }

      Alert.alert('Admin Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#B85D32" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Admin Logo */}
        <View style={styles.logo}>
          <Text style={styles.logoText}>H</Text>
        </View>

        <Text style={styles.brand}>HomeEase</Text>

        <Text style={styles.subtitle}>
          Admin Portal
        </Text>

        <View style={styles.form}>
          <Text style={styles.title}>
            Admin Login
          </Text>

          <Text style={styles.description}>
            Sign in to manage customers, bookings and support conversations.
          </Text>

          {/* Admin Email */}
          <Text style={styles.label}>
            Admin Email
          </Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter Admin email"
            placeholderTextColor="#A9978D"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Admin Password */}
          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter Admin password"
            placeholderTextColor="#A9978D"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Login Button */}
          <Pressable
            style={[
              styles.loginButton,
              loading && styles.disabledButton,
            ]}
            onPress={handleAdminLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>
                Login as Admin
              </Text>
            )}
          </Pressable>

          <Text style={styles.securityText}>
            🔒 Authorized HomeEase Admin access only
          </Text>
        </View>

        <Text style={styles.footer}>
          HomeEase – Your Home, Our Care.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF1E5',
    justifyContent: 'center',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF1E5',
  },

  content: {
    padding: 25,
    alignItems: 'center',
  },

  logo: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#B85D32',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: 'bold',
  },

  brand: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#392D28',
  },

  subtitle: {
    fontSize: 15,
    color: '#B85D32',
    marginTop: 5,
    marginBottom: 30,
    fontWeight: '600',
  },

  form: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EAD8C9',
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#392D28',
  },

  description: {
    fontSize: 13,
    color: '#8C756A',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#392D28',
    marginTop: 15,
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#EAD8C9',
    borderRadius: 11,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#392D28',
    backgroundColor: '#FFFCF9',
  },

  loginButton: {
    height: 53,
    backgroundColor: '#B85D32',
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  securityText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#8C756A',
    marginTop: 18,
  },

  footer: {
    fontSize: 12,
    color: '#8C756A',
    marginTop: 30,
  },
});
