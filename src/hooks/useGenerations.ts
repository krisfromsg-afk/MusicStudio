import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface Generation {
  id: string;
  uid: string;
  taskId: string;
  taskType: string;
  status: 'pending' | 'text' | 'first' | 'complete' | 'failed';
  prompt?: string;
  lyrics?: string;
  style?: string;
  title?: string;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  createdAt: any;
  updatedAt: any;
  error?: string;
}

export function useGenerations(uid: string | undefined) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setGenerations([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'generations'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gens = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Generation[];
      setGenerations(gens);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'generations');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { generations, loading };
}
