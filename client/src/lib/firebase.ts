import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: "AIzaSyApJ46enlCGLt1i-4blM-biWABN69U9p2E",
  authDomain: "credit-management-569bf.firebaseapp.com",
  projectId: "credit-management-569bf",
  storageBucket: "credit-management-569bf.firebasestorage.app",
  messagingSenderId: "864083110658",
  appId: "1:864083110658:web:c949638f0a17ff1091701b"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);
