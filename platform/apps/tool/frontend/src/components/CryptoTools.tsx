import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, Dices, Copy, Check } from 'lucide-react';
import axios from 'axios';

export const CryptoTools: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'hash' | 'aes' | 'uuid'>('hash');

  // Hash state
  const [hashInput, setHashInput] = useState('');
  const [hashType, setHashType] = useState('MD5');
  const [hashResult, setHashResult] = useState('');

  // AES state
  const [aesInput, setAesInput] = useState('');
  const [aesKey, setAesKey] = useState('1234567890123456');
  const [aesIv, setAesIv] = useState('1234567890123456');
  const [aesResult, setAesResult] = useState('');

  // UUID / Random state
  const [uuidCount, setUuidCount] = useState(5);
  const [uuidList, setUuidList] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleHash = async () => {
    try {
      const res = await axios.post('/api/crypto/hash', { text: hashInput, algorithm: hashType });
      setHashResult(res.data.data?.hash || res.data.hash || JSON.stringify(res.data));
    } catch (e: any) {
      setHashResult('哈希计算失败: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleAesEncrypt = async () => {
    try {
      const res = await axios.post('/api/crypto/aes/encrypt', { text: aesInput, key: aesKey, iv: aesIv });
      setAesResult(res.data.data?.cipher || res.data.cipher || JSON.stringify(res.data));
    } catch (e: any) {
      setAesResult('AES 加密失败: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleAesDecrypt = async () => {
    try {
      const res = await axios.post('/api/crypto/aes/decrypt', { cipher: aesInput, key: aesKey, iv: aesIv });
      setAesResult(res.data.data?.plain || res.data.plain || JSON.stringify(res.data));
    } catch (e: any) {
      setAesResult('AES 解密失败: ' + (e.response?.data?.message || e.message));
    }
  };

  const generateUuids = () => {
    const list: string[] = [];
    for (let i = 0; i < uuidCount; i++) {
      list.push(crypto.randomUUID());
    }
    setUuidList(list);
  };

  const tabs = [
    { id: 'hash', label: '哈希散列 (MD5/SHA/SM3)', icon: ShieldCheck },
    { id: 'aes', label: '对称加密 (AES/SM4)', icon: Lock },
    { id: 'uuid', label: 'UUID / 随机数生成', icon: Dices },
  ] as const;

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
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

      {activeSubTab === 'hash' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">待哈希明文</span>
              <select
                value={hashType}
                onChange={(e) => setHashType(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="MD5">MD5 (32位)</option>
                <option value="SHA1">SHA-1</option>
                <option value="SHA256">SHA-256 (推荐)</option>
                <option value="SHA512">SHA-512</option>
                <option value="SM3">SM3 (国密)</option>
              </select>
            </div>
            <textarea
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              rows={8}
              placeholder="输入明文文本..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition"
            />
            <button
              onClick={handleHash}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              计算哈希摘要 (Hash)
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">哈希计算结果</span>
              <button
                onClick={() => copyText(hashResult, 'hash')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer transition flex items-center gap-1 font-semibold"
              >
                {copied === 'hash' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied === 'hash' ? '已复制' : '复制结果'}</span>
              </button>
            </div>
            <textarea
              value={hashResult}
              readOnly
              rows={8}
              placeholder="哈希摘要结果..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none resize-none"
            />
          </div>
        </div>
      )}

      {activeSubTab === 'aes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <span className="text-xs font-bold text-slate-700">待加密明文 / 待解密密文</span>
            <textarea
              value={aesInput}
              onChange={(e) => setAesInput(e.target.value)}
              rows={6}
              placeholder="输入内容..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition"
            />

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-slate-500 text-[10px] font-medium mb-1">密钥 (Key, 16/24/32位)</label>
                <input
                  value={aesKey}
                  onChange={(e) => setAesKey(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-medium mb-1">偏移量 (IV, 16位)</label>
                <input
                  value={aesIv}
                  onChange={(e) => setAesIv(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAesEncrypt}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                AES-CBC 加密
              </button>
              <button
                onClick={handleAesDecrypt}
                className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
              >
                AES-CBC 解密
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <span className="text-xs font-bold text-slate-700">加解密运算输出</span>
            <textarea
              value={aesResult}
              readOnly
              rows={9}
              placeholder="结果..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none resize-none"
            />
          </div>
        </div>
      )}

      {activeSubTab === 'uuid' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 max-w-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">批量生成 UUID v4 (随机唯一标识)</span>
            <div className="flex items-center gap-2">
              <select
                value={uuidCount}
                onChange={(e) => setUuidCount(Number(e.target.value))}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:border-blue-500"
              >
                <option value={1}>生成 1 个</option>
                <option value={5}>生成 5 个</option>
                <option value={10}>生成 10 个</option>
                <option value={20}>生成 20 个</option>
              </select>
              <button
                onClick={generateUuids}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                立即生成
              </button>
            </div>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {uuidList.map((id, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 hover:border-slate-300"
              >
                <span>{id}</span>
                <button
                  onClick={() => copyText(id, `uuid-${idx}`)}
                  className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  {copied === `uuid-${idx}` ? '已复制' : '复制'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
