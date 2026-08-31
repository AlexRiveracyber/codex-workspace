import React, { useState, useEffect } from 'react';
import { X, ArrowDownToLine } from 'lucide-react';
import type { DockerContainer } from '../../types';

interface ImportContainerModalProps {
  isOpen: boolean;
  container: DockerContainer | null;
  loading: boolean;
  onClose: () => void;
  onImport: (params: any) => void;
}

export const ImportContainerModal: React.FC<ImportContainerModalProps> = ({
  isOpen,
  container,
  loading,
  onClose,
  onImport,
}) => {
  const [appName, setAppName] = useState('');
  const [category, setCategory] = useState('APPLICATION');

  useEffect(() => {
    if (container) {
      setAppName(container.name.replace(/^\//, ''));
    }
  }, [container]);

  if (!isOpen || !container) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onImport({
      containerId: container.id,
      containerName: container.name.replace(/^\//, ''),
      image: container.image,
      state: container.state,
      appName,
      category,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">一键纳管 Docker 容器</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">将宿主机已有容器导入平台进行统一生命周期调度</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs bg-white">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 font-mono">
            <div className="text-slate-500 text-[11px] font-sans font-medium">容器原生信息:</div>
            <div className="text-slate-900 font-bold">{container.name}</div>
            <div className="text-[10px] text-slate-500 truncate">镜像: {container.image}</div>
            <div className="text-[10px] text-slate-500">ID: {container.id.substring(0, 12)}</div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              设定应用名称 <span className="text-rose-500">*</span>
            </label>
            <input
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">应用业务分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition"
            >
              <option value="APPLICATION">业务应用 (APPLICATION)</option>
              <option value="WEB">网站与网关 (WEB)</option>
              <option value="DATABASE">数据库与存储 (DATABASE)</option>
              <option value="QUEUE">消息队列 (QUEUE)</option>
              <option value="TOOL">工具与中间件 (TOOL)</option>
            </select>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer font-semibold"
            >
              取消
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>{loading ? '正在纳管...' : '确认纳管'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
