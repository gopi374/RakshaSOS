import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace these with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyBPeMq2qvyDOwz1O3wMwQaJ6KFS7Nu-ArY",
  authDomain: "raksha-sos.firebaseapp.com",
  projectId: "raksha-sos",
  storageBucket: "raksha-sos.firebasestorage.app",
  messagingSenderId: "300614452418",
  appId: "1:300614452418:web:5acd9e7bfdf6f8d56fe75b",
  measurementId: "G-YNCYX0FQP6"
};
// Initialize Firebase App
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
