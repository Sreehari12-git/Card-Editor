import React, { useState, useRef, useEffect } from 'react';
import { FONTS, FONT_CATEGORIES, FontCategory } from '../data/fonts';

interface FontPickerDropdownProps {
  currentFont: string;
  onSelectFont: (fontFamily: string) => void;
  className?: string;
}

export const FontPickerDropdown: React.FC<FontPickerDropdownProps> = ({
  currentFont,
  onSelectFont,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FontCategory>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const filteredFonts = FONTS.filter((font) => {
    const matchesSearch = font.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || font.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2 px-2.5 py-1 min-w-[130px] max-w-[170px] h-7 bg-white hover:bg-neutral-50 border border-neutral-300 rounded text-xs text-neutral-800 transition-colors shadow-xs cursor-pointer"
        title="Change Font Family"
      >
        <span
          className="truncate text-left text-sm font-medium"
          style={{ fontFamily: currentFont || 'Inter' }}
        >
          {currentFont || 'Inter'}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 max-h-[380px] bg-white border border-neutral-200 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search Bar */}
          <div className="p-2 border-b border-neutral-100">
            <div className="relative flex items-center">
              <svg
                className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fonts..."
                className="w-full pl-8 pr-2 py-1 text-xs bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 rounded text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-b border-neutral-100 overflow-x-auto no-scrollbar bg-neutral-50/50">
            {FONT_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-200/70 border border-neutral-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Fonts List */}
          <div className="overflow-y-auto max-h-[260px] p-1 divide-y divide-neutral-50">
            {filteredFonts.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-400">
                No fonts matching "{searchQuery}"
              </div>
            ) : (
              filteredFonts.map((font) => {
                const isSelected = (currentFont || 'Inter') === font.family;
                return (
                  <button
                    key={font.family}
                    type="button"
                    onClick={() => {
                      onSelectFont(font.family);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between text-left rounded transition-colors group cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span
                        className="text-base truncate leading-normal"
                        style={{ fontFamily: font.family }}
                      >
                        {font.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 group-hover:text-neutral-500">
                        {font.category}
                      </span>
                    </div>

                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-blue-600 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
