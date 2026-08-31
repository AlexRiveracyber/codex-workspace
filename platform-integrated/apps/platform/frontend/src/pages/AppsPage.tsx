import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  Play,
  Square,
  RotateCw,
  ScrollText,
  Activity,
  Settings2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { AppCard } from '../components/apps/AppCard';
import { appsApi } from '../api';
import type { ManagedApp } from '../types';

interface AppsPageProps {
  revision?: number;
  onOpenCreateModal: () => void;
  onOpenDeployModal: () => void;
  onViewLogs: (app: ManagedApp) => void;
  onViewStats: (app: ManagedApp) => void;
  onEdit: (app: ManagedApp) => void;
  onDelete: (app: ManagedApp) => void;
}

export const AppsPage: React.FC<AppsPageProps> = ({
  revision = 0,
  onOpenCreateModal,
  onOpenDeployModal,
  onViewLogs,
  onViewStats,
  onEdit,
  onDelete,
}) => {
  const [apps, setApps] = useState<ManagedApp[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const categories = [
    { key: 'ALL', label: '全部' },
    { key: 'APPLICATION', label: '业务应用' },
    { key: 'WEB', label: '网站 / 网关' },
    { key: 'DATABASE', label: '数据库' },
    { key: 'QUEUE', label: '消息队列' },
    { key: 'TOOL', label: '工具组件' },
  ];

  const fetchApps = async () => {
    try {
      const data = await appsApi.getAll();
      setApps(data);
    } catch (e) {
      console.error('Failed to fetch apps', e);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [revision]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      if (selectedCategory !== 'ALL' && app.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'ALL' && app.status !== selectedStatus) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = app.name?.toLowerCase().includes(q);
        const matchImage = app.dockerImage?.toLowerCase().includes(q);
        const matchPort = String(app.hostPort || '').includes(q);
        const matchContainer = app.containerName?.toLowerCase().includes(q);
        return matchName || matchImage || matchPort || matchContainer;
      }
      return true;
    });
  }, [apps, selectedCategory, selectedStatus, searchQuery]);

  const handleStart = async (id: number) => {
    setActionLoadingId(id);
    try {
      await appsApi.start(id);
      await fetchApps();
    } catch (e: any) {
      alert('启动失败: ' + e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStop = async (id: number) => {
    setActionLoadingId(id);
    try {
      await appsApi.stop(id);
      await fetchApps();
    } catch (e: any) {
      alert('停止失败: ' + e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestart = async (id: number) => {
    setActionLoadingId(id);
    try {
      await appsApi.restart(id);
      await fetchApps();
    } catch (e: any) {
      alert('重启失败: ' + e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    return timeStr.replace('T', ' ').substring(0, 19);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">应用管理 (Applications)</h1>
          <p className="text-xs text-slate-500 mt-0.5">纳管本地 Docker 容器及平台微应用，实时监控与操作生命周期</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建应用</span>
          </button>

          <button
            onClick={onOpenDeployModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>模板部署</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                selectedCategory === cat.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right Search & Controls */}
        <div className="flex items-center gap-2.5">
          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">全部状态</option>
            <option value="RUNNING">🟢 运行中</option>
            <option value="STOPPED">⚪ 已停止</option>
            <option value="ERROR">🔴 异常</option>
          </select>

          {/* Search Box */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索名称/镜像/端口..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
            />
          </div>

          {/* Grid / List Switcher */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="网格视图"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="表格列表视图"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' && filteredApps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => (
            <AppCard
              key={app.id}
              app={app}
              loading={actionLoadingId === app.id}
              onStart={handleStart}
              onStop={handleStop}
              onRestart={handleRestart}
              onViewLogs={onViewLogs}
              onViewStats={onViewStats}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {/* Table Mode */}
      {viewMode === 'table' && filteredApps.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">应用名称</th>
                <th className="py-3 px-4">分类</th>
                <th className="py-3 px-4">镜像 / 容器名</th>
                <th className="py-3 px-4">端口映射</th>
                <th className="py-3 px-4">状态</th>
                <th className="py-3 px-4">创建时间</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredApps.map((app) => {
                const isRunning = app.status === 'RUNNING';
                return (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{app.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{app.appKey}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {app.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      <div className="truncate max-w-xs" title={app.dockerImage}>
                        {app.dockerImage || '-'}
                      </div>
                      <div className="text-[10px] text-slate-400">{app.containerName}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {app.hostPort && isRunning ? (
                        <a
                          href={`http://localhost:${app.hostPort}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2 flex items-center gap-1"
                        >
                          <span>:{app.hostPort}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : app.hostPort ? (
                        <span className="text-slate-600">:{app.hostPort}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          isRunning
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : app.status === 'ERROR'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isRunning
                              ? 'bg-emerald-500 status-dot-running'
                              : app.status === 'ERROR'
                              ? 'bg-rose-500 status-dot-error'
                              : 'bg-slate-400 status-dot-stopped'
                          }`}
                        />
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {formatTime(app.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!isRunning ? (
                          <button
                            onClick={() => handleStart(app.id)}
                            disabled={actionLoadingId === app.id}
                            className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                            title="启动"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStop(app.id)}
                            disabled={actionLoadingId === app.id}
                            className="p-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                            title="停止"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRestart(app.id)}
                          disabled={actionLoadingId === app.id}
                          className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                          title="重启"
                        >
                          <RotateCw
                            className={`w-3.5 h-3.5 ${actionLoadingId === app.id ? 'animate-spin' : ''}`}
                          />
                        </button>
                        <button
                          onClick={() => onViewLogs(app)}
                          className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                          title="日志"
                        >
                          <ScrollText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onViewStats(app)}
                          className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                          title="监控"
                        >
                          <Activity className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEdit(app)}
                          className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                          title="编辑"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(app)}
                          className="p-1 rounded bg-slate-100 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                          title="删除"
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
      )}

      {/* Empty Search Result */}
      {filteredApps.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xs">未找到符合条件的应用</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">尝试调整搜索关键词或重置筛选条件</p>
          </div>
        </div>
      )}
    </div>
  );
};
