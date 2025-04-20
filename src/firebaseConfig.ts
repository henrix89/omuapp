// src/firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getFirestore }    from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC2C5FNl2G6hb4uoPEf9ArVJA6QdLDi4-w",
    authDomain: "omu-app-40e74.firebaseapp.com",
    projectId: "omu-app-40e74",
    storageBucket: "omu-app-40e74.firebasestorage.app",
    messagingSenderId: "60694641982",
    appId: "1:60694641982:web:477782db91458b3e4cc06f",
    measurementId: "G-5GJ1CKYF03"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
