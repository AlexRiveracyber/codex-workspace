import React from 'react';
import { X, Download } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ isOpen, imageUrl, onClose }) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
          <a
            href={imageUrl}
            download="ai_generated_image.png"
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-white/90 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200 shadow-md transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/90 text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200 shadow-md transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <img
          src={imageUrl}
          alt="Generated preview"
          className="max-h-[85vh] max-w-full rounded-2xl object-contain border border-slate-200 shadow-2xl bg-white"
        />
      </div>
    </div>
  );
};
