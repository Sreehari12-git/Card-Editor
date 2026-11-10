import React, { useState } from 'react';
import { CardDetails, PRODUCTS, SidebarTab } from '../types';
import { FONTS, FONT_CATEGORIES, FontCategory } from '../data/fonts';

interface DetailsPanelProps {
  activeTab: SidebarTab;
  details: CardDetails;
  onChangeDetails: (updated: Partial<CardDetails>) => void;
  onAddText?: (text: string, style?: any) => void;
  onAddShape?: (type: 'rect' | 'circle' | 'star') => void;
  onAddQrCode?: () => void;
  onChangeBackground?: (color: string) => void;
  onSelectFont?: (fontFamily: string) => void;
  activeFontFamily?: string;
  selectedProductId?: string;
  onSelectProduct?: (productId: string) => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  activeTab,
  details,
  onChangeDetails,
  onAddText,
  onAddShape,
  onAddQrCode,
  onChangeBackground,
  onSelectFont,
  activeFontFamily = 'Inter',
  selectedProductId = 'business-card',
  onSelectProduct,
}) => {
  const [fontSearch, setFontSearch] = useState('');
  const [selectedFontCategory, setSelectedFontCategory] = useState<FontCategory>('All');

  const filteredFonts = FONTS.filter((font) => {
    const matchesSearch = font.name.toLowerCase().includes(fontSearch.toLowerCase());
    const matchesCategory =
      selectedFontCategory === 'All' || font.category === selectedFontCategory;
    return matchesSearch && matchesCategory;
  });
  return (
    <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col h-full overflow-y-auto overflow-x-hidden">
      {/* Product tab */}
      {activeTab === 'product' && (
        <div className="p-3.5 flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 tracking-tight">Product</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
              Each product keeps its own design. Switch any time.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {PRODUCTS.map((prod) => {
              const isSelected = (selectedProductId || 'business-card') === prod.id;
              return (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => onSelectProduct?.(prod.id)}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center gap-2.5 border-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-white shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 shadow-2xs'
                  }`}
                >
                  {/* Icon Thumbnail */}
                  <div className="w-11 h-11 bg-neutral-50 rounded-lg flex items-center justify-center shrink-0 border border-neutral-100">
                    {prod.id === 'business-card' && (
                      <div className="w-7 h-4 border border-neutral-300 rounded-[1px] bg-white" />
                    )}
                    {prod.id === 'folded-card' && (
                      <div className="w-7 h-4.5 border border-neutral-300 rounded-[1px] bg-white flex overflow-hidden">
                        <div className="w-1/2 h-full border-r border-dashed border-neutral-300" />
                        <div className="w-1/2 h-full" />
                      </div>
                    )}
                    {prod.id === 'tri-fold-brochure' && (
                      <div className="w-7 h-4.5 border border-neutral-300 rounded-[1px] bg-white flex overflow-hidden">
                        <div className="w-1/3 h-full border-r border-dashed border-neutral-300" />
                        <div className="w-1/3 h-full border-r border-dashed border-neutral-300" />
                        <div className="w-1/3 h-full" />
                      </div>
                    )}
                    {prod.id === 'booklet' && (
                      <div className="w-4 h-5.5 border border-neutral-300 rounded-[1px] bg-white" />
                    )}
                    {prod.id === 'flyer' && (
                      <div className="w-4 h-5.5 border border-neutral-300 rounded-[1px] bg-white" />
                    )}
                  </div>

                  {/* Info details */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-neutral-900 leading-tight">
                      {prod.name}
                    </span>
                    <span className="text-[11px] text-neutral-500 mt-0.5 leading-tight">
                      {prod.subtitle}
                    </span>
                    <div className="mt-1">
                      <span
                        className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {prod.badge}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 tracking-tight">
              Your details
            </h2>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              These fill the card. Text you edit directly on the card stays as you typed it.
            </p>
          </div>

          <div className="flex flex-col gap-3.5">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={details.email}
                onChange={(e) => onChangeDetails({ email: e.target.value })}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Phone <span className="text-neutral-400">*</span>
              </label>
              <input
                type="tel"
                value={details.phone}
                onChange={(e) => onChangeDetails({ phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            {/* Tagline / specialty */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Tagline / specialty
              </label>
              <input
                type="text"
                value={details.tagline}
                onChange={(e) => onChangeDetails({ tagline: e.target.value })}
                placeholder="CPA, Accountant"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Website
              </label>
              <input
                type="text"
                value={details.website}
                onChange={(e) => onChangeDetails({ website: e.target.value })}
                placeholder="www.yourwebsite.com"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            {/* Full name */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Full name <span className="text-neutral-400">*</span>
              </label>
              <input
                type="text"
                value={details.fullName}
                onChange={(e) => onChangeDetails({ fullName: e.target.value })}
                placeholder="John Doe"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm font-medium"
              />
            </div>

            {/* Logo text */}
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Logo text
              </label>
              <input
                type="text"
                value={details.logoText}
                onChange={(e) => onChangeDetails({ logoText: e.target.value })}
                placeholder="Brand / Logo"
                className="w-full px-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Text tab */}
      {activeTab === 'text' && (
        <div className="p-4 flex flex-col gap-3">
          <h2 className="text-base font-bold text-neutral-900">Add Text</h2>
          <button
            onClick={() => onAddText?.('Heading Text', { fontSize: 32, fontWeight: 'bold' })}
            className="w-full py-2.5 px-3 border border-neutral-300 rounded-lg text-left text-sm font-bold text-neutral-900 hover:bg-neutral-50 cursor-pointer shadow-xs"
          >
            Add a Heading
          </button>
          <button
            onClick={() => onAddText?.('Subheading Text', { fontSize: 20, fontWeight: '600' })}
            className="w-full py-2 px-3 border border-neutral-300 rounded-lg text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50 cursor-pointer shadow-xs"
          >
            Add a Subheading
          </button>
          <button
            onClick={() => onAddText?.('Body text goes here', { fontSize: 14 })}
            className="w-full py-2 px-3 border border-neutral-300 rounded-lg text-left text-xs text-neutral-600 hover:bg-neutral-50 cursor-pointer shadow-xs"
          >
            Add Body Text
          </button>

          {/* Font Library Section */}
          <div className="mt-3 pt-3 border-t border-neutral-200 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Font Library ({FONTS.length})
              </h3>
              <span className="text-[10px] text-neutral-400">Click to apply</span>
            </div>

            {/* Font Search Input */}
            <div className="relative">
              <svg
                className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5 pointer-events-none"
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
                value={fontSearch}
                onChange={(e) => setFontSearch(e.target.value)}
                placeholder="Search 20 fonts..."
                className="w-full pl-8 pr-2 py-1.5 text-xs bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-300 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {FONT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedFontCategory(cat)}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                    selectedFontCategory === cat
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Font Cards List */}
            <div className="flex flex-col gap-1.5 max-h-[380px] overflow-y-auto pr-0.5">
              {filteredFonts.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400">
                  No fonts matching "{fontSearch}"
                </div>
              ) : (
                filteredFonts.map((font) => {
                  const isCurrent = activeFontFamily === font.family;
                  return (
                    <button
                      key={font.family}
                      type="button"
                      onClick={() => onSelectFont?.(font.family)}
                      className={`w-full p-2.5 rounded-lg border text-left transition-all group cursor-pointer ${
                        isCurrent
                          ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500/20'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/80 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] font-semibold text-neutral-500">
                          {font.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-500 group-hover:bg-neutral-200/80">
                          {font.category}
                        </span>
                      </div>
                      <div
                        className="text-xl text-neutral-900 truncate leading-tight pt-0.5"
                        style={{ fontFamily: font.family }}
                      >
                        {font.sampleText || font.name}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Graphics tab */}
      {activeTab === 'graphics' && (
        <div className="p-5 flex flex-col gap-3">
          <h2 className="text-base font-bold text-neutral-900">Graphics & Shapes</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onAddShape?.('rect')}
              className="p-3 border border-neutral-300 rounded-lg flex flex-col items-center justify-center hover:bg-neutral-50 text-xs font-medium"
            >
              <div className="w-8 h-6 bg-blue-500 rounded mb-1" />
              Box
            </button>
            <button
              onClick={() => onAddShape?.('circle')}
              className="p-3 border border-neutral-300 rounded-lg flex flex-col items-center justify-center hover:bg-neutral-50 text-xs font-medium"
            >
              <div className="w-7 h-7 bg-blue-500 rounded-full mb-1" />
              Circle
            </button>
            <button
              onClick={() => onAddShape?.('star')}
              className="p-3 border border-neutral-300 rounded-lg flex flex-col items-center justify-center hover:bg-neutral-50 text-xs font-medium col-span-2"
            >
              <div className="text-xl text-blue-500 mb-1">✳️</div>
              8-Point Star Emblem
            </button>
          </div>
        </div>
      )}

      {/* QR Code tab */}
      {activeTab === 'qrcode' && (
        <div className="p-5 flex flex-col gap-3">
          <h2 className="text-base font-bold text-neutral-900">QR Code</h2>
          <p className="text-xs text-neutral-500">Insert a scannable contact QR code onto your card.</p>
          <button
            onClick={onAddQrCode}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold shadow transition-all"
          >
            Add QR Code to Card
          </button>
        </div>
      )}

      {/* Colours / Background tab */}
      {(activeTab === 'colours' || activeTab === 'background') && (
        <div className="p-5 flex flex-col gap-3">
          <h2 className="text-base font-bold text-neutral-900">Card Background</h2>
          <div className="grid grid-cols-4 gap-2">
            {[
              '#ffffff',
              '#f8fafc',
              '#f1f5f9',
              '#e2e8f0',
              '#0f172a',
              '#1e3a8a',
              '#0284c7',
              '#047857',
              '#b91c1c',
              '#7c2d12',
              '#4c1d95',
              '#831843',
            ].map((color) => (
              <button
                key={color}
                onClick={() => onChangeBackground?.(color)}
                className="w-10 h-10 rounded-lg border border-neutral-300 shadow-sm transition-transform hover:scale-105"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Layers tab */}
      {activeTab === 'layers' && (
        <div className="p-5 flex flex-col gap-2">
          <h2 className="text-base font-bold text-neutral-900">Canvas Layers</h2>
          <p className="text-xs text-neutral-500">All elements currently placed on the canvas.</p>
        </div>
      )}
    </aside>
  );
};
