import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, Terminal, Copy, Check } from 'lucide-react';
import { appsApi } from '../../api';
import type { ManagedApp } from '../../types';

interface LogModalProps {
  isOpen: boolean;
  app: ManagedApp | null;
  onClose: () => void;
}

export const LogModal: React.FC<LogModalProps> = ({ isOpen, app, onClose }) => {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState(200);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copied, setCopied] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    if (!app) return;
    setLoading(true);
    try {
      const data = await appsApi.getLogs(app.id, lines);
      setLogs(data || '暂无容器日志输出');
    } catch (e: any) {
      setLogs(`获取日志失败: ${e.message || '容器可能未运行'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && app) {
      fetchLogs();
    }
  }, [isOpen, app, lines]);

  useEffect(() => {
    if (!isOpen || !autoRefresh || !app) return;
    const interval = setInterval(() => {
      fetchLogs();
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, app, lines]);

  if (!isOpen || !app) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col h-[80vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  实时终端日志: {app.name}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                  {app.containerName || app.appKey}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Lines Selector */}
            <select
              value={lines}
              onChange={(e) => setLines(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
            >
              <option value={100}>最近 100 行</option>
              <option value={200}>最近 200 行</option>
              <option value={500}>最近 500 行</option>
              <option value={1000}>最近 1000 行</option>
            </select>

            {/* Auto refresh toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {autoRefresh ? '🟢 自动刷新中 (3s)' : '⚪ 暂停自动刷新'}
            </button>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer"
              title="复制全部日志"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Manual Refresh */}
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer"
              title="手动刷新"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Log Screen */}
        <div className="flex-1 bg-slate-900 p-4 font-mono text-[11px] text-emerald-300 overflow-y-auto leading-relaxed select-text space-y-1">
          <pre className="whitespace-pre-wrap break-all">{logs}</pre>
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};
