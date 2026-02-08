import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Provided by you (public client config)
const firebaseConfig = {
  apiKey: "AIzaSyA4t6mBV8Uv-aVhQtqeqN5h51w6w25Yrds",
  authDomain: "visualcraft-portfolio-bf4c2.firebaseapp.com",
  projectId: "visualcraft-portfolio-bf4c2",
  storageBucket: "visualcraft-portfolio-bf4c2.firebasestorage.app",
  messagingSenderId: "647823194633",
  appId: "1:647823194633:web:4b67b7750d9f27f6cf16d8"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
