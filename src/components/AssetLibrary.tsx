import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useGenerations } from '../hooks/useGenerations';
import { GenerationCard } from './GenerationCard';
import { Loader2 } from 'lucide-react';

interface AssetLibraryProps {
  onAction: (action: 'extend' | 'cover' | 'separate', id: string) => void;
}

export const AssetLibrary: React.FC<AssetLibraryProps> = ({ onAction }) => {
  const { user } = useAuth();
  const { generations, loading } = useGenerations(user?.uid);

  return (
    <div className="w-full h-full flex flex-col bg-zinc-50/50 border-l border-zinc-200 overflow-hidden">
      <div className="p-4 border-b border-zinc-200 bg-white shrink-0">
        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Asset Library</h2>
        <p className="text-xs text-zinc-500 mt-1">Your recent generations</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
          </div>
        ) : generations.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-zinc-500">No assets found.</p>
            <p className="text-xs text-zinc-400 mt-1">Generate some music to see it here.</p>
          </div>
        ) : (
          generations.map((gen) => (
            <GenerationCard 
              key={gen.id} 
              generation={gen} 
              onAction={onAction}
            />
          ))
        )}
      </div>
    </div>
  );
};
