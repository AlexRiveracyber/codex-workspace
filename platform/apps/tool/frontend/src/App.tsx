import React, { useState } from 'react';
import {
  Binary,
  ShieldCheck,
  FileCode2,
  Clock,
  Globe,
  GitCompare,
  Palette,
  BookOpen,
  Bookmark,
  LayoutGrid,
  Sparkles,
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

import { CodecTools } from './components/CodecTools';
import { CryptoTools } from './components/CryptoTools';
import { FormatCodeTools } from './components/FormatCodeTools';
import { TimeCronTools } from './components/TimeCronTools';
import { NetworkTools } from './components/NetworkTools';
import { TextRegexTools } from './components/TextRegexTools';
import { VisualColorTools } from './components/VisualColorTools';
import { CheatSheetTools } from './components/CheatSheetTools';
import { SnippetManager } from './components/SnippetManager';

export const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return window.innerWidth < 760 || localStorage.getItem('devtools_sidebar_collapsed') === 'true';
  });
  const [activeCategory, setActiveCategory] = useState('codec');

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('devtools_sidebar_collapsed', String(next));
      return next;
    });
  };

  const navCategories = [
    { id: 'codec', label: '编码与转换', desc: 'Base64 / URL / JWT / 进制 / Unicode', icon: Binary },
    { id: 'crypto', label: '加解密与安全', desc: 'MD5/SHA/SM3, AES/SM4, RSA, 随机ID', icon: ShieldCheck },
    { id: 'format_code', label: '格式化与代码生成', desc: 'JSON/YAML, JSON转Java/TS, SQL转实体', icon: FileCode2 },
    { id: 'time_cron', label: '时间与调度中心', desc: '时间戳实时转换, 多时区, Cron预测', icon: Clock },
    { id: 'network', label: '网络与接口调试', desc: 'HTTP请求客户端, 端口探活, CIDR计算', icon: Globe },
    { id: 'text_regex', label: '文本与正则差异', desc: '代码Diff对比, 正则测试, 命名转换', icon: GitCompare },
    { id: 'visual_color', label: '视觉与设计辅助', desc: '拾色器, HEX/RGB转换, 二维码生成', icon: Palette },
    { id: 'cheat_sheet', label: '常用速查手册', desc: 'HTTP状态码, Linux/Docker/Git速查', icon: BookOpen },
    { id: 'snippets', label: '代码片段管理', desc: '个人常用代码库与模版持久化', icon: Bookmark },
  ];

  const currentCategory = navCategories.find((item) => item.id === activeCategory) || navCategories[0];

  return (
    <div className="tool-workbench min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="tool-topbar h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? '展开工具侧边栏' : '收起侧边栏'}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-blue-600" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-blue-600" />
            )}
          </button>

          <div className="tool-wordmark flex items-center gap-2.5">
            <div className="tool-brand-mark w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="tool-eyebrow">PLATFORM / UTILITY DECK</div>
              <div className="flex items-center gap-2">
                <h1 className="tool-title text-sm font-bold text-slate-900 tracking-tight">Toolbox</h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono font-semibold">
                  09 DECKS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2.5">
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

      {/* Main Container */}
      <div className="tool-layout flex-1 flex w-full p-3 md:p-4 gap-3 md:gap-4 overflow-hidden">
        {/* Left Category Sidebar */}
        <aside
          className={`tool-rail border border-slate-200 bg-white rounded-xl py-3 px-2 flex flex-col justify-between transition-all duration-200 shrink-0 select-none overflow-y-auto shadow-xs ${
            sidebarCollapsed ? 'w-14 items-center' : 'w-56'
          }`}
        >
          <div className="space-y-1 w-full">
            {!sidebarCollapsed && (
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                工具分类导航
              </div>
            )}

            {navCategories.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveCategory(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer relative group ${
                    activeCategory === item.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      activeCategory === item.id ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-bold truncate text-[11px]">{item.label}</div>
                    </div>
                  )}

                  {sidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-800 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {!sidebarCollapsed && (
            <div className="pt-3 border-t border-slate-200 mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-500 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>高效辅助</span>
              </div>
              <div>集成 30+ 款日常高频研发工具。</div>
            </div>
          )}
        </aside>

        {/* Content Area (Maximized space for laptops) */}
        <main className="tool-main flex-1 min-w-0 overflow-y-auto">
          <div className="tool-deck-header">
            <div>
              <span className="tool-deck-index">DECK {String(navCategories.findIndex((item) => item.id === activeCategory) + 1).padStart(2, '0')}</span>
              <h2>{currentCategory.label}</h2>
              <p>{currentCategory.desc}</p>
            </div>
            <currentCategory.icon className="tool-deck-icon" />
          </div>
          {activeCategory === 'codec' && <CodecTools />}
          {activeCategory === 'crypto' && <CryptoTools />}
          {activeCategory === 'format_code' && <FormatCodeTools />}
          {activeCategory === 'time_cron' && <TimeCronTools />}
          {activeCategory === 'network' && <NetworkTools />}
          {activeCategory === 'text_regex' && <TextRegexTools />}
          {activeCategory === 'visual_color' && <VisualColorTools />}
          {activeCategory === 'cheat_sheet' && <CheatSheetTools />}
          {activeCategory === 'snippets' && <SnippetManager />}
        </main>
      </div>
    </div>
  );
};
