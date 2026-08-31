import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Rocket,
  Globe,
  Database,
  Layers,
  Box,
  Terminal,
  Wrench,
} from 'lucide-react';
import { templatesApi } from '../api';
import type { AppTemplate } from '../types';

interface TemplatesPageProps {
  onDeployTemplate: (template: AppTemplate) => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({ onDeployTemplate }) => {
  const [templates, setTemplates] = useState<AppTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    templatesApi.getAll().then(setTemplates).catch(console.error);
  }, []);

  const categories = [
    { key: 'ALL', label: '全部' },
    { key: 'DATABASE', label: '数据库' },
    { key: 'QUEUE', label: '消息队列' },
    { key: 'WEB', label: 'Web 服务' },
    { key: 'APPLICATION', label: '应用引擎' },
  ];

  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) {
      return false;
    }
    return true;
  });

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
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">应用模板中心 (Templates)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            预配置主流数据库、消息队列与微应用模版，一键在本地 Docker 环境快速拉起
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-slate-200 shadow-xs w-fit">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedCategory === cat.key
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((tpl) => {
          const Icon = getIcon(tpl.icon || tpl.category);
          return (
            <div
              key={tpl.id}
              className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-xl p-4.5 flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2.5 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight">{tpl.name}</h3>
                      <span className="text-[10px] font-mono text-slate-400">{tpl.templateKey}</span>
                    </div>
                  </div>

                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {tpl.category}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                  {tpl.description}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono mb-3 space-y-0.5">
                  <div className="text-[10px] text-slate-500">Docker 镜像:</div>
                  <div className="text-slate-800 text-[11px] truncate font-semibold">{tpl.dockerImage}</div>
                  {tpl.defaultHostPort && (
                    <div className="text-[10px] text-slate-600">默认端口: :{tpl.defaultHostPort}</div>
                  )}
                </div>
              </div>

              <button
                onClick={() => onDeployTemplate(tpl)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>一键部署至本地</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
