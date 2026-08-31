import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { ManagedApp } from '../../types';

interface AppModalProps {
  isOpen: boolean;
  isEdit: boolean;
  app: ManagedApp | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (formData: Partial<ManagedApp>) => void;
}

export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  isEdit,
  app,
  loading,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<Partial<ManagedApp>>({
    name: '',
    appKey: '',
    category: 'APPLICATION',
    appType: 'DOCKER',
    dockerImage: '',
    containerName: '',
    hostPort: undefined,
    containerPort: undefined,
    envVars: '',
    command: '',
    description: '',
  });

  useEffect(() => {
    if (app && isEdit) {
      setForm({ ...app });
    } else {
      setForm({
        name: '',
        appKey: '',
        category: 'APPLICATION',
        appType: 'DOCKER',
        dockerImage: '',
        containerName: '',
        hostPort: undefined,
        containerPort: undefined,
        envVars: '',
        command: '',
        description: '',
      });
    }
  }, [app, isEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.appKey) {
      alert('请填写应用名称与唯一标识符 (App Key)');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {isEdit ? `编辑受管应用: ${app?.name}` : '新建受管应用'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              配置 Docker 容器运行参数或微应用管控元数据
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                应用名称 <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例如: Redis 缓存集群"
                required
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                唯一标识 (App Key) <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.appKey || ''}
                onChange={(e) => setForm({ ...form, appKey: e.target.value })}
                placeholder="例如: redis-cluster-main"
                required
                disabled={isEdit}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">应用分类</label>
              <select
                value={form.category || 'APPLICATION'}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="APPLICATION">业务应用 (APPLICATION)</option>
                <option value="WEB">网站与网关 (WEB)</option>
                <option value="DATABASE">数据库与存储 (DATABASE)</option>
                <option value="QUEUE">消息队列 (QUEUE)</option>
                <option value="TOOL">工具与中间件 (TOOL)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">部署类型</label>
              <select
                value={form.appType || 'DOCKER'}
                onChange={(e) => setForm({ ...form, appType: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="DOCKER">Docker 容器 (DOCKER)</option>
                <option value="NATIVE">本地原生进程 (NATIVE)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Docker 镜像名称</label>
              <input
                value={form.dockerImage || ''}
                onChange={(e) => setForm({ ...form, dockerImage: e.target.value })}
                placeholder="例如: redis:alpine 或 custom:latest"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">容器实例名</label>
              <input
                value={form.containerName || ''}
                onChange={(e) => setForm({ ...form, containerName: e.target.value })}
                placeholder="例如: platform-redis-service"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">宿主机映射端口</label>
              <input
                type="number"
                value={form.hostPort || ''}
                onChange={(e) => setForm({ ...form, hostPort: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="例如: 6379"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">容器内部端口</label>
              <input
                type="number"
                value={form.containerPort || ''}
                onChange={(e) => setForm({ ...form, containerPort: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="例如: 6379"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">环境变量 (一行一条 KEY=VALUE)</label>
            <textarea
              rows={2}
              value={form.envVars || ''}
              onChange={(e) => setForm({ ...form, envVars: e.target.value })}
              placeholder="ENV_VAR=value"
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 font-mono text-[11px] placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">应用详细描述</label>
            <textarea
              rows={2}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="描述该应用的功能、用途与调用方..."
              className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Modal Footer */}
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
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? '正在保存...' : '保存配置'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
