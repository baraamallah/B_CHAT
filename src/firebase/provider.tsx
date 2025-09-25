
'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { app, db, auth } from '@/lib/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Firestore } from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const firebaseContextValue: FirebaseContextType = {
    firebaseApp: app,
    firestore: db,
    auth: auth,
  };

  return (
    <FirebaseContext.Provider value={firebaseContextValue}>
      {children}
      {process.env.NODE_ENV === 'development' && <FirebaseErrorListener />}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = (): FirebaseContextType => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = (): FirebaseApp => {
  return useFirebase().firebaseApp;
};

export const useFirestore = (): Firestore => {
  return useFirebase().firestore;
};

export const useAuth = (): Auth => {
  return useFirebase().auth;
};
