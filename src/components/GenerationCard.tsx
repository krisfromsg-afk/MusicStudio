import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Pause, Download, Copy, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { Generation } from '../hooks/useGenerations';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

interface GenerationCardProps {
  generation: Generation;
  onAction: (action: 'extend' | 'cover' | 'separate', id: string) => void;
}

export const GenerationCard: React.FC<GenerationCardProps> = ({ generation, onAction }) => {
  const { status, title, style, audioUrl, videoUrl, taskId, createdAt } = generation;
  const isPending = ['pending', 'text', 'first'].includes(status);
  
  const calculateRemainingDays = (dateValue: any) => {
    if (!dateValue) return 30;
    
    let created: Date;
    if (typeof dateValue === 'string') {
      created = new Date(dateValue);
    } else if (dateValue.toDate) {
      created = dateValue.toDate(); // Firestore Timestamp
    } else if (dateValue.seconds) {
      created = new Date(dateValue.seconds * 1000);
    } else {
      created = new Date();
    }

    const now = new Date();
    const diffTime = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  const remainingDays = calculateRemainingDays(createdAt);

  if (remainingDays <= 0) {
    return null; // Hide if expired
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl shadow-sm p-4 flex flex-col gap-4 relative">
      <div className="absolute top-3 right-3 z-10">
        {remainingDays > 7 ? (
          <span className="bg-zinc-100 text-zinc-500 border border-zinc-200 text-[10px] px-2 py-1 rounded-full font-medium">
            Lưu trữ: Còn {remainingDays} ngày
          </span>
        ) : (
          <span 
            className="bg-red-50 text-red-600 border border-red-200 text-[10px] px-2 py-1 rounded-full font-medium animate-pulse cursor-help"
            title={`Hãy tải về máy, hệ thống sẽ tự động xóa sau ${remainingDays} ngày để tối ưu không gian`}
          >
            Sắp xóa: Còn {remainingDays} ngày
          </span>
        )}
      </div>

      {isPending ? (
        <PendingState status={status} />
      ) : (
        <CompleteState generation={generation} onAction={onAction} />
      )}
    </div>
  );
};

const PendingState = ({ status }: { status: string }) => {
  const getStatusText = () => {
    switch (status) {
      case 'text': return 'Đang soạn lời...';
      case 'first': return 'Đang phối khí...';
      default: return 'Đang khởi động lõi AI...';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <div className="flex items-end gap-1 h-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-zinc-800 rounded-full"
            animate={{ height: ['20%', '100%', '20%'] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      <span className="text-zinc-500 text-sm font-medium animate-pulse">
        {getStatusText()}
      </span>
    </div>
  );
};

const CompleteState = ({ generation, onAction }: { generation: Generation, onAction: (action: 'extend' | 'cover' | 'separate', id: string) => void }) => {
  const { title, style, audioUrl, videoUrl, taskId } = generation;
  const { currentlyPlayingId, setCurrentlyPlayingId, registerAudio, unregisterAudio } = useAudioPlayer();
  
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const isVideo = !!videoUrl;
  const mediaUrl = videoUrl || audioUrl;

  useEffect(() => {
    if (mediaRef.current && taskId) {
      registerAudio(taskId, mediaRef);
    }
    return () => {
      if (taskId) unregisterAudio(taskId);
    };
  }, [taskId, registerAudio, unregisterAudio]);

  useEffect(() => {
    if (currentlyPlayingId !== taskId && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentlyPlayingId, taskId, isPlaying]);

  const togglePlay = () => {
    if (!mediaRef.current) return;
    
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      mediaRef.current.play();
      setIsPlaying(true);
      setCurrentlyPlayingId(taskId);
    }
  };

  const handleTimeUpdate = () => {
    if (!mediaRef.current) return;
    const current = mediaRef.current.currentTime;
    const total = mediaRef.current.duration;
    setCurrentTime(current);
    setProgress((current / total) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!mediaRef.current) return;
    setDuration(mediaRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!mediaRef.current) return;
    const newTime = (Number(e.target.value) / 100) * duration;
    mediaRef.current.currentTime = newTime;
    setProgress(Number(e.target.value));
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(taskId);
    toast.success('Đã copy Audio ID');
  };

  const handleDownload = () => {
    if (!mediaUrl) return;
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = `${title || 'wormhole-track'}-${taskId}.${isVideo ? 'mp4' : 'mp3'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="pr-24">
        <h4 className="font-bold text-zinc-900 text-base truncate">{title || 'Untitled Track'}</h4>
        {style && (
          <span className="inline-block bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5 text-[10px] font-medium mt-1 truncate max-w-full">
            {style}
          </span>
        )}
      </div>

      {isVideo ? (
        <div className="rounded-lg overflow-hidden bg-zinc-100 relative group aspect-video">
          <video 
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={videoUrl} 
            className="w-full h-full object-cover"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            playsInline
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button 
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-zinc-900/90 text-white flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </button>
          </div>
        </div>
      ) : (
        <audio 
          ref={mediaRef as React.RefObject<HTMLAudioElement>}
          src={audioUrl} 
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Custom Player Controls */}
      <div className="flex items-center gap-3 mt-2">
        {!isVideo && (
          <button 
            onClick={togglePlay}
            className="w-8 h-8 shrink-0 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 transition-colors"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
        )}
        
        <div className="flex-1 flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500 w-8 text-right">{formatTime(currentTime)}</span>
          <div className="relative flex-1 h-1.5 group flex items-center">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress || 0} 
              onChange={handleSeek}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-zinc-900 rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 w-8">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2 pt-3 border-t border-zinc-100">
        <button 
          onClick={handleDownload}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4" />
        </button>
        <button 
          onClick={handleCopyId}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          title="Copy ID"
        >
          <Copy className="w-4 h-4" />
        </button>
        
        <div className="relative ml-auto">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 bottom-full mb-1 w-36 bg-white border border-zinc-200 rounded-lg shadow-lg py-1 z-20 overflow-hidden">
                <button 
                  onClick={() => { onAction('extend', taskId); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  Nối dài (Extend)
                </button>
                <button 
                  onClick={() => { onAction('cover', taskId); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  Tạo Cover
                </button>
                <button 
                  onClick={() => { onAction('separate', taskId); setShowMenu(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                >
                  Tách Lời
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
