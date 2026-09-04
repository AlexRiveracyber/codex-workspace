import React from 'react';
import { ExternalLink, CheckSquare, Sparkles, Wrench, RefreshCw } from 'lucide-react';

interface SubAppConfig {
  name: string;
  subTitle: string;
  desc: string;
  url: string;
  icon: any;
  accentColor: string;
}

interface SubAppEmbedPageProps {
  appType: 'task' | 'ai' | 'tool';
}

export const SubAppEmbedPage: React.FC<SubAppEmbedPageProps> = ({ appType }) => {
  const configs: Record<string, SubAppConfig> = {
    task: {
      name: 'Task Flow',
      subTitle: 'apps/task · /task/',
      desc: '商户进件与聚合支付中枢',
      url: '/task/',
      icon: CheckSquare,
      accentColor: 'text-emerald-400',
    },
    ai: {
      name: 'Lumen AI',
      subTitle: 'apps/ai · /ai/',
      desc: '大模型与多模态创作中心',
      url: '/ai/',
      icon: Sparkles,
      accentColor: 'text-purple-400',
    },
    tool: {
      name: 'Toolbox',
      subTitle: 'apps/tool · /tool/',
      desc: '全能开发者研发工具箱',
      url: '/tool/',
      icon: Wrench,
      accentColor: 'text-indigo-400',
    },
  };

  const current = configs[appType] || configs.task;
  const Icon = current.icon;
  const [iframeKey, setIframeKey] = React.useState(0);
  const iframeUrl = `${current.url}?embedded=platform&ui=20260904.3`;

  return (
    <div className="flex flex-col h-[calc(100vh-5.5rem)] space-y-3 animate-in fade-in duration-200">
      {/* Sub-app Top Control Bar */}
      <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
            <Icon className={`w-4 h-4 ${current.accentColor}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-sm">{current.name}</h2>
              <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 font-semibold">
                {current.subTitle}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{current.desc}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition cursor-pointer"
            title="刷新内嵌视图"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <a
            href={current.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <span>在新标签中打开</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Live Embedded Iframe */}
      <div className="flex-1 w-full rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs relative">
        <iframe
          key={iframeKey}
          src={iframeUrl}
          title={current.name}
          className="w-full h-full border-0 rounded-xl"
        />
      </div>
    </div>
  );
};
