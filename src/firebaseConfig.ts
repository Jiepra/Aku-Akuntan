// src/firebaseConfig.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';

// Variabel global yang disediakan oleh lingkungan Canvas
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string | undefined;

// Konfigurasi Firebase dari environment variables
const defaultFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-6H2FCXX30J" // Opsional
};

// Default value for appId when running locally outside of Canvas environment
// This ID should be unique to your application for proper Firestore collection scoping
export const localAppId = "akuakuntan-local-app"; // <-- Tambahkan ini

let firebaseConfig;
try {
  // Coba parse dari __firebase_config jika tersedia
  firebaseConfig = typeof __firebase_config !== 'undefined' && __firebase_config
    ? JSON.parse(__firebase_config)
    : defaultFirebaseConfig; // Gunakan fallback jika tidak ada
} catch (e) {
  console.error("Error parsing __firebase_config, using default config:", e);
  firebaseConfig = defaultFirebaseConfig;
}

// Tambahkan logging di sini:
console.log("Firebase config being used:", firebaseConfig); // LOG INI SANGAT PENTING

// Inisialisasi Firebase App
const app = initializeApp(firebaseConfig);

// Inisialisasi Firestore
export const db = getFirestore(app);

// Inisialisasi Auth
export const auth = getAuth(app);

// Fungsi untuk melakukan autentikasi
export const authenticateFirebase = async () => {
  try {
    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
      await signInWithCustomToken(auth, __initial_auth_token);
      console.log('Signed in with custom token');
    } else {
      await signInAnonymously(auth);
      console.log('Signed in anonymously');
    }
    // Anda bisa mendapatkan user ID setelah autentikasi
    const userId = auth.currentUser?.uid || 'anonymous';
    console.log('Firebase User ID:', userId);
    return userId; // Mengembalikan userId
  } catch (error: unknown) { // Menggunakan 'unknown' untuk error handling yang lebih baik
    let errorMessage = "Error during Firebase authentication.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    console.error(errorMessage, error);
    // Handle error, mungkin tampilkan pesan ke pengguna
    return null;
  }
};
