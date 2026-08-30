import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { logsApi } from '../api';
import type { AppLog } from '../types';

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await logsApi.getRecent();
      setLogs(data);
    } catch (e) {
      console.error('Failed to load logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    return timeStr.replace('T', ' ').substring(0, 19);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">操作审计与事件日志</h1>
          <p className="text-xs text-slate-500 mt-0.5">记录平台内所有应用启停、部署、销毁与调度生命周期追踪</p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新日志</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
            <tr>
              <th className="py-3 px-4">操作类型</th>
              <th className="py-3 px-4">目标应用</th>
              <th className="py-3 px-4">状态</th>
              <th className="py-3 px-4">日志说明 / 结果</th>
              <th className="py-3 px-4 text-right">记录时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4">
                  <span className="font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-slate-900">
                  {log.appName || '-'}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {log.status === 'SUCCESS' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                    )}
                    <span>{log.status}</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-700 max-w-md truncate" title={log.message}>
                  {log.message}
                </td>
                <td className="py-3 px-4 text-right text-slate-400 font-mono text-[11px]">
                  {formatTime(log.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div className="py-12 text-center text-xs text-slate-400">暂无审计日志记录</div>
        )}
      </div>
    </div>
  );
};
