import React, { useState } from 'react';
import { LayoutGrid, Wrench } from 'lucide-react';
import { ToolNavigation } from './components/ToolNavigation';

import { CodecTools } from './components/CodecTools';
import { CryptoTools } from './components/CryptoTools';
import { FormatCodeTools } from './components/FormatCodeTools';
import { TimeCronTools } from './components/TimeCronTools';
import { NetworkTools } from './components/NetworkTools';
import { TextRegexTools } from './components/TextRegexTools';
import { VisualColorTools } from './components/VisualColorTools';
import { CheatSheetTools } from './components/CheatSheetTools';
import { SnippetManager } from './components/SnippetManager';
import { CalendarTools } from './components/CalendarTools';

export const App: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('codec');

  return (
    <div className="tool-workbench min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="tool-topbar h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40 shrink-0 shadow-xs">
        <div className="tool-brand flex items-center gap-3">
          <div className="tool-wordmark flex items-center gap-2.5">
            <div className="tool-brand-mark w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="tool-eyebrow">PLATFORM / UTILITY DECK</div>
              <div className="flex items-center gap-2">
                <h1 className="tool-title text-sm font-bold text-slate-900 tracking-tight">Toolbox</h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono font-semibold">
                  10 DECKS
                </span>
              </div>
            </div>
          </div>
        </div>

        <ToolNavigation activeCategory={activeCategory} onSelect={setActiveCategory} />

        {/* Status */}
        <div className="tool-topbar-actions flex items-center gap-2.5">
          <div className="tool-status hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-xs text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 text-[11px]">API 8084:</span>
            <span className="font-mono text-emerald-700 font-semibold text-[11px]">Online</span>
          </div>

          <a
            href="http://localhost:3100"
            target="_blank"
            rel="noreferrer"
            className="tool-platform-link flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Platform (3100)</span>
          </a>
        </div>
      </header>

      <div className="tool-layout flex-1 flex w-full">
        {/* Content Area (Maximized space for laptops) */}
        <main className="tool-main flex-1 min-w-0 overflow-y-auto">
          {activeCategory === 'codec' && <CodecTools />}
          {activeCategory === 'crypto' && <CryptoTools />}
          {activeCategory === 'format_code' && <FormatCodeTools />}
          {activeCategory === 'time_cron' && <TimeCronTools />}
          {activeCategory === 'network' && <NetworkTools />}
          {activeCategory === 'text_regex' && <TextRegexTools />}
          {activeCategory === 'visual_color' && <VisualColorTools />}
          {activeCategory === 'cheat_sheet' && <CheatSheetTools />}
          {activeCategory === 'snippets' && <SnippetManager />}
          {activeCategory === 'calendar' && <CalendarTools />}
        </main>
      </div>
    </div>
  );
};
