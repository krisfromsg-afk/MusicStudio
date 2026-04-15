import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

// UI Components
import { MinimalInput } from '../components/ui/MinimalInput';
import { MinimalTextarea } from '../components/ui/MinimalTextarea';
import { MinimalSelect } from '../components/ui/MinimalSelect';
import { MinimalToggle } from '../components/ui/MinimalToggle';
import { MinimalSlider } from '../components/ui/MinimalSlider';
import { AudioSelector } from '../components/ui/AudioSelector';
import { FileUploadDropzone } from '../components/ui/FileUploadDropzone';
import { AssetLibrary } from '../components/AssetLibrary';

// Define the tabs
const TABS = [
  { id: 'generateMusic', label: 'Generate Music', group: 'Creation' },
  { id: 'generateLyrics', label: 'Generate Lyrics', group: 'Creation' },
  { id: 'generatePersona', label: 'Generate Persona', group: 'Creation' },
  
  { id: 'extendMusic', label: 'Extend Music', group: 'Modification' },
  { id: 'boostMusicStyle', label: 'Boost Music Style', group: 'Modification' },
  { id: 'addVocals', label: 'Add Vocals', group: 'Modification' },
  { id: 'addInstrumental', label: 'Add Instrumental', group: 'Modification' },
  { id: 'replaceSection', label: 'Replace Section', group: 'Modification' },
  
  { id: 'uploadAndExtendAudio', label: 'Upload & Extend', group: 'Audio Upload & Process' },
  { id: 'coverGenerate', label: 'Cover Generate', group: 'Audio Upload & Process' },
  { id: 'uploadAndCoverAudio', label: 'Upload & Cover', group: 'Audio Upload & Process' },
  { id: 'separateVocals', label: 'Separate Vocals', group: 'Audio Upload & Process' },
  { id: 'mashupMusic', label: 'Mashup', group: 'Audio Upload & Process' },
  
  { id: 'getTimestampedLyrics', label: 'TimeStamped Lyrics', group: 'Utilities' },
  { id: 'generateMidi', label: 'Generate MIDI', group: 'Utilities' },
  { id: 'convertToWav', label: 'Convert to WAV', group: 'Utilities' },
  { id: 'createMusicVideo', label: 'Create Music Video', group: 'Utilities' },
];

