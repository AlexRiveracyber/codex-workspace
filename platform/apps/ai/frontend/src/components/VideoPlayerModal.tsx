import React from 'react';
import { X } from 'lucide-react';

interface VideoPlayerModalProps {
  isOpen: boolean;
  videoUrl: string;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, videoUrl, onClose }) => {
  if (!isOpen || !videoUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative max-w-4xl w-full flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-1.5 rounded-xl bg-white/90 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200 shadow-md transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
        <video
          src={videoUrl}
          controls
          autoPlay
          className="w-full rounded-2xl border border-slate-700 shadow-2xl max-h-[80vh] bg-black"
        />
      </div>
    </div>
  );
};
