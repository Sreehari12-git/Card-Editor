import React from 'react';

export const TopNav: React.FC = () => {
  return (
    <div className="h-12 bg-[#faf8f5] border-b border-neutral-200/80 px-6 flex items-center justify-between select-none">
      {/* Brand logo & nav links */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg font-bold tracking-tight text-neutral-900">
            PrintBiz<span className="text-blue-600">.</span>
          </span>
        </div>

        <nav className="flex items-center gap-6 text-xs font-medium text-neutral-600">
          <a href="#" className="hover:text-neutral-900 transition-colors">
            Templates
          </a>
          <a href="#" className="hover:text-neutral-900 transition-colors">
            My cards
          </a>
          <a href="#" className="hover:text-neutral-900 transition-colors">
            QR analytics
          </a>
          <a href="#" className="text-neutral-900 font-semibold transition-colors">
            Editors
          </a>
          <a href="#" className="hover:text-neutral-900 transition-colors">
            Orders
          </a>
        </nav>
      </div>

      {/* Right Account button */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 px-3 py-1 bg-white border border-neutral-300 rounded-full text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-sm transition-all">
          <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>Account</span>
        </button>
      </div>
    </div>
  );
};
