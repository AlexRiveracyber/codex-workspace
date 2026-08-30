import React, { useState } from 'react';
import { GitCompare, Sparkles, Type } from 'lucide-react';
import * as diff from 'diff';

export const TextRegexTools: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'diff' | 'regex' | 'case'>('diff');

  // Diff state
  const [diffOriginal, setDiffOriginal] = useState('function helloWorld() {\n  console.log("Hello, Vue 2!");\n  return 1;\n}');
  const [diffModified, setDiffModified] = useState('function helloWorld() {\n  console.log("Hello, React 18 & TypeScript!");\n  const isModern = true;\n  return isModern ? 2 : 1;\n}');
  const [diffResult, setDiffResult] = useState<diff.Change[]>([]);

  // Regex state
  const [regexPattern, setRegexPattern] = useState('\\d{3}-\\d{8}');
  const [regexFlags, setRegexFlags] = useState('g');
  const [regexText, setRegexText] = useState('客服热线: 021-88888888, 备用电话: 010-66666666, 邮箱: admin@huifu.com');
  const [regexMatches, setRegexMatches] = useState<string[]>([]);

  // Case state
  const [caseInput, setCaseInput] = useState('user_account_balance_summary');
  const [camelCase, setCamelCase] = useState('');
  const [pascalCase, setPascalCase] = useState('');
  const [snakeCase, setSnakeCase] = useState('');
  const [kebabCase, setKebabCase] = useState('');
  const [constCase, setConstCase] = useState('');

  const handleDiff = () => {
    const changes = diff.diffLines(diffOriginal, diffModified);
    setDiffResult(changes);
  };

  const handleTestRegex = () => {
    try {
      const reg = new RegExp(regexPattern, regexFlags);
      const matches = regexText.match(reg);
      setRegexMatches(matches ? Array.from(matches) : []);
    } catch (e) {
      setRegexMatches([]);
    }
  };

  const handleConvertCase = (str: string) => {
    setCaseInput(str);
    if (!str) return;
    const words = str
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[-_]/g, ' ')
      .trim()
      .split(/\s+/);

    setCamelCase(words.map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())).join(''));
    setPascalCase(words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(''));
    setSnakeCase(words.map((w) => w.toLowerCase()).join('_'));
    setKebabCase(words.map((w) => w.toLowerCase()).join('-'));
    setConstCase(words.map((w) => w.toUpperCase()).join('_'));
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Sub tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit shadow-xs">
        <button
          onClick={() => setActiveSubTab('diff')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'diff' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>文本 / 代码 Diff 对比</span>
        </button>
        <button
          onClick={() => setActiveSubTab('regex')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'regex' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>正则表达式测试器</span>
        </button>
        <button
          onClick={() => setActiveSubTab('case')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'case' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>命名规范大小写转换</span>
        </button>
      </div>

      {activeSubTab === 'diff' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-slate-700">原始内容 (Original)</span>
              <textarea
                value={diffOriginal}
                onChange={(e) => setDiffOriginal(e.target.value)}
                rows={8}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 resize-none focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-slate-700">修改后内容 (Modified)</span>
              <textarea
                value={diffModified}
                onChange={(e) => setDiffModified(e.target.value)}
                rows={8}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 resize-none focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            onClick={handleDiff}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
          >
            开始行级差异比对 (Compare Diff)
          </button>

          {diffResult.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 font-mono text-xs overflow-x-auto shadow-xs">
              <span className="text-xs font-bold text-slate-900 font-sans block mb-2">比对结果</span>
              {diffResult.map((part, index) => {
                const color = part.added
                  ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 font-medium'
                  : part.removed
                  ? 'bg-rose-50 text-rose-800 border-l-4 border-rose-500 line-through'
                  : 'text-slate-700';
                return (
                  <pre key={index} className={`p-2 rounded ${color} whitespace-pre-wrap`}>
                    {part.added ? '+ ' : part.removed ? '- ' : '  '}
                    {part.value}
                  </pre>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'regex' && (
        <div className="space-y-4 max-w-3xl">
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex gap-2">
              <input
                value={regexPattern}
                onChange={(e) => setRegexPattern(e.target.value)}
                placeholder="正则表达式 (如: \d+)"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-blue-700 font-bold focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <input
                value={regexFlags}
                onChange={(e) => setRegexFlags(e.target.value)}
                placeholder="flags (g, i, m)"
                className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <button
                onClick={handleTestRegex}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
              >
                测试匹配
              </button>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-medium mb-1">测试文本 (Target Text)</label>
              <textarea
                value={regexText}
                onChange={(e) => setRegexText(e.target.value)}
                rows={6}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">匹配结果 ({regexMatches.length} 处)</span>
              <div className="flex flex-wrap gap-2">
                {regexMatches.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-semibold"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'case' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 max-w-2xl shadow-xs">
          <div>
            <label className="block text-slate-500 text-[10px] font-medium mb-1">输入任意变量名或短语</label>
            <input
              value={caseInput}
              onChange={(e) => handleConvertCase(e.target.value)}
              placeholder="user_account_balance_summary"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] block font-sans font-medium">小驼峰 camelCase</span>
              <span className="text-blue-700 font-bold">{camelCase || '-'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] block font-sans font-medium">大驼峰 PascalCase</span>
              <span className="text-blue-700 font-bold">{pascalCase || '-'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] block font-sans font-medium">下划线 snake_case</span>
              <span className="text-emerald-700 font-bold">{snakeCase || '-'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] block font-sans font-medium">中划线 kebab-case</span>
              <span className="text-emerald-700 font-bold">{kebabCase || '-'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 col-span-2 space-y-1">
              <span className="text-slate-500 text-[10px] block font-sans font-medium">常量大写 CONSTANT_CASE</span>
              <span className="text-purple-700 font-bold">{constCase || '-'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
