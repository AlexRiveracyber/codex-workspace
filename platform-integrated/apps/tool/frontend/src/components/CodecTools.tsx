import React, { useState } from 'react';
import { Binary, Link as LinkIcon, Hash, KeyRound, Sparkles, SlidersHorizontal, Check, Copy } from 'lucide-react';

export const CodecTools: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'base64' | 'url' | 'hex' | 'unicode' | 'jwt'>('base64');

  // Base64 state
  const [base64Input, setBase64Input] = useState('');
  const [base64Output, setBase64Output] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // URL state
  const [urlInput, setUrlInput] = useState('');
  const [urlOutput, setUrlOutput] = useState('');
  const [queryParams, setQueryParams] = useState<{ key: string; value: string }[]>([]);

  // Hex / Radix state
  const [radixInput, setRadixInput] = useState('');
  const [radixType, setRadixType] = useState<'dec' | 'hex' | 'bin' | 'oct'>('dec');
  const [decVal, setDecVal] = useState('');
  const [hexVal, setHexVal] = useState('');
  const [binVal, setBinVal] = useState('');
  const [octVal, setOctVal] = useState('');

  // Unicode state
  const [unicodeInput, setUnicodeInput] = useState('');
  const [unicodeOutput, setUnicodeOutput] = useState('');

  // JWT state
  const [jwtInput, setJwtInput] = useState('');
  const [jwtHeader, setJwtHeader] = useState('');
  const [jwtPayload, setJwtPayload] = useState('');
  const [jwtSignature, setJwtSignature] = useState('');

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Base64 functions
  const encodeBase64 = () => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(base64Input)));
      setBase64Output(encoded);
    } catch (e: any) {
      setBase64Output('Base64 编码失败: ' + e.message);
    }
  };

  const decodeBase64 = () => {
    try {
      const decoded = decodeURIComponent(escape(atob(base64Input.trim())));
      setBase64Output(decoded);
    } catch (e: any) {
      setBase64Output('Base64 解码失败: 无效的 Base64 字符串');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBase64Output(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // URL functions
  const encodeUrl = () => {
    try {
      setUrlOutput(encodeURIComponent(urlInput));
    } catch (e: any) {
      setUrlOutput('URL 编码失败: ' + e.message);
    }
  };

  const decodeUrl = () => {
    try {
      setUrlOutput(decodeURIComponent(urlInput));
    } catch (e: any) {
      setUrlOutput('URL 解码失败: ' + e.message);
    }
  };

  const parseUrlParams = () => {
    try {
      const url = new URL(urlInput.startsWith('http') ? urlInput : `http://localhost/?${urlInput}`);
      const params: { key: string; value: string }[] = [];
      url.searchParams.forEach((value, key) => {
        params.push({ key, value });
      });
      setQueryParams(params);
      setUrlOutput(JSON.stringify(Object.fromEntries(url.searchParams.entries()), null, 2));
    } catch (e: any) {
      setUrlOutput('URL 解析失败: ' + e.message);
    }
  };

  // Radix conversion
  const handleRadixConvert = (val: string, type: 'dec' | 'hex' | 'bin' | 'oct') => {
    setRadixInput(val);
    setRadixType(type);
    if (!val) {
      setDecVal('');
      setHexVal('');
      setBinVal('');
      setOctVal('');
      return;
    }
    let num = 0;
    try {
      if (type === 'dec') num = parseInt(val, 10);
      else if (type === 'hex') num = parseInt(val, 16);
      else if (type === 'bin') num = parseInt(val, 2);
      else if (type === 'oct') num = parseInt(val, 8);

      if (isNaN(num)) throw new Error('Invalid Number');
      setDecVal(num.toString(10));
      setHexVal(num.toString(16).toUpperCase());
      setBinVal(num.toString(2));
      setOctVal(num.toString(8));
    } catch (e) {
      // ignore
    }
  };

  // Unicode functions
  const textToUnicode = () => {
    let res = '';
    for (let i = 0; i < unicodeInput.length; i++) {
      const code = unicodeInput.charCodeAt(i);
      res += '\\u' + ('0000' + code.toString(16)).slice(-4);
    }
    setUnicodeOutput(res);
  };

  const unicodeToText = () => {
    try {
      const res = unicodeInput.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
      setUnicodeOutput(res);
    } catch (e: any) {
      setUnicodeOutput('Unicode 解码失败: ' + e.message);
    }
  };

  // JWT decode
  const decodeJwt = () => {
    try {
      const parts = jwtInput.trim().split('.');
      if (parts.length < 2) throw new Error('不是标准的 JWT 结构 (Header.Payload.Signature)');
      const headerStr = decodeURIComponent(escape(atob(parts[0])));
      const payloadStr = decodeURIComponent(escape(atob(parts[1])));
      setJwtHeader(JSON.stringify(JSON.parse(headerStr), null, 2));
      setJwtPayload(JSON.stringify(JSON.parse(payloadStr), null, 2));
      setJwtSignature(parts[2] || '');
    } catch (e: any) {
      setJwtHeader('JWT 解析失败: ' + e.message);
      setJwtPayload('');
      setJwtSignature('');
    }
  };

  const tabs = [
    { id: 'base64', label: 'Base64 编解码', icon: Binary },
    { id: 'url', label: 'URL 编解码与参数', icon: LinkIcon },
    { id: 'hex', label: '进制数制转换', icon: Hash },
    { id: 'unicode', label: 'Unicode / 转义', icon: Sparkles },
    { id: 'jwt', label: 'JWT Token 解码', icon: KeyRound },
  ] as const;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Sub tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit overflow-x-auto shadow-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Base64 */}
      {activeSubTab === 'base64' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">输入内容 (原始文本 / 拖拽图片)</span>
              <div className="flex items-center gap-2">
                <label className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer border border-slate-200 transition font-medium">
                  <span>上传文件/图片</span>
                  <input type="file" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  onClick={() => setBase64Input('')}
                  className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  清空
                </button>
              </div>
            </div>
            <textarea
              value={base64Input}
              onChange={(e) => setBase64Input(e.target.value)}
              rows={10}
              placeholder="输入明文或粘贴 Base64 进行处理..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={encodeBase64}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Base64 编码 (Encode)
              </button>
              <button
                onClick={decodeBase64}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
              >
                Base64 解码 (Decode)
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 flex flex-col justify-between shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">转换结果 (Output)</span>
                <button
                  onClick={() => copyText(base64Output, 'base64')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer transition flex items-center gap-1 font-semibold"
                >
                  {copied === 'base64' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied === 'base64' ? '已复制' : '复制结果'}</span>
                </button>
              </div>
              <textarea
                value={base64Output}
                readOnly
                rows={10}
                placeholder="编码或解码结果将在此处显示..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. URL */}
      {activeSubTab === 'url' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">输入 URL 或待转义文本</span>
                <button onClick={() => setUrlInput('')} className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer">
                  清空
                </button>
              </div>
              <textarea
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                rows={8}
                placeholder="https://api.example.com/search?keyword=工具箱&page=1"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={encodeUrl}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  URL 编码
                </button>
                <button
                  onClick={decodeUrl}
                  className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                >
                  URL 解码
                </button>
                <button
                  onClick={parseUrlParams}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  解析 Query 参数
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">URL 编解码结果</span>
                <button
                  onClick={() => copyText(urlOutput, 'url')}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer transition flex items-center gap-1 font-semibold"
                >
                  {copied === 'url' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied === 'url' ? '已复制' : '复制结果'}</span>
                </button>
              </div>
              <textarea
                value={urlOutput}
                readOnly
                rows={8}
                placeholder="URL 处理结果..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none resize-none"
              />
            </div>
          </div>

          {queryParams.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                Query 参数结构化拆解 ({queryParams.length} 项)
              </span>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-2.5">Key (参数名)</th>
                      <th className="p-2.5">Value (参数值)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {queryParams.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-2.5 text-blue-700 font-semibold">{p.key}</td>
                        <td className="p-2.5 text-slate-700 break-all">{p.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Radix */}
      {activeSubTab === 'hex' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 max-w-2xl shadow-xs">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-700 font-semibold">输入数字:</span>
            <input
              value={radixInput}
              onChange={(e) => handleRadixConvert(e.target.value, radixType)}
              placeholder="输入数值..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
            <select
              value={radixType}
              onChange={(e) => handleRadixConvert(radixInput, e.target.value as any)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="dec">十进制 (Dec)</option>
              <option value="hex">十六进制 (Hex)</option>
              <option value="bin">二进制 (Bin)</option>
              <option value="oct">八进制 (Oct)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] font-sans font-medium">十进制 (Decimal 10)</span>
              <div className="text-slate-900 font-bold text-sm">{decVal || '-'}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] font-sans font-medium">十六进制 (Hexadecimal 16)</span>
              <div className="text-blue-700 font-bold text-sm">{hexVal || '-'}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] font-sans font-medium">二进制 (Binary 2)</span>
              <div className="text-emerald-700 font-bold text-sm">{binVal || '-'}</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-slate-500 text-[10px] font-sans font-medium">八进制 (Octal 8)</span>
              <div className="text-amber-700 font-bold text-sm">{octVal || '-'}</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Unicode */}
      {activeSubTab === 'unicode' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <span className="text-xs font-bold text-slate-700">中文 / 文本内容</span>
            <textarea
              value={unicodeInput}
              onChange={(e) => setUnicodeInput(e.target.value)}
              rows={8}
              placeholder="输入文本或 Unicode 转义字符..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition"
            />
            <div className="flex items-center gap-2">
              <button
                onClick={textToUnicode}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                文本转 Unicode (\uXXXX)
              </button>
              <button
                onClick={unicodeToText}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
              >
                Unicode 转 中文
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <span className="text-xs font-bold text-slate-700">转换结果</span>
            <textarea
              value={unicodeOutput}
              readOnly
              rows={8}
              placeholder="结果..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none resize-none"
            />
          </div>
        </div>
      )}

      {/* 5. JWT */}
      {activeSubTab === 'jwt' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <span className="text-xs font-bold text-slate-700">输入 JWT Token 字符串</span>
            <textarea
              value={jwtInput}
              onChange={(e) => setJwtInput(e.target.value)}
              rows={3}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
            />
            <button
              onClick={decodeJwt}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              解析 JWT 载荷
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-blue-700">Header (头部)</span>
              <pre className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 overflow-x-auto min-h-[120px]">
                {jwtHeader || '// Header'}
              </pre>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs">
              <span className="text-xs font-bold text-emerald-700">Payload (数据载荷)</span>
              <pre className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 overflow-x-auto min-h-[120px]">
                {jwtPayload || '// Payload'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
