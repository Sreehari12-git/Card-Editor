import React from 'react';
import { CardDetails, SidebarTab } from '../types';

interface DetailsPanelProps {
  activeTab: SidebarTab;
  details: CardDetails;
  onChangeDetails: (updated: Partial<CardDetails>) => void;
  onAddText?: (text: string, style?: any) => void;
  onAddShape?: (type: 'rect' | 'circle' | 'star') => void;
  onAddQrCode?: () => void;
  onChangeBackground?: (color: string) => void;
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  activeTab,
  details,
  onChangeDetails,
  onAddText,
  onAddShape,
  onAddQrCode,
  onChangeBackground,
}) => {
  return (
    <aside className="w-72 bg-white border-r border-neutral-200 flex flex-col h-full overflow-y-auto">
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
        <div className="p-5 flex flex-col gap-3">
          <h2 className="text-base font-bold text-neutral-900">Add Text</h2>
          <button
            onClick={() => onAddText?.('Heading Text', { fontSize: 32, fontWeight: 'bold' })}
            className="w-full py-2.5 px-3 border border-neutral-300 rounded-lg text-left text-sm font-bold text-neutral-900 hover:bg-neutral-50"
          >
            Add a Heading
          </button>
          <button
            onClick={() => onAddText?.('Subheading Text', { fontSize: 20, fontWeight: '600' })}
            className="w-full py-2.5 px-3 border border-neutral-300 rounded-lg text-left text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Add a Subheading
          </button>
          <button
            onClick={() => onAddText?.('Body text goes here', { fontSize: 14 })}
            className="w-full py-2.5 px-3 border border-neutral-300 rounded-lg text-left text-xs text-neutral-600 hover:bg-neutral-50"
          >
            Add Body Text
          </button>
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
