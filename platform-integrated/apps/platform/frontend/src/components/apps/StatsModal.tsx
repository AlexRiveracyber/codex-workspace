import React, { useState, useEffect } from 'react';
import { X, Activity, RefreshCw, Cpu, HardDrive, Network, Layers } from 'lucide-react';
import { appsApi } from '../../api';
import type { ManagedApp, AppStats } from '../../types';

interface StatsModalProps {
  isOpen: boolean;
  app: ManagedApp | null;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, app, onClose }) => {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    if (!app) return;
    setLoading(true);
    try {
      const data = await appsApi.getStats(app.id);
      setStats(data);
    } catch (e) {
      console.error('Failed to fetch stats', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && app) {
      fetchStats();
      const interval = setInterval(fetchStats, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, app]);

  if (!isOpen || !app) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                实时性能监控: {app.name}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {app.containerName || app.appKey}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer"
              title="刷新"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 bg-white">
          <div className="grid grid-cols-2 gap-4">
            {/* CPU Usage */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>CPU 占用率</span>
                </span>
                <span className="font-mono text-blue-600 font-bold text-sm">
                  {stats?.cpuPercent || '0.00%'}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(parseFloat(stats?.cpuPercent || '0'), 100)}%` }}
                />
              </div>
            </div>

            {/* Memory Usage */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                  <span>内存使用 (RAM)</span>
                </span>
                <span className="font-mono text-emerald-600 font-bold text-sm">
                  {stats?.memoryPercent || '0.00%'}
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(parseFloat(stats?.memoryPercent || '0'), 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 font-mono text-right">
                {stats?.memoryUsage || '0 MB'} / {stats?.memoryLimit || '0 MB'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            {/* Network IO */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-sans font-medium">
                <Network className="w-3.5 h-3.5 text-sky-600" />
                <span>网络 I/O (入 / 出)</span>
              </div>
              <div className="text-slate-900 font-bold text-sm">
                {stats?.netIO || '0B / 0B'}
              </div>
            </div>

            {/* Block IO / Threads */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-sans font-medium">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>磁盘 I/O / 活跃线程</span>
              </div>
              <div className="text-slate-900 font-bold text-sm">
                {stats?.blockIO || '0B / 0B'} {stats?.pids ? `(${stats.pids} PIDs)` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
