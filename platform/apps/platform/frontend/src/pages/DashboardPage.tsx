import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Play,
  Square,
  Container,
  RefreshCw,
  ArrowRight,
  CheckSquare,
  ScrollText,
  CheckCircle2,
  Boxes,
  Sparkles,
  Wrench,
  AlertTriangle,
} from 'lucide-react';
import { AppCard } from '../components/apps/AppCard';
import { dashboardApi, appsApi } from '../api';
import type { DashboardSummary, ManagedApp } from '../types';

interface DashboardPageProps {
  revision?: number;
  onViewLogs: (app: ManagedApp) => void;
  onViewStats: (app: ManagedApp) => void;
  onEdit: (app: ManagedApp) => void;
  onDelete: (app: ManagedApp) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  revision = 0,
  onViewLogs,
  onViewStats,
  onEdit,
  onDelete,
}) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [apps, setApps] = useState<ManagedApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [summaryData, appsData] = await Promise.all([
        dashboardApi.getSummary().catch(() => null),
        appsApi.getAll().catch(() => null),
      ]);
      if (summaryData) setSummary(summaryData);
      if (appsData) setApps(appsData);
      setLoadError(!summaryData && !appsData);
      if (summaryData || appsData) setLastRefreshedAt(new Date());
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, [revision]);

  const handleStart = async (id: number) => {
    setActionLoadingId(id);
    try {
      await appsApi.start(id);
      await refreshData();
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
      await refreshData();
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
      await refreshData();
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
    <div className="space-y-6 animate-in fade-in duration-200">
      <section className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-slate-200/70 p-5 text-slate-800 shadow-lg shadow-slate-500/5 md:p-6">
        <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-indigo-200/35 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-24 w-64 bg-emerald-100/40 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-full border border-slate-300 bg-white/60 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-600">System overview</span>
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                <span className={`h-1.5 w-1.5 rounded-full ${summary?.dockerConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {summary?.dockerConnected ? '基础设施在线' : '等待本地引擎'}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-[-0.035em] md:text-[28px]">你的本地服务，一屏掌控</h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-600">统一管理应用、容器和工作室服务。关键状态与最近操作集中呈现，常用动作无需跳转即可完成。</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden rounded-xl border border-slate-300 bg-white/50 px-3 py-2 text-right sm:block">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Last sync</p>
              <p className="mt-1 font-mono text-[10px] text-slate-600">{lastRefreshedAt ? lastRefreshedAt.toLocaleTimeString('zh-CN', { hour12: false }) : '尚未同步'}</p>
            </div>
            <button onClick={refreshData} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-600 px-4 text-xs font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-slate-700 disabled:opacity-60">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? '同步中' : '同步状态'}</span>
            </button>
          </div>
        </div>
      </section>

      {loadError && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-xs font-extrabold">平台 API 暂未连接</p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-700">界面已就绪。启动本地服务后点击“同步状态”，应用、容器和审计数据会自动恢复。</p>
          </div>
        </div>
      )}

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Apps */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">总纳管应用</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono">{summary?.totalApps || apps.length}</span>
            <span className="text-xs text-slate-500">个实例</span>
          </div>
          <div className="mt-1.5 text-[10px] text-blue-600 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            <span>实时监控就绪</span>
          </div>
        </div>

        {/* Running Apps */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">运行中应用</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-emerald-600 font-mono">{summary?.runningApps || 0}</span>
            <span className="text-xs text-slate-500">/ {summary?.totalApps || apps.length} 在线</span>
          </div>
          <div className="mt-1.5 text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>服务健康运行</span>
          </div>
        </div>

        {/* Stopped Apps */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">已停止应用</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
              <Square className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-700 font-mono">{summary?.stoppedApps || 0}</span>
            <span className="text-xs text-slate-500">个实例</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 flex items-center gap-1">
            <span>随时一键唤醒</span>
          </div>
        </div>

        {/* Docker Host Containers */}
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Docker 容器</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Container className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-sky-600 font-mono">{summary?.totalContainers || 0}</span>
            <span className="text-xs text-slate-500">个容器</span>
          </div>
          <div className="mt-1.5 text-[10px] text-slate-500 flex items-center gap-1">
            <span>版本: {summary?.dockerVersion || 'v29.x'}</span>
          </div>
        </div>
      </div>

      {/* Managed Applications Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">受管应用快捷管控</h2>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono font-semibold">
              {apps.length}
            </span>
          </div>
          <Link to="/apps" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <span>查看全部应用</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {apps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.slice(0, 6).map((app) => (
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
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-xs">暂无受管应用</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">从模板快速部署应用或导入现有 Docker 容器</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Grid: Sub-Apps Ecosystem + Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sub-Apps Showcase */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-xs">托管子应用 (Sub-Apps)</h3>
            </div>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Monorepo
            </span>
          </div>

          <div className="space-y-2">
            {/* Task */}
            <Link
              to="/subapps/task"
              className="block p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-emerald-500/50 hover:bg-slate-100/60 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 group-hover:text-emerald-700 transition">
                    Task Flow
                  </span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">商户进件与聚合支付中枢</p>
            </Link>

            {/* AI */}
            <Link
              to="/subapps/ai"
              className="block p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-500/50 hover:bg-slate-100/60 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 group-hover:text-indigo-700 transition">
                    Lumen AI
                  </span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">大模型与多模态创作中心</p>
            </Link>

            {/* Tool */}
            <Link
              to="/subapps/tool"
              className="block p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-500/50 hover:bg-slate-100/60 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Wrench className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700 transition">
                    Toolbox
                  </span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1">全能开发者研发工具箱</p>
            </Link>
          </div>
        </div>

        {/* Recent Operation Logs */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <ScrollText className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-xs">最新操作审计日志</h3>
            </div>
            <Link to="/logs" className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold">
              查看全部
            </Link>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {summary?.recentLogs && summary.recentLogs.length > 0 ? (
              summary.recentLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono shrink-0 ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {log.action}
                    </span>
                    <div className="truncate">
                      <span className="font-semibold text-slate-800">{log.appName}:</span>
                      <span className="text-slate-600 ml-1.5">{log.message}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                    {formatTime(log.createdAt)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center">暂无操作日志记录</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
