import { initializeApp } from "firebase/app";

const firebaseStorageConfig = import.meta.env.VITE_FIREBASE_STORAGE_CONFIG;
const firebaseDefaultConfig = import.meta.env.VITE_FIREBASE_CONFIG;

const storageApp = initializeApp(JSON.parse(firebaseStorageConfig), 'image-storage');
const firebaseApp = initializeApp(JSON.parse(firebaseDefaultConfig), 'firebase-app');

export { storageApp, firebaseApp }