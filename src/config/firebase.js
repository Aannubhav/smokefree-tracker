import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyBfsSc1LhCIdY1znzdcFuObZSUELzCHQE0",
  authDomain: "sutta-c17a8.firebaseapp.com",
  projectId: "sutta-c17a8",
  storageBucket: "sutta-c17a8.firebasestorage.app",
  messagingSenderId: "820335013429",
  appId: "1:820335013429:web:74d44860d1ccf0318f0b7c",
  measurementId: "G-M3KDK8KY7G"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);

let _auth = null;

export const getAuth = () => {
  if (_auth) return _auth;

  if (Platform.OS === 'web') {
    const { getAuth: firebaseGetAuth } = require('firebase/auth');
    _auth = firebaseGetAuth(app);
  } else {
    const { initializeAuth, getReactNativePersistence } = require('firebase/auth');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  }

  return _auth;
};

export default app;
