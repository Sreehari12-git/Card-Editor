import React, { useEffect } from 'react';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  side?: 'Front' | 'Back';
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  side = 'Front',
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      {/* Modal Dialog Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#faf8f5] rounded-2xl shadow-2xl border border-neutral-200/80 max-w-2xl w-full p-6 flex flex-col transition-all transform scale-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-200/60 mb-5">
          <h2 className="text-base font-bold text-neutral-900 tracking-tight">
            Preview
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-rose-500 hover:text-rose-600 border border-rose-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-sm font-semibold"
            title="Close Preview"
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Card Image Render */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full bg-white rounded-xl shadow-md border border-neutral-200/70 overflow-hidden flex items-center justify-center p-2">
            <img
              src={imageUrl}
              alt="Card Preview"
              className="w-full h-auto rounded-lg object-contain"
            />
          </div>

          {/* Subtitle tag (Front / Back) */}
          <span className="text-xs font-medium text-neutral-500 mt-4 tracking-wide">
            {side}
          </span>
        </div>
      </div>
    </div>
  );
};
