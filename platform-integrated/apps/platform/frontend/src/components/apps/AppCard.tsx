import React from 'react';
import {
  Play,
  Square,
  RotateCw,
  ScrollText,
  Activity,
  Settings2,
  Trash2,
  ExternalLink,
  Globe,
  Database,
  Layers,
  Server,
  Code2,
  Terminal,
  Cpu,
  Sparkles,
  Wrench,
} from 'lucide-react';
import type { ManagedApp } from '../../types';

interface AppCardProps {
  app: ManagedApp;
  loading?: boolean;
  onStart: (id: number) => void;
  onStop: (id: number) => void;
  onRestart: (id: number) => void;
  onViewLogs: (app: ManagedApp) => void;
  onViewStats: (app: ManagedApp) => void;
  onEdit: (app: ManagedApp) => void;
  onDelete: (app: ManagedApp) => void;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  loading = false,
  onStart,
  onStop,
  onRestart,
  onViewLogs,
  onViewStats,
  onEdit,
  onDelete,
}) => {
  const getIcon = () => {
    const iconName = app.icon || app.category;
    switch (iconName) {
      case 'Globe':
      case 'WEB':
        return Globe;
      case 'Database':
      case 'DATABASE':
        return Database;
      case 'Layers':
      case 'QUEUE':
        return Layers;
      case 'Server':
      case 'TOOL':
        return Server;
      case 'Terminal':
        return Terminal;
      case 'Cpu':
        return Cpu;
      case 'Sparkles':
        return Sparkles;
      case 'Wrench':
        return Wrench;
      case 'Code2':
      case 'APPLICATION':
      default:
        return Code2;
    }
  };

  const IconComponent = getIcon();

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'WEB':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'DATABASE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'QUEUE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'APPLICATION':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TOOL':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const isRunning = app.status === 'RUNNING';

  return (
    <div className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-xl p-4.5 flex flex-col justify-between group transition-all">
      <div>
        {/* Top: Icon + Name + Category + Status */}
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center text-blue-600 shrink-0">
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm tracking-tight truncate" title={app.name}>
                  {app.name}
                </h3>
                <span
                  className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border shrink-0 ${getCategoryBadgeClass(
                    app.category
                  )}`}
                >
                  {app.category}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono truncate">{app.containerName || app.appKey}</p>
            </div>
          </div>

          {/* Status badge */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
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
            <span>{app.status}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed min-h-[32px]">
          {app.description || '暂无应用详细描述'}
        </p>

        {/* App Meta Row */}
        <div className="grid grid-cols-2 gap-2 text-xs py-2 px-2.5 rounded-lg bg-slate-50 border border-slate-200 mb-3">
          <div className="min-w-0">
            <span className="text-slate-500 text-[10px] block">镜像/类型</span>
            <span className="text-slate-700 font-mono truncate block text-[11px]" title={app.dockerImage}>
              {app.dockerImage || app.appType}
            </span>
          </div>
          <div className="min-w-0">
            <span className="text-slate-500 text-[10px] block">端口映射</span>
            {app.hostPort && isRunning ? (
              <a
                href={`http://localhost:${app.hostPort}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:text-blue-700 font-mono flex items-center gap-1 text-[11px] font-semibold underline underline-offset-2 truncate"
              >
                <span>:{app.hostPort}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            ) : app.hostPort ? (
              <span className="text-slate-600 font-mono text-[11px]">:{app.hostPort}</span>
            ) : (
              <span className="text-slate-400 text-[11px]">-</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
        {/* Lifecycle */}
        <div className="flex items-center gap-1">
          {!isRunning ? (
            <button
              onClick={() => onStart(app.id)}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>启动</span>
            </button>
          ) : (
            <button
              onClick={() => onStop(app.id)}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>停止</span>
            </button>
          )}

          <button
            onClick={() => onRestart(app.id)}
            disabled={loading}
            title="重启应用"
            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onViewLogs(app)}
            title="查看终端日志"
            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
          >
            <ScrollText className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onViewStats(app)}
            title="实时资源监控"
            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onEdit(app)}
            title="编辑配置"
            className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(app)}
            title="删除应用"
            className="p-1 rounded-md bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
