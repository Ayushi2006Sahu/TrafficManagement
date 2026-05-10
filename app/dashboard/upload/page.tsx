'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, CloudUpload, CheckCircle, XCircle, FileVideo,
  Image as ImageIcon, Loader2, Trash2, Play, Eye
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { TopBar } from '@/components/layout/Sidebar';
import { cn } from '@/lib/utils';

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  url?: string;
  uploadId?: string;
  error?: string;
}

const JUNCTION_OPTIONS = ['Main Street Junction', 'Central Crossing', 'Harbor View', 'Tech Park Gate'];

export default function UploadPage() {
  const supabase = createClient();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [junction, setJunction] = useState(JUNCTION_OPTIONS[0]);
  const [previewFile, setPreviewFile] = useState<UploadFile | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    const newFiles = accepted.map(file => ({
      id: Math.random().toString(36).slice(2),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const uploadFile = async (uf: UploadFile) => {
    setFiles(prev => prev.map(f => f.id === uf.id ? { ...f, status: 'uploading', progress: 10 } : f));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const ext = uf.file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}-${uf.file.name}`;

      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => f.id === uf.id && f.progress < 85
          ? { ...f, progress: f.progress + 10 }
          : f
        ));
      }, 300);

      const { error: storageError } = await supabase.storage
        .from('traffic-media')
        .upload(path, uf.file, { cacheControl: '3600', upsert: false });

      clearInterval(progressInterval);
      if (storageError) throw storageError;

      const { data: { publicUrl } } = supabase.storage
        .from('traffic-media')
        .getPublicUrl(path);

      const fileType = uf.file.type.startsWith('video/') ? 'video' : 'image';
      const { data: uploadRecord, error: dbError } = await supabase
        .from('traffic_uploads')
        .insert({
          file_url: publicUrl,
          file_name: uf.file.name,
          file_type: fileType,
          file_size: uf.file.size,
          uploaded_by: user.id,
          junction_name: junction,
          status: 'pending',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setFiles(prev => prev.map(f =>
        f.id === uf.id
          ? { ...f, status: 'done', progress: 100, url: publicUrl, uploadId: uploadRecord.id }
          : f
      ));
    } catch (err: any) {
      setFiles(prev => prev.map(f =>
        f.id === uf.id ? { ...f, status: 'error', progress: 0, error: err.message } : f
      ));
    }
  };

  const uploadAll = () => {
    files.filter(f => f.status === 'pending').forEach(uploadFile);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const formatSize = (bytes: number) =>
    bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const doneCount = files.filter(f => f.status === 'done').length;

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Upload Traffic Footage" subtitle="Upload images or videos for AI analysis" />

      <div className="flex-1 p-6 space-y-6 max-w-5xl">
        {/* Junction selector */}
        <div className="glass-card p-5">
          <label className="block text-xs text-gray-400 font-medium mb-3 uppercase tracking-wider">
            Target Junction
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {JUNCTION_OPTIONS.map(j => (
              <button key={j} onClick={() => setJunction(j)}
                className={cn(
                  'px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200',
                  junction === j
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                )}>
                {j}
              </button>
            ))}
          </div>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            'glass-card p-10 border-2 border-dashed text-center cursor-pointer transition-all duration-300',
            isDragActive
              ? 'border-cyan-400/60 bg-cyan-500/10 scale-[1.01]'
              : 'border-white/10 hover:border-cyan-500/40 hover:bg-white/3'
          )}
        >
          <input {...getInputProps()} />
          <motion.div
            animate={{ y: isDragActive ? -8 : 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="flex flex-col items-center gap-4"
          >
            <div className={cn(
              'w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300',
              isDragActive ? 'bg-cyan-500/30 border border-cyan-400/50' : 'bg-white/5 border border-white/10'
            )}>
              <CloudUpload className={cn('w-10 h-10', isDragActive ? 'text-cyan-400' : 'text-gray-500')} />
            </div>
            <div>
              <p className="text-lg font-semibold text-white mb-1">
                {isDragActive ? 'Drop files here' : 'Drag & drop traffic footage'}
              </p>
              <p className="text-gray-400 text-sm">
                or <span className="text-cyan-400 font-medium">browse files</span> · Images & Videos · Max 100MB
              </p>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> JPG, PNG, WEBP</span>
              <span className="flex items-center gap-1"><FileVideo className="w-3.5 h-3.5" /> MP4, MOV, AVI</span>
            </div>
          </motion.div>
        </div>

        {/* File list */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-sm">Upload Queue</h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {doneCount}/{files.length} uploaded · {pendingCount} pending
                  </p>
                </div>
                {pendingCount > 0 && (
                  <button onClick={uploadAll} className="btn-primary flex items-center gap-2 py-2 px-4 text-sm">
                    <Upload className="w-4 h-4" /> Upload All ({pendingCount})
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {files.map(uf => (
                  <motion.div key={uf.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-dark-800 flex items-center justify-center shrink-0">
                      {uf.file.type.startsWith('image/') ? (
                        <img src={uf.preview} alt={uf.file.name} className="w-full h-full object-cover" />
                      ) : (
                        <FileVideo className="w-6 h-6 text-gray-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{uf.file.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatSize(uf.file.size)} · {junction}</p>
                      {uf.status === 'uploading' && (
                        <div className="mt-2 w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${uf.progress}%` }}
                          />
                        </div>
                      )}
                      {uf.error && <p className="text-red-400 text-xs mt-1">{uf.error}</p>}
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 shrink-0">
                      {uf.status === 'pending' && (
                        <button onClick={() => uploadFile(uf)} className="btn-secondary py-1.5 px-3 text-xs">
                          Upload
                        </button>
                      )}
                      {uf.status === 'uploading' && (
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                      )}
                      {uf.status === 'done' && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          <button onClick={() => setPreviewFile(uf)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      {uf.status === 'error' && <XCircle className="w-5 h-5 text-red-400" />}
                      <button onClick={() => removeFile(uf.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-gray-500 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {doneCount > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {doneCount} file(s) uploaded successfully. Head to AI Analysis to process them.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewFile(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="glass-card neon-border p-4 max-w-2xl w-full"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white truncate">{previewFile.file.name}</p>
                <button onClick={() => setPreviewFile(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              {previewFile.file.type.startsWith('image/') ? (
                <img src={previewFile.preview} alt="preview" className="w-full rounded-xl max-h-96 object-contain" />
              ) : (
                <video src={previewFile.preview} controls className="w-full rounded-xl max-h-96" />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
