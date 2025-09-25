
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, initializeFirestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAGXB1NKMMiuAfx-v2DjAjwsxXtftNhDUA",
  authDomain: "bchat-2025.firebaseapp.com",
  projectId: "bchat-2025",
  storageBucket: "bchat-2025.appspot.com",
  messagingSenderId: "396064695598",
  appId: "1:396064695598:web:14ca692c9c4387e4e6c6bf",
  measurementId: "G-ZM7GX35M5L"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    db = initializeFirestore(app, {
      localCache: {
        kind: 'persistent'
      }
    });
} else {
    app = getApp();
    db = getFirestore(app);
}

auth = getAuth(app);
storage = getStorage(app);


export { app, auth, db, storage };

    