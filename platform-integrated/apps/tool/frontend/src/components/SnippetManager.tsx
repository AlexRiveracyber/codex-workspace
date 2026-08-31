import React, { useState, useEffect } from 'react';
import { Bookmark, Plus, Trash2, Copy, Check } from 'lucide-react';

interface Snippet {
  id: string;
  title: string;
  code: string;
}

export const SnippetManager: React.FC = () => {
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    const saved = localStorage.getItem('devtools_snippets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [
      { id: '1', title: 'Spring Boot CORS 配置', code: '@Configuration\npublic class CorsConfig implements WebMvcConfigurer {\n  @Override\n  public void addCorsMappings(CorsRegistry registry) {\n    registry.addMapping("/**").allowedOrigins("*").allowedMethods("*");\n  }\n}' },
      { id: '2', title: 'Fetch with Timeout', code: 'const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {\n  const controller = new AbortController();\n  const id = setTimeout(() => controller.abort(), timeout);\n  const response = await fetch(url, { ...options, signal: controller.signal });\n  clearTimeout(id);\n  return response;\n};' },
    ];
  });

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('devtools_snippets', JSON.stringify(snippets));
  }, [snippets]);

  const handleAddSnippet = () => {
    if (!title || !code) return;
    setSnippets([...snippets, { id: crypto.randomUUID(), title, code }]);
    setTitle('');
    setCode('');
  };

  const handleDelete = (id: string) => {
    setSnippets(snippets.filter((s) => s.id !== id));
  };

  const handleCopy = (codeStr: string, id: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150 max-w-4xl">
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <span className="text-xs font-bold text-slate-800">新建代码片段</span>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="片段标题 (如: Dockerfile 生产多阶段构建)..."
          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
        />
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={5}
          placeholder="粘贴代码内容..."
          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
        />
        <button
          onClick={handleAddSnippet}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>保存到本地代码库</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {snippets.map((s) => (
          <div key={s.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 flex flex-col justify-between shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 truncate" title={s.title}>
                  {s.title}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(s.code, s.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="复制"
                  >
                    {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <pre className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-800 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {s.code}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
