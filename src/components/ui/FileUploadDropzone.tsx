import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { UploadCloud, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface FileUploadDropzoneProps {
  label?: string;
  accept?: Record<string, string[]>;
  onUploadComplete: (url: string) => void;
  error?: string;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({ 
  label = 'Upload File', 
  accept = { 'audio/*': ['.mp3', '.wav', '.m4a'] },
  onUploadComplete,
  error 
}) => {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !user) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadedUrl(null);

    const storage = getStorage();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const storageRef = ref(storage, `inputs/${user.uid}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      }, 
      (error) => {
        console.error("Upload failed", error);
        toast.error("Upload failed. Please try again.");
        setIsUploading(false);
      }, 
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setUploadedUrl(downloadURL);
        setIsUploading(false);
        onUploadComplete(downloadURL);
        toast.success("File uploaded successfully!");
      }
    );
  }, [user, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept,
    maxFiles: 1
  } as any);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-zinc-700">{label}</label>}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'}
          ${error ? 'border-red-500' : ''}
          ${isUploading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-zinc-900 animate-spin" />
            <span className="text-sm font-medium text-zinc-700">Uploading... {Math.round(uploadProgress)}%</span>
          </div>
        ) : uploadedUrl ? (
          <div className="flex flex-col items-center gap-2 text-green-600">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-sm font-medium">File ready</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-zinc-500">
            <UploadCloud className="w-6 h-6" />
            <span className="text-sm">
              {isDragActive ? "Drop file here" : "Drag & drop file here, or click to select"}
            </span>
            <span className="text-xs text-zinc-400">
              Supported formats: {Object.values(accept).flat().join(', ')}
            </span>
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
