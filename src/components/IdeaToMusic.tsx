import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface IdeaToMusicProps {
  onBlueprintGenerated?: (blueprint: any) => void;
}

export const IdeaToMusic: React.FC<IdeaToMusicProps> = ({ onBlueprintGenerated }) => {
  const [coreIdea, setCoreIdea] = useState('');
  const [style, setStyle] = useState('');
  const [chords, setChords] = useState('');
  const [instruments, setInstruments] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!coreIdea || !style || !instruments) {
      alert('Please fill in Core Idea, Style, and Main Instruments.');
      return;
    }

    setLoading(true);
    setResult(null);
    setCopied(false);

    try {
      // 1. Fetch System Instructions from Firestore
      let systemInstruction = "You are an expert music producer. Generate a JSON blueprint for a song based on the user's input. The JSON must have the following keys: 'title', 'style', 'lyrics'.";
      try {
        const settingsDoc = await getDoc(doc(db, 'admin', 'settings'));
        if (settingsDoc.exists() && settingsDoc.data().systemInstruction) {
          systemInstruction = settingsDoc.data().systemInstruction;
        }
      } catch (err) {
        console.warn("Could not fetch admin settings, using default system instruction.", err);
      }

      // 2. Call Backend API
      const response = await fetch('/api/generate-blueprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coreIdea,
          style,
          chords,
          instruments,
          systemInstruction
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate blueprint');
      }

      const data = await response.json();
      const jsonText = data.result;

      if (jsonText) {
        // Try to parse and clean up the JSON
        let cleanJson = jsonText;
        try {
          cleanJson = jsonText.replace(/```json\n?|\n?```/g, '').trim();
          const parsedResult = JSON.parse(cleanJson);
          setResult(JSON.stringify(parsedResult, null, 2));
          if (onBlueprintGenerated) {
            onBlueprintGenerated(parsedResult);
          }
        } catch (e) {
          console.error("Failed to parse JSON", e);
          setResult(jsonText); // Fallback to raw text if parsing fails
        }
      }
    } catch (error: any) {
      console.error('Error generating blueprint:', error);
      alert(error.message || 'Failed to generate blueprint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-surface-black border border-border-color rounded-2xl p-6 flex-1 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h3 className="text-[14px] uppercase tracking-[1.5px] text-muted-silver flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-glow-purple" />
          Idea to Music Engine
        </h3>
        <span className="text-[10px] text-glow-purple">AI_READY</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-[12px] uppercase tracking-[1px] text-muted-silver">Core Idea</label>
          <textarea 
            value={coreIdea}
            onChange={(e) => setCoreIdea(e.target.value)}
            placeholder="e.g. A song about traveling through a neon-lit cyber city..."
            className="bg-deep-black border border-border-color rounded-lg p-3 text-silver text-[14px] focus:outline-none focus:border-glow-purple focus:glow-box-purple transition-all resize-none h-24"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[12px] uppercase tracking-[1px] text-muted-silver">Desired Style</label>
          <input 
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="e.g. Synthwave, Cyberpunk"
            className="bg-deep-black border border-border-color rounded-lg p-3 text-silver text-[14px] focus:outline-none focus:border-glow-purple focus:glow-box-purple transition-all"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[12px] uppercase tracking-[1px] text-muted-silver">Main Instruments</label>
          <input 
            type="text"
            value={instruments}
            onChange={(e) => setInstruments(e.target.value)}
            placeholder="e.g. Analog Synth, Drum Machine"
            className="bg-deep-black border border-border-color rounded-lg p-3 text-silver text-[14px] focus:outline-none focus:border-glow-purple focus:glow-box-purple transition-all"
          />
        </div>

        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-[12px] uppercase tracking-[1px] text-muted-silver">Chords (Optional)</label>
          <input 
            type="text"
            value={chords}
            onChange={(e) => setChords(e.target.value)}
            placeholder="e.g. Am - F - C - G"
            className="bg-deep-black border border-border-color rounded-lg p-3 text-silver text-[14px] focus:outline-none focus:border-glow-purple focus:glow-box-purple transition-all"
          />
        </div>
      </div>

      <button 
        onClick={handleGenerate}
        disabled={loading}
        className="mt-2 bg-gradient-to-r from-glow-purple to-glow-blue text-deep-black border-none px-6 py-3 rounded-lg font-bold text-[14px] uppercase cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2 glow-box-purple disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Blueprint...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Blueprint
          </>
        )}
      </button>

      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-col gap-2"
        >
          <div className="flex justify-between items-center">
            <label className="text-[12px] uppercase tracking-[1px] text-glow-blue">Generated Blueprint (JSON)</label>
            <button 
              onClick={handleCopy}
              className="text-muted-silver hover:text-silver transition-colors flex items-center gap-1 text-[12px] uppercase"
            >
              {copied ? <Check className="w-4 h-4 text-[#00FF85]" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="bg-deep-black border border-border-color rounded-lg p-4 overflow-x-auto relative">
            <pre className="text-[13px] font-mono text-silver whitespace-pre-wrap">
              {result}
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  );
};
