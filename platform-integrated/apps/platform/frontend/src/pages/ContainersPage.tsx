import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Play,
  Square,
  RotateCw,
  Trash2,
  ArrowDownToLine,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { dockerApi } from '../api';
import type { DockerContainer } from '../types';

interface ContainersPageProps {
  revision?: number;
  onImport: (container: DockerContainer) => void;
}

export const ContainersPage: React.FC<ContainersPageProps> = ({ revision = 0, onImport }) => {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const data = await dockerApi.getContainers(true);
      setContainers(data);
    } catch (e) {
      console.error('Failed to fetch containers', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, [revision]);

  const filteredContainers = containers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.image.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const handleStart = async (id: string) => {
    setActionId(id);
    try {
      await dockerApi.startContainer(id);
      await fetchContainers();
    } catch (e: any) {
      alert('启动失败: ' + e.message);
    } finally {
      setActionId(null);
    }
  };

  const handleStop = async (id: string) => {
    setActionId(id);
    try {
      await dockerApi.stopContainer(id);
      await fetchContainers();
    } catch (e: any) {
      alert('停止失败: ' + e.message);
    } finally {
      setActionId(null);
    }
  };

  const handleRestart = async (id: string) => {
    setActionId(id);
    try {
      await dockerApi.restartContainer(id);
      await fetchContainers();
    } catch (e: any) {
      alert('重启失败: ' + e.message);
    } finally {
      setActionId(null);
    }
  };

  const handleRemove = async (id: string, name: string) => {
    if (!confirm(`确认销毁并移除 Docker 容器【${name}】？`)) return;
    setActionId(id);
    try {
      await dockerApi.removeContainer(id, true);
      await fetchContainers();
    } catch (e: any) {
      alert('删除失败: ' + e.message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Docker 容器环境</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            实时感知宿主机全部容器生命周期状态，支持快速一键纳管到平台
          </p>
        </div>

        <button
          onClick={fetchContainers}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新容器</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索容器名称/镜像/ID..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
          />
        </div>

        <div className="text-xs text-slate-500 font-mono">
          共发现 <span className="text-blue-600 font-bold">{filteredContainers.length}</span> 个本地容器
        </div>
      </div>

      {/* Containers Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
            <tr>
              <th className="py-3 px-4">容器名称 / ID</th>
              <th className="py-3 px-4">镜像 (Image)</th>
              <th className="py-3 px-4">端口信息</th>
              <th className="py-3 px-4">状态 (State)</th>
              <th className="py-3 px-4">纳管状态</th>
              <th className="py-3 px-4 text-right">生命周期与操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredContainers.map((c) => {
              const isRunning = c.state === 'running';
              return (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 font-sans">{c.name.replace(/^\//, '')}</div>
                    <div className="text-[10px] text-slate-400">{c.id.substring(0, 12)}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div className="truncate max-w-xs" title={c.image}>
                      {c.image}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {c.ports || '-'}
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isRunning
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isRunning ? 'bg-emerald-500 status-dot-running' : 'bg-slate-400 status-dot-stopped'
                        }`}
                      />
                      {c.state}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    {c.isManaged ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>已纳管</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onImport(c)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[10px] font-semibold transition cursor-pointer"
                      >
                        <ArrowDownToLine className="w-3 h-3" />
                        <span>一键纳管</span>
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-1">
                      {!isRunning ? (
                        <button
                          onClick={() => handleStart(c.id)}
                          disabled={actionId === c.id}
                          className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                          title="启动容器"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStop(c.id)}
                          disabled={actionId === c.id}
                          className="p-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                          title="停止容器"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRestart(c.id)}
                        disabled={actionId === c.id}
                        className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                        title="重启容器"
                      >
                        <RotateCw
                          className={`w-3.5 h-3.5 ${actionId === c.id ? 'animate-spin' : ''}`}
                        />
                      </button>
                      <button
                        onClick={() => handleRemove(c.id, c.name)}
                        disabled={actionId === c.id}
                        className="p-1 rounded bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                        title="销毁容器"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
