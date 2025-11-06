// src/firebaseConfig.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';

// Variabel global yang disediakan oleh lingkungan Canvas
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string | undefined;

// Fallback konfigurasi Firebase untuk pengembangan lokal atau jika __firebase_config tidak tersedia
const defaultFirebaseConfig = {
  apiKey: "AIzaSyBbFIkBgz84doCWVrBLBaLXrdSDXBdppPE", // PASTE YOUR ACTUAL API KEY HERE
  authDomain: "akuakuntan-42af1.firebaseapp.com", // PASTE YOUR ACTUAL authDomain HERE
  projectId: "akuakuntan-42af1", // PASTE YOUR ACTUAL projectId HERE
  storageBucket: "akuakuntan-42af1.firebasestorage.app", // PASTE YOUR ACTUAL storageBucket HERE
  messagingSenderId: "546238538301", // PASTE YOUR ACTUAL messagingSenderId HERE
  appId: "1:546238538301:web:e7d078262e66e383f44054", // PASTE YOUR ACTUAL appId HERE
  measurementId: "G-6H2FCXX30J" // Opsional, PASTE YOUR ACTUAL measurementId HERE
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
