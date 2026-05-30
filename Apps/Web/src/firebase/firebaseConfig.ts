import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBPeMq2qvyDOwz1O3wMwQaJ6KFS7Nu-ArY",
  authDomain: "raksha-sos.firebaseapp.com",
  projectId: "raksha-sos",
  storageBucket: "raksha-sos.firebasestorage.app",
  messagingSenderId: "300614452418",
  appId: "1:300614452418:web:5acd9e7bfdf6f8d56fe75b",
  measurementId: "G-YNCYX0FQP6"
};


 export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