export const Studio: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [formData, setFormData] = useState<Record<string, any>>({
    model: 'V5_5',
    customMode: true,
    instrumental: false,
    styleWeight: 0.5,
    audioWeight: 0.5,
    weirdnessConstraint: 0.5,
    separateVocalsSource: 'existing' // 'existing' | 'upload'
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAssetAction = (action: 'extend' | 'cover' | 'separate', id: string) => {
    switch (action) {
      case 'extend':
        setActiveTab('extendMusic');
        setFormData(prev => ({ ...prev, audioId: id }));
        break;
      case 'cover':
        setActiveTab('coverGenerate');
        setFormData(prev => ({ ...prev, audioId: id }));
        break;
      case 'separate':
        setActiveTab('separateVocals');
        setFormData(prev => ({ ...prev, separateVocalsSource: 'existing', audioId: id }));
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to use the studio");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Clean up payload based on active tab
      let payload = { ...formData };
      
      // Special handling for separateVocals radio
      if (activeTab === 'separateVocals') {
        if (payload.separateVocalsSource === 'existing') {
          delete payload.audioUrl;
        } else {
          delete payload.audioId;
        }
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/kie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: activeTab, ...payload })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute task');
      }

      const result = await response.json();
      toast.success("Task started successfully!");
      console.log("Result:", result);
      
      // Reset form or keep some data depending on UX needs
    } catch (error: any) {
      console.error("Error calling function:", error);
      toast.error(error.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group tabs for sidebar
  const groupedTabs = TABS.reduce((acc, tab) => {
    if (!acc[tab.group]) acc[tab.group] = [];
    acc[tab.group].push(tab);
    return acc;
  }, {} as Record<string, typeof TABS>);

  const renderFormContent = () => {
    switch (activeTab) {
      case 'generateMusic':
        return (
          <div className="space-y-6">
            <div className="flex gap-6">
              <MinimalToggle label="Custom Mode" checked={formData.customMode} onChange={(v) => handleInputChange('customMode', v)} />
              <MinimalToggle label="Instrumental" checked={formData.instrumental} onChange={(v) => handleInputChange('instrumental', v)} />
            </div>
            <MinimalTextarea label="Lyrics / Prompt" placeholder="Enter your lyrics or prompt..." maxLength={5000} value={formData.prompt || ''} onChange={(e) => handleInputChange('prompt', e.target.value)} required />
            
            {formData.customMode && (
              <>
                <MinimalInput label="Style" placeholder="e.g. Synthwave, Cyberpunk, 120bpm" maxLength={1000} value={formData.style || ''} onChange={(e) => handleInputChange('style', e.target.value)} />
                <MinimalInput label="Title" placeholder="Song Title" maxLength={80} value={formData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} />
              </>
            )}
            
            <MinimalSelect label="Model" options={[{value: 'V4_5', label: 'V4.5'}, {value: 'V5', label: 'V5'}, {value: 'V5_5', label: 'V5.5'}]} value={formData.model || 'V5_5'} onChange={(e) => handleInputChange('model', e.target.value)} />
            
            <details className="group border border-zinc-200 rounded-lg bg-white overflow-hidden">
              <summary className="px-4 py-3 font-medium text-sm cursor-pointer hover:bg-zinc-50 transition-colors">Advanced Settings</summary>
              <div className="p-4 border-t border-zinc-200 space-y-4 bg-zinc-50/50">
                <MinimalSlider label="Style Weight" min={0} max={1} value={formData.styleWeight} onChange={(v) => handleInputChange('styleWeight', v)} />
                <MinimalSlider label="Audio Weight" min={0} max={1} value={formData.audioWeight} onChange={(v) => handleInputChange('audioWeight', v)} />
                <MinimalSlider label="Weirdness Constraint" min={0} max={1} value={formData.weirdnessConstraint} onChange={(v) => handleInputChange('weirdnessConstraint', v)} />
                <MinimalInput label="Negative Tags" placeholder="e.g. low quality, bad audio" value={formData.negativeTags || ''} onChange={(e) => handleInputChange('negativeTags', e.target.value)} />
                <MinimalSelect label="Vocal Gender" options={[{value: '', label: 'Auto'}, {value: 'male', label: 'Male'}, {value: 'female', label: 'Female'}]} value={formData.vocalGender || ''} onChange={(e) => handleInputChange('vocalGender', e.target.value)} />
                <MinimalInput label="Persona ID" placeholder="Optional" value={formData.personaId || ''} onChange={(e) => handleInputChange('personaId', e.target.value)} />
                <MinimalInput label="Persona Model" placeholder="Optional" value={formData.personaModel || ''} onChange={(e) => handleInputChange('personaModel', e.target.value)} />
              </div>
            </details>
          </div>
        );
      
      case 'generateLyrics':
        return <MinimalTextarea label="Topic / Prompt" placeholder="What should the song be about?" value={formData.prompt || ''} onChange={(e) => handleInputChange('prompt', e.target.value)} required />;
      
      case 'generatePersona':
        return <MinimalTextarea label="Prompt" placeholder="Describe the vocal style and persona..." value={formData.prompt || ''} onChange={(e) => handleInputChange('prompt', e.target.value)} required />;
      
      case 'extendMusic':
        return (
          <div className="space-y-6">
            <AudioSelector label="Source Audio" value={formData.audioId || ''} onChange={(v) => handleInputChange('audioId', v)} required />
            <MinimalInput type="number" label="Continue At (seconds)" min={0} step={0.1} value={formData.continueAt || ''} onChange={(e) => handleInputChange('continueAt', parseFloat(e.target.value))} required />
            <MinimalTextarea label="Prompt" value={formData.prompt || ''} onChange={(e) => handleInputChange('prompt', e.target.value)} />
            <MinimalInput label="Style" value={formData.style || ''} onChange={(e) => handleInputChange('style', e.target.value)} />
            <MinimalInput label="Title" value={formData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} />
            <MinimalSelect label="Model" options={[{value: 'V4_5', label: 'V4.5'}, {value: 'V5', label: 'V5'}, {value: 'V5_5', label: 'V5.5'}]} value={formData.model || 'V5_5'} onChange={(e) => handleInputChange('model', e.target.value)} />
          </div>
        );

      case 'boostMusicStyle':
        return (
          <div className="space-y-6">
            <AudioSelector label="Source Audio" value={formData.audioId || ''} onChange={(v) => handleInputChange('audioId', v)} required />
            <MinimalInput label="Style to Boost" value={formData.style || ''} onChange={(e) => handleInputChange('style', e.target.value)} required />
            <MinimalTextarea label="Additional Prompt" value={formData.prompt || ''} onChange={(e) => handleInputChange('prompt', e.target.value)} />
          </div>
        );

      case 'addVocals':
      case 'addInstrumental':
        return (
          <div className="space-y-6">
            <AudioSelector label="Source Audio" value={formData.audioId || ''} onChange={(v) => handleInputChange('audioId', v)} required />
            <MinimalTextarea label={activeTab === 'addVocals' ? "Lyrics to Add" : "Prompt"} value={formData.prompt || ''} onChange={(e) => handleInputChange('prompt', e.target.value)} />
            <MinimalInput label="Style" value={formData.style || ''} onChange={(e) => handleInputChange('style', e.target.value)} />
            <MinimalInput label="Title" value={formData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} />
          </div>
        );

      case 'replaceSection':
        return (
          <div className="space-y-6">
            <AudioSelector label="Source Audio" value={formData.audioId || ''} onChange={(v) => handleInputChange('audioId', v)} required />
            <div className="flex gap-4">
              <MinimalInput type="number" label="Start Seconds" min={0} step={0.1} value={formData.startSeconds || ''} onChange={(e) => handleInputChange('startSeconds', parseFloat(e.target.value))} required />
              <MinimalInput type="number" label="End Seconds" min={0} step={0.1} value={formData.endSeconds || ''} onChange={(e) => handleInputChange('endSeconds', parseFloat(e.target.value))} required />
            </div>
            <MinimalTextarea label="Prompt" value={formData.prompt || ''} onChange={(e) => handleInputChange('prompt', e.target.value)} />
            <MinimalInput label="Style" value={formData.style || ''} onChange={(e) => handleInputChange('style', e.target.value)} />
            <MinimalInput label="Title" value={formData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} />
          </div>
        );

      case 'uploadAndExtendAudio':
        return (
          <div className="space-y-6">
            <FileUploadDropzone label="Upload Audio" onUploadComplete={(url) => handleInputChange('audioUrl', url)} required />
            <MinimalInput type="number" label="Continue At (seconds)" min={0} step={0.1} value={formData.continueAt || ''} onChange={(e) => handleInputChange('continueAt', parseFloat(e.target.value))} required />
            <MinimalTextarea label="Prompt" value={formData.prompt || ''} onChange={(e) => handleInputChange('prompt', e.target.value)} />
            <MinimalInput label="Style" value={formData.style || ''} onChange={(e) => handleInputChange('style', e.target.value)} />
            <MinimalInput label="Title" value={formData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} />
            <MinimalSelect label="Model" options={[{value: 'V4_5', label: 'V4.5'}, {value: 'V5', label: 'V5'}, {value: 'V5_5', label: 'V5.5'}]} value={formData.model || 'V5_5'} onChange={(e) => handleInputChange('model', e.target.value)} />
          </div>
        );

      case 'coverGenerate':
        return (
          <div className="space-y-6">
            <AudioSelector label="Source Audio" value={formData.audioId || ''} onChange={(v) => handleInputChange('audioId', v)} required />
            <MinimalTextarea label="Prompt" value={formData.prompt || ''} onChange={(e) => handleInputChange('prompt', e.target.value)} />
            <MinimalInput label="Style" value={formData.style || ''} onChange={(e) => handleInputChange('style', e.target.value)} />
            <MinimalInput label="Title" value={formData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} />
            <MinimalSelect label="Model" options={[{value: 'V4_5', label: 'V4.5'}, {value: 'V5', label: 'V5'}, {value: 'V5_5', label: 'V5.5'}]} value={formData.model || 'V5_5'} onChange={(e) => handleInputChange('model', e.target.value)} />
          </div>
        );

      case 'uploadAndCoverAudio':
        return (
          <div className="space-y-6">
            <FileUploadDropzone label="Upload Audio" onUploadComplete={(url) => handleInputChange('audioUrl', url)} required />
            <MinimalTextarea label="Prompt" value={formData.prompt || ''} onChange={(e) => handleInputChange('prompt', e.target.value)} />
            <MinimalInput label="Style" value={formData.style || ''} onChange={(e) => handleInputChange('style', e.target.value)} />
            <MinimalInput label="Title" value={formData.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} />
            <MinimalSelect label="Model" options={[{value: 'V4_5', label: 'V4.5'}, {value: 'V5', label: 'V5'}, {value: 'V5_5', label: 'V5.5'}]} value={formData.model || 'V5_5'} onChange={(e) => handleInputChange('model', e.target.value)} />
          </div>
        );

      case 'separateVocals':
        return (
          <div className="space-y-6">
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
                <input type="radio" name="source" value="existing" checked={formData.separateVocalsSource === 'existing'} onChange={(e) => handleInputChange('separateVocalsSource', e.target.value)} className="accent-zinc-900" />
                Existing Audio
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
                <input type="radio" name="source" value="upload" checked={formData.separateVocalsSource === 'upload'} onChange={(e) => handleInputChange('separateVocalsSource', e.target.value)} className="accent-zinc-900" />
                Upload New
              </label>
            </div>
            
            {formData.separateVocalsSource === 'existing' ? (
              <AudioSelector label="Source Audio" value={formData.audioId || ''} onChange={(v) => handleInputChange('audioId', v)} required />
            ) : (
              <FileUploadDropzone label="Upload Audio" onUploadComplete={(url) => handleInputChange('audioUrl', url)} required />
            )}
          </div>
        );

      case 'mashupMusic':
        return (
          <div className="space-y-6">
            <AudioSelector label="Audio Track 1" value={formData.audioId1 || ''} onChange={(v) => handleInputChange('audioId1', v)} required />
            <AudioSelector label="Audio Track 2" value={formData.audioId2 || ''} onChange={(v) => handleInputChange('audioId2', v)} required />
          </div>
        );

      case 'getTimestampedLyrics':
      case 'generateMidi':
      case 'convertToWav':
        return (
          <div className="space-y-6">
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
                <input type="radio" name="source" value="existing" checked={formData.separateVocalsSource === 'existing'} onChange={(e) => handleInputChange('separateVocalsSource', e.target.value)} className="accent-zinc-900" />
                Existing Audio
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 cursor-pointer">
                <input type="radio" name="source" value="upload" checked={formData.separateVocalsSource === 'upload'} onChange={(e) => handleInputChange('separateVocalsSource', e.target.value)} className="accent-zinc-900" />
                Upload New
              </label>
            </div>
            
            {formData.separateVocalsSource === 'existing' ? (
              <AudioSelector label="Source Audio" value={formData.audioId || ''} onChange={(v) => handleInputChange('audioId', v)} required />
            ) : (
              <FileUploadDropzone label="Upload Audio" onUploadComplete={(url) => handleInputChange('audioUrl', url)} required />
            )}
          </div>
        );

      case 'createMusicVideo':
        return (
          <div className="space-y-6">
            <AudioSelector label="Source Audio" value={formData.audioId || ''} onChange={(v) => handleInputChange('audioId', v)} required />
            <FileUploadDropzone label="Upload Background Image" accept={{'image/*': ['.png', '.jpg', '.jpeg']}} onUploadComplete={(url) => handleInputChange('imageUrl', url)} required />
          </div>
        );

      default:
        return <div>Select a tool from the sidebar.</div>;
    }
  };

  const activeTabDetails = TABS.find(t => t.id === activeTab);

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1920px] mx-auto w-full">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-[250px] flex-shrink-0 flex flex-col gap-8 p-6 lg:p-10 overflow-y-auto border-r border-zinc-200 bg-white">
          {Object.entries(groupedTabs).map(([groupName, tabs]) => (
            <div key={groupName} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 px-3">{groupName}</h3>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-zinc-100 text-zinc-900 font-medium' 
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-2xl mx-auto bg-white border border-zinc-200 rounded-2xl shadow-sm p-8 lg:p-12">
            <h1 className="text-3xl font-bold text-zinc-900 mb-8">{activeTabDetails?.label}</h1>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {renderFormContent()}
              
              <div className="pt-6 border-t border-zinc-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Execute Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* Right Sidebar: Asset Library */}
        <aside className="w-full lg:w-[350px] xl:w-[400px] flex-shrink-0 border-l border-zinc-200 bg-white hidden lg:block">
          <AssetLibrary onAction={handleAssetAction} />
        </aside>

      </div>
    </div>
  );
};
