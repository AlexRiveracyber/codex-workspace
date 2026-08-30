import React, { useState, useEffect } from 'react';
import { X, Save, Cpu } from 'lucide-react';
import type { AiModel } from '../api';

interface ModelModalProps {
  isOpen: boolean;
  model: AiModel | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<AiModel>) => void;
}

export const ModelModal: React.FC<ModelModalProps> = ({
  isOpen,
  model,
  loading,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<Partial<AiModel>>({
    brand: 'qwen',
    modelName: '',
    modelKey: '',
    capabilities: 'CHAT,VISION',
    modelType: 'CHAT',
    providerKey: 'huifu',
    contextLength: 128000,
    tag: '旗舰推理',
    enabled: true,
  });

  useEffect(() => {
    if (model) {
      setForm({ ...model });
    } else {
      setForm({
        brand: 'qwen',
        modelName: '',
        modelKey: '',
        capabilities: 'CHAT,VISION',
        modelType: 'CHAT',
        providerKey: 'huifu',
        contextLength: 128000,
        tag: '旗舰推理',
        enabled: true,
      });
    }
  }, [model, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modelKey || !form.modelName) {
      alert('请填写模型标识与名称');
      return;
    }
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              {model ? `编辑模型: ${model.modelName}` : '添加新 AI 模型'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs bg-white">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">模型厂商 / 品牌</label>
              <select
                value={form.brand || 'qwen'}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="qwen">通义千问 (Qwen)</option>
                <option value="deepseek">DeepSeek</option>
                <option value="happyhorse">HappyHorse (视频)</option>
                <option value="wanx">通义万相 (Wanx)</option>
                <option value="zhipu">智谱 GLM</option>
                <option value="moonshot">月之暗面 Kimi</option>
                <option value="minimax">MiniMax</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">模型类型</label>
              <select
                value={form.modelType || 'CHAT'}
                onChange={(e) => setForm({ ...form, modelType: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="CHAT">对话与推理 (CHAT)</option>
                <option value="IMAGE">图像生成 (IMAGE)</option>
                <option value="VIDEO">视频生成 (VIDEO)</option>
                <option value="EMBEDDING">向量嵌入 (EMBEDDING)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">模型显示名称 *</label>
              <input
                value={form.modelName || ''}
                onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                required
                placeholder="例如: qwen3.8-max"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">模型调用 Key *</label>
              <input
                value={form.modelKey || ''}
                onChange={(e) => setForm({ ...form, modelKey: e.target.value })}
                required
                placeholder="例如: qwen3.8-max"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-medium mb-1">上下文窗口 (Tokens)</label>
              <input
                type="number"
                value={form.contextLength || 128000}
                onChange={(e) => setForm({ ...form, contextLength: Number(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">功能特性标签</label>
              <input
                value={form.tag || ''}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                placeholder="例如: 深度推理 / 5折优惠"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

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
              <span>{loading ? '保存中...' : '确认保存'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
