import React, { useState, useEffect } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import type { AiProvider } from '../api';

interface ProviderModalProps {
  isOpen: boolean;
  provider: AiProvider | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<AiProvider>) => void;
}

export const ProviderModal: React.FC<ProviderModalProps> = ({
  isOpen,
  provider,
  loading,
  onClose,
  onSubmit,
}) => {
  const [form, setForm] = useState<Partial<AiProvider>>({
    name: '',
    providerKey: '',
    baseUrl: 'https://api.huifu.com',
    apiKey: '',
    description: '',
    enabled: true,
  });

  useEffect(() => {
    if (provider) {
      setForm({ ...provider });
    } else {
      setForm({
        name: '',
        providerKey: '',
        baseUrl: 'https://api.huifu.com',
        apiKey: '',
        description: '',
        enabled: true,
      });
    }
  }, [provider, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              {provider ? `编辑服务商: ${provider.name}` : '添加大模型服务商'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs bg-white">
          <div>
            <label className="block text-slate-700 font-medium mb-1">服务商名称 *</label>
            <input
              value={form.name || ''}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="例如: 汇付天下云网关"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">服务商唯一 Key *</label>
            <input
              value={form.providerKey || ''}
              onChange={(e) => setForm({ ...form, providerKey: e.target.value })}
              required
              placeholder="例如: huifu"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">API 网关 Base URL *</label>
            <input
              value={form.baseUrl || ''}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              required
              placeholder="https://api.huifu.com"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">API Key / Token</label>
            <input
              type="password"
              value={form.apiKey || ''}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 transition"
            />
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
