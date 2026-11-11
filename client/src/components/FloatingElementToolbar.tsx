import React, { useState, useRef, useEffect } from 'react';
import { FONTS } from '../data/fonts';

interface FloatingElementToolbarProps {
  position: { x: number; y: number } | null;
  isText: boolean;
  fontFamily: string;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  textAlign: 'left' | 'center' | 'right';
  color: string;
  onFontChange: (fontFamily: string) => void;
  onFontSizeChange: (delta: number) => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onCycleAlign: () => void;
  onColorChange: (color: string) => void;
  onDelete: () => void;
}

export const FloatingElementToolbar: React.FC<FloatingElementToolbarProps> = ({
  position,
  isText,
  fontFamily,
  fontSize,
  isBold,
  isItalic,
  textAlign,
  color,
  onFontChange,
  onFontSizeChange,
  onToggleBold,
  onToggleItalic,
  onCycleAlign,
  onColorChange,
  onDelete,
}) => {
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [fontSearch, setFontSearch] = useState('');
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Close font menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target as Node)) {
        setIsFontMenuOpen(false);
      }
    };
    if (isFontMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isFontMenuOpen]);

  if (!position) return null;

  const filteredFonts = FONTS.filter((f) =>
    f.name.toLowerCase().includes(fontSearch.toLowerCase())
  );

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y - 26}px`,
        transform: 'translate(-50%, -100%)',
      }}
      className="absolute z-40 bg-[#0f172a] text-white px-3 py-1.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-2 select-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-100"
    >
      {isText ? (
        <>
          {/* Font Family Selector Button */}
          <div className="relative" ref={fontMenuRef}>
            <button
              type="button"
              onClick={() => setIsFontMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white hover:text-slate-200 px-1.5 py-1 rounded hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Change font"
            >
              <span
                className="max-w-[110px] truncate"
                style={{ fontFamily: fontFamily || 'Inter' }}
              >
                {fontFamily || 'Inter'}
              </span>
              <svg
                className={`w-3 h-3 text-slate-400 transition-transform ${
                  isFontMenuOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dark Font Menu Dropdown */}
            {isFontMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 max-h-[320px] bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
                <div className="p-2 border-b border-slate-700/80">
                  <input
                    type="text"
                    value={fontSearch}
                    onChange={(e) => setFontSearch(e.target.value)}
                    placeholder="Search fonts..."
                    className="w-full px-2.5 py-1 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto max-h-[250px] p-1 divide-y divide-slate-800">
                  {filteredFonts.map((f) => {
                    const isSelected = (fontFamily || 'Inter') === f.family;
                    return (
                      <button
                        key={f.family}
                        type="button"
                        onClick={() => {
                          onFontChange(f.family);
                          setIsFontMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 flex items-center justify-between text-left rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/30 text-blue-400'
                            : 'hover:bg-slate-800 text-slate-200'
                        }`}
                      >
                        <span className="text-sm truncate" style={{ fontFamily: f.family }}>
                          {f.name}
                        </span>
                        <span className="text-[10px] text-slate-400">{f.category}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-slate-700" />

          {/* Font Size Stepper */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onFontSizeChange(-2)}
              className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded text-sm font-bold cursor-pointer transition-colors"
              title="Decrease font size"
            >
              -
            </button>
            <span className="text-xs font-bold text-white min-w-[20px] text-center">
              {fontSize}
            </span>
            <button
              type="button"
              onClick={() => onFontSizeChange(2)}
              className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded text-sm font-bold cursor-pointer transition-colors"
              title="Increase font size"
            >
              +
            </button>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-slate-700" />

          {/* Bold Toggle */}
          <button
            type="button"
            onClick={onToggleBold}
            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-colors cursor-pointer ${
              isBold
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Bold"
          >
            B
          </button>

          {/* Italic Toggle */}
          <button
            type="button"
            onClick={onToggleItalic}
            className={`w-6 h-6 rounded flex items-center justify-center text-xs italic font-serif transition-colors cursor-pointer ${
              isItalic
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Italic"
          >
            I
          </button>

          {/* Color Circle Swatch */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: color || '#0f172a' }}
              title="Text Color"
            />
            <input
              ref={colorInputRef}
              type="color"
              value={color || '#0f172a'}
              onChange={(e) => onColorChange(e.target.value)}
              className="sr-only"
            />
          </div>

          {/* Text Alignment */}
          <button
            type="button"
            onClick={onCycleAlign}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            title={`Align: ${textAlign}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {textAlign === 'left' && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h10M4 18h14" />
              )}
              {textAlign === 'center' && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M7 12h10M5 18h14" />
              )}
              {textAlign === 'right' && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M10 12h10M6 18h14" />
              )}
            </svg>
          </button>
        </>
      ) : (
        /* Shape / Non-Text Element controls */
        <>
          <span className="text-xs font-medium text-slate-300">Element</span>
          {/* Color picker for shapes */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: color || '#38bdf8' }}
              title="Fill Color"
            />
            <input
              ref={colorInputRef}
              type="color"
              value={color || '#38bdf8'}
              onChange={(e) => onColorChange(e.target.value)}
              className="sr-only"
            />
          </div>
        </>
      )}

      {/* Divider */}
      <div className="h-4 w-px bg-slate-700" />

      {/* Delete Button */}
      <button
        type="button"
        onClick={onDelete}
        className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
        title="Delete element"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </div>
  );
};
