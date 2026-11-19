
import { initializeApp, getApp, getApps } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Firebase 13.1.0 React Native persistence workaround
const getReactNativePersistence = (
  FirebaseAuth as unknown as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => any;
  }
).getReactNativePersistence;

// Firebase configuration
const firebaseConfig = {
  apiKey:"AIzaSyAF1xZ3i8AqLJytEkmNJh1b0jLp6FC-Z4E",
  authDomain: 'homeease-1d71d.firebaseapp.com',
  projectId: 'homeease-1d71d',
  storageBucket: 'homeease-1d71d.firebasestorage.app',
  messagingSenderId: '1004782665017',
  appId: '1:1004782665017:web:d6ec65031b288c67557ce8',
};

// Initialize Firebase
const app = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Firebase Authentication

export const auth = (() => {
  if (Platform.OS === 'web') {
    return FirebaseAuth.getAuth(app);
  }

  try {
    return FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    const firebaseError = error as { code?: string };

    // Reuse the existing Auth instance during Fast Refresh
    if (firebaseError.code === 'auth/already-initialized') {
      return FirebaseAuth.getAuth(app);
    }

    throw error;
  }
})();
