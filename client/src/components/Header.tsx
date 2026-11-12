import React from 'react';
import { DesignTemplate } from '../types';

interface HeaderProps {
  templates: DesignTemplate[];
  selectedTemplate: DesignTemplate | null;
  onSelectTemplate: (template: DesignTemplate) => void;
  activeSide?: 'front' | 'back';
  onToggleSide?: () => void;
  onSave: () => void;
  onPreview: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
  onImportJson?: (data: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  templates,
  selectedTemplate,
  onSelectTemplate,
  onSave,
  onPreview,
  onPublish,
  isPublishing = false,
  onImportJson,
}) => {
  return (
    <header className="h-14 bg-[#faf8f5] border-b border-neutral-200 px-4 flex items-center justify-between select-none">
      {/* Left section: Back button & Template selector */}
      <div className="flex items-center gap-2">
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 hover:bg-neutral-200/60 transition-colors"
          title="Back"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>

        {/* Template Selector Dropdown */}
        <div className="relative">
          <select
            value={selectedTemplate?.id || ''}
            onChange={(e) => {
              const tmpl = templates.find((t) => t.id === e.target.value);
              if (tmpl) onSelectTemplate(tmpl);
            }}
            className="appearance-none bg-white border border-neutral-300 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-neutral-800 shadow-sm hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer max-w-xs truncate"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-neutral-500">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all"
        >
          <svg
            className="w-3.5 h-3.5 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span>Preview</span>
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all cursor-pointer"
          title="Save as PNG image"
        >
          <svg
            className="w-3.5 h-3.5 text-neutral-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          <span>Save</span>
        </button>

        {/* Publish Button: Downloads entire card as JSON with vector data & images */}
        <button
          onClick={onPublish}
          disabled={isPublishing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          title="Publish and download entire card as JSON"
        >
          <svg
            className="w-3.5 h-3.5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          <span>{isPublishing ? 'Publishing...' : 'Publish'}</span>
        </button>

        {/* Import JSON Button: Restores card vector design & images from JSON */}
        {onImportJson && (
          <label
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 shadow-sm transition-all cursor-pointer"
            title="Import card from JSON file"
          >
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const parsed = JSON.parse(event.target?.result as string);
                    onImportJson(parsed);
                  } catch (err) {
                    console.error('Invalid JSON file', err);
                    alert('Failed to parse JSON file. Please ensure it is a valid card JSON.');
                  }
                };
                reader.readAsText(file);
                e.target.value = '';
              }}
            />
            <svg
              className="w-3.5 h-3.5 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Import JSON</span>
          </label>
        )}

        <button
          className="w-8 h-8 rounded-lg border border-neutral-300 bg-white flex items-center justify-center text-neutral-600 hover:bg-neutral-50 shadow-sm"
          title="Duplicate"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0f1d38] hover:bg-[#1a2d52] text-white rounded-lg text-xs font-semibold shadow transition-all ml-1"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <span>Order</span>
        </button>
      </div>
    </header>
  );
};
