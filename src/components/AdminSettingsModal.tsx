import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export const AdminSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchSettings();
    }
  }, [isOpen, user]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'admin', 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().systemInstruction) {
        setInstruction(docSnap.data().systemInstruction);
      } else {
        setInstruction("You are an expert music producer. Generate a JSON blueprint for a song based on the user's input. The JSON must have the following keys: 'title', 'style', 'lyrics'.");
      }
    } catch (error) {
      console.error("Error fetching admin settings", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const docRef = doc(db, 'admin', 'settings');
      await setDoc(docRef, { systemInstruction: instruction }, { merge: true });
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'admin/settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface-black border border-border-color rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        <div className="flex justify-between items-center p-6 border-b border-border-color">
          <h2 className="text-[16px] uppercase tracking-[2px] text-silver font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-glow-blue" />
            Admin Settings
          </h2>
          <button onClick={onClose} className="text-muted-silver hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          <p className="text-[14px] text-muted-silver">
            Configure the System Instructions for the Gemini AI Prompt Generator.
          </p>
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-glow-blue" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-[12px] uppercase tracking-[1px] text-glow-blue">System Instructions</label>
              <textarea 
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="bg-deep-black border border-border-color rounded-lg p-4 text-silver text-[14px] focus:outline-none focus:border-glow-blue focus:glow-box-blue transition-all resize-none h-48 font-mono"
              />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border-color flex justify-end gap-4 bg-deep-black/50">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-silver border border-border-color hover:bg-white/5 transition-colors text-[12px] uppercase font-bold"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-glow-blue text-deep-black border-none px-6 py-2 rounded-lg font-bold text-[12px] uppercase cursor-pointer hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
