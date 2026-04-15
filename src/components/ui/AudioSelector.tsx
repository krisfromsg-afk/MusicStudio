import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { MinimalSelect } from './MinimalSelect';

interface AudioSelectorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const AudioSelector: React.FC<AudioSelectorProps> = ({ label = 'Select Audio', value, onChange, error }) => {
  const { user } = useAuth();
  const [options, setOptions] = useState<{ value: string; label: string }[]>([
    { value: '', label: 'Select an audio...' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAudios = async () => {
      try {
        const q = query(
          collection(db, 'generations'),
          where('uid', '==', user.uid),
          where('status', '==', 'complete'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const audioOptions = snapshot.docs.map(doc => {
          const data = doc.data();
          const title = data.payload_sent?.title || data.taskType || 'Untitled Audio';
          return {
            value: doc.id, // Using taskId as the value
            label: `${title} (${new Date(data.createdAt?.toDate()).toLocaleDateString()})`
          };
        });
        setOptions([{ value: '', label: 'Select an audio...' }, ...audioOptions]);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'generations');
      } finally {
        setLoading(false);
      }
    };

    fetchAudios();
  }, [user]);

  return (
    <MinimalSelect
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={loading ? [{ value: '', label: 'Loading audios...' }] : options}
      error={error}
    />
  );
};
