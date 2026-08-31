import React, { useState } from 'react';
import { X, Sparkles, Rocket, Globe, Database, Layers, Box, Terminal, Wrench } from 'lucide-react';
import type { AppTemplate } from '../../types';

interface DeployModalProps {
  isOpen: boolean;
  templates: AppTemplate[];
  loading: boolean;
  onClose: () => void;
  onDeploy: (params: any) => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({
  isOpen,
  templates,
  loading,
  onClose,
  onDeploy,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<AppTemplate | null>(null);
  const [appName, setAppName] = useState('');
  const [containerName, setContainerName] = useState('');
  const [hostPort, setHostPort] = useState<number | undefined>(undefined);
  const [envVars, setEnvVars] = useState('');
  const [startImmediately, setStartImmediately] = useState(true);

  if (!isOpen) return null;

  const handleSelectTemplate = (tpl: AppTemplate) => {
    setSelectedTemplate(tpl);
    setAppName(`${tpl.name} 实例`);
    setContainerName(`platform-${tpl.templateKey}`);
    setHostPort(tpl.defaultHostPort);
    setEnvVars(tpl.defaultEnvVars || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate || !appName) {
      alert('请选择模板并填写应用名称');
      return;
    }
    onDeploy({
      templateKey: selectedTemplate.templateKey,
      appName,
      containerName,
      hostPort,
      envVars,
      startImmediately,
    });
  };

  const getIcon = (iconName?: string) => {
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
      case 'Terminal':
        return Terminal;
      case 'Cpu':
      case 'Sparkles':
        return Sparkles;
      case 'Wrench':
        return Wrench;
      case 'Code2':
      case 'APPLICATION':
      default:
        return Box;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">应用模板一键部署 (1-Click Deploy)</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                预设主流数据库、中间件及微应用模板，快速拉起并自动纳管
              </p>
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
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs bg-white">
          {/* Template Selection Grid */}
          <div>
            <label className="block text-slate-700 font-medium mb-2">选择预设模板</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {templates.map((tpl) => {
                const Icon = getIcon(tpl.icon || tpl.category);
                const isSelected = selectedTemplate?.id === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200/60 text-slate-700'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200 font-semibold">
                        {tpl.category}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs truncate">{tpl.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{tpl.dockerImage}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedTemplate && (
            <div className="space-y-4 pt-3 border-t border-slate-200 animate-in fade-in">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    部署实例名称 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    required
                    placeholder="例如: 生产 Redis 服务"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">容器实例名称</label>
                  <input
                    value={containerName}
                    onChange={(e) => setContainerName(e.target.value)}
                    placeholder="例如: platform-redis-service"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">宿主机映射端口</label>
                  <input
                    type="number"
                    value={hostPort || ''}
                    onChange={(e) => setHostPort(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="例如: 6379"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="startImmediately"
                    checked={startImmediately}
                    onChange={(e) => setStartImmediately(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="startImmediately" className="text-slate-700 font-medium cursor-pointer select-none">
                    创建后立即在 Docker 中启动运行
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">环境变量配置</label>
                <textarea
                  rows={2}
                  value={envVars}
                  onChange={(e) => setEnvVars(e.target.value)}
                  placeholder="KEY=VALUE"
                  className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 font-mono text-[11px] placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          )}

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
              disabled={loading || !selectedTemplate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>{loading ? '正在部署并拉起...' : '立即部署'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
