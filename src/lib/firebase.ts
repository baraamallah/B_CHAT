
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAGXB1NKMMiuAfx-v2DjAjwsxXtftNhDUA",
  authDomain: "bchat-2025.firebaseapp.com",
  projectId: "bchat-2025",
  storageBucket: "bchat-2025.appspot.com",
  messagingSenderId: "396064695598",
  appId: "1:396064695598:web:14ca692c9c4387e4e6c6bf",
  measurementId: "G-ZM7GX35M5L"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const db = initializeFirestore(app, {
  localCache: {
    kind: 'persistent'
  }
});

const auth = getAuth(app);
const storage = getStorage(app);

export { app, auth, db, storage };
