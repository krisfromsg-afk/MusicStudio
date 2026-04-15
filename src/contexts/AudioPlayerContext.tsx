import React, { createContext, useContext, useState, useRef } from 'react';

interface AudioPlayerContextType {
  currentlyPlayingId: string | null;
  setCurrentlyPlayingId: (id: string | null) => void;
  registerAudio: (id: string, audioRef: React.RefObject<HTMLAudioElement | HTMLVideoElement>) => void;
  unregisterAudio: (id: string) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, React.RefObject<HTMLAudioElement | HTMLVideoElement>>>(new Map());

  const registerAudio = (id: string, audioRef: React.RefObject<HTMLAudioElement | HTMLVideoElement>) => {
    audioRefs.current.set(id, audioRef);
  };

  const unregisterAudio = (id: string) => {
    audioRefs.current.delete(id);
    if (currentlyPlayingId === id) {
      setCurrentlyPlayingId(null);
    }
  };

  const handleSetCurrentlyPlayingId = (id: string | null) => {
    if (currentlyPlayingId && currentlyPlayingId !== id) {
      const prevAudio = audioRefs.current.get(currentlyPlayingId);
      if (prevAudio && prevAudio.current) {
        prevAudio.current.pause();
      }
    }
    setCurrentlyPlayingId(id);
  };

  return (
    <AudioPlayerContext.Provider value={{
      currentlyPlayingId,
      setCurrentlyPlayingId: handleSetCurrentlyPlayingId,
      registerAudio,
      unregisterAudio
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
};

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};
