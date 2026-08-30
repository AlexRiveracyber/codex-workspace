import React from 'react';
import { Server, Database, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-5 max-w-4xl animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">平台系统设置 (Settings)</h1>
        <p className="text-xs text-slate-500 mt-0.5">查看平台核心引擎配置、环境拓扑与基础设施参数</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Docker Daemon */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold border-b border-slate-100 pb-2.5">
            <Server className="w-4 h-4 text-sky-600" />
            <span>Docker 引擎连接配置</span>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">Socket 路径:</span>
              <span className="text-slate-800 font-semibold">/var/run/docker.sock</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">网络模式:</span>
              <span className="text-slate-800 font-semibold">Bridge (platform-network)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">自动探活周期:</span>
              <span className="text-emerald-700 font-semibold">10 秒 / 次</span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold border-b border-slate-100 pb-2.5">
            <Database className="w-4 h-4 text-amber-600" />
            <span>核心元数据库 (MySQL 8.4)</span>
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">数据库名:</span>
              <span className="text-slate-800 font-semibold">platform_db</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">字符编码:</span>
              <span className="text-slate-800 font-semibold">utf8mb4 (Unicode)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-sans">存储持久化:</span>
              <span className="text-emerald-700 font-semibold">Docker Named Volume</span>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Info Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2.5 text-slate-900 font-bold border-b border-slate-100 pb-2.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>平台微应用拓扑架构 (Monorepo)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">任务中心 (Task)</div>
            <div className="text-slate-500 text-[11px]">后端: 8082 · 前端: 3002</div>
            <div className="text-emerald-700 font-semibold text-[10px]">● 已就绪</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Lumen AI</div>
            <div className="text-slate-500 text-[11px]">后端: 8083 · 前端: 3003</div>
            <div className="text-indigo-700 font-semibold text-[10px]">● 已就绪</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <div className="font-bold text-slate-900">Toolbox (工具)</div>
            <div className="text-slate-500 text-[11px]">后端: 8084 · 前端: 3004</div>
            <div className="text-blue-700 font-semibold text-[10px]">● 已就绪</div>
          </div>
        </div>
      </div>
    </div>
  );
};
