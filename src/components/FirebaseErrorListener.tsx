
'use client';

import React, { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';

// This is a client-only component that will be used to listen for
// permission errors and display them in a toast. This is only intended
// for development purposes and should be removed in production.
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      console.error(
        'Firestore Permission Error:',
        JSON.stringify(error.toPlainObject(), null, 2)
      );
      if (process.env.NODE_ENV === 'development') {
        // In development, we throw the error to make it visible in the Next.js overlay.
        throw error;
      } else {
        // In production, you might want to show a generic toast or log to a monitoring service.
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'You do not have permission to perform this action.',
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
