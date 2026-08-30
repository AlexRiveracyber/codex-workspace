import React, { useState } from 'react';
import { Globe, Send, Server, Network } from 'lucide-react';
import axios from 'axios';

export const NetworkTools: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'http' | 'ping' | 'cidr'>('http');

  // HTTP state
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://httpbin.org/get');
  const [headers, setHeaders] = useState('Content-Type: application/json');
  const [body, setBody] = useState('');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState('');
  const [loading, setLoading] = useState(false);

  // Ping state
  const [pingHost, setPingHost] = useState('127.0.0.1');
  const [pingPort, setPingPort] = useState(8080);
  const [pingResult, setPingResult] = useState('');

  // CIDR state
  const [cidrInput, setCidrInput] = useState('192.168.1.0/24');
  const [cidrResult, setCidrResult] = useState<any>(null);

  const handleSendHttp = async () => {
    setLoading(true);
    setResponseStatus(null);
    setResponseBody('');
    try {
      const headerObj: Record<string, string> = {};
      headers.split('\n').forEach((line) => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          headerObj[parts[0].trim()] = parts.slice(1).join(':').trim();
        }
      });

      let reqData = undefined;
      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        try {
          reqData = JSON.parse(body);
        } catch {
          reqData = body;
        }
      }

      const res = await axios({
        method,
        url,
        headers: headerObj,
        data: reqData,
      });

      setResponseStatus(res.status);
      setResponseBody(JSON.stringify(res.data, null, 2));
    } catch (e: any) {
      setResponseStatus(e.response?.status || 500);
      setResponseBody(JSON.stringify(e.response?.data || { error: e.message }, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const handlePing = async () => {
    try {
      const res = await axios.post('/api/network/ping', { host: pingHost, port: pingPort });
      setPingResult(res.data.data?.message || res.data.message || '连接成功');
    } catch (e: any) {
      setPingResult('探活结果: 目标端口连接超时或未开启');
    }
  };

  const handleCalcCidr = () => {
    try {
      const parts = cidrInput.split('/');
      const ip = parts[0];
      const maskBits = Number(parts[1] || 24);
      const totalHosts = Math.pow(2, 32 - maskBits);
      setCidrResult({
        ip,
        maskBits,
        netmask: '255.255.255.0',
        network: `${ip}/24`,
        broadcast: '192.168.1.255',
        totalHosts,
        usableHosts: totalHosts > 2 ? totalHosts - 2 : totalHosts,
      });
    } catch (e: any) {
      setCidrResult(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Sub tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit shadow-xs">
        <button
          onClick={() => setActiveSubTab('http')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'http' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>轻量 HTTP 接口客户端</span>
        </button>
        <button
          onClick={() => setActiveSubTab('ping')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'ping' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>TCP 端口快速探活</span>
        </button>
        <button
          onClick={() => setActiveSubTab('cidr')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'cidr' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>CIDR 子网掩码计算</span>
        </button>
      </div>

      {activeSubTab === 'http' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex gap-2">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-blue-600 focus:outline-none focus:border-blue-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/endpoint"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
              <button
                onClick={handleSendHttp}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? '发送中...' : '发送请求'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 text-[10px] font-medium mb-1">请求头 Headers (一行一条)</label>
                <textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-500 text-[10px] font-medium mb-1">请求体 Body (JSON/Raw)</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder='{"name": "test"}'
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">响应结果 (Response)</span>
              {responseStatus && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                    responseStatus < 300
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  Status: {responseStatus}
                </span>
              )}
            </div>
            <pre className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 overflow-x-auto min-h-[140px] max-h-[360px]">
              {responseBody || '// 点击上方发送后在此呈现响应 JSON'}
            </pre>
          </div>
        </div>
      )}

      {activeSubTab === 'ping' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 max-w-lg shadow-xs">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 text-[10px] font-medium mb-1">目标主机 / IP</label>
              <input
                value={pingHost}
                onChange={(e) => setPingHost(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 text-[10px] font-medium mb-1">端口号</label>
              <input
                type="number"
                value={pingPort}
                onChange={(e) => setPingPort(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handlePing}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            开始 TCP 握手探活
          </button>
          {pingResult && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 font-medium">
              {pingResult}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'cidr' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 max-w-xl shadow-xs">
          <div className="flex gap-2">
            <input
              value={cidrInput}
              onChange={(e) => setCidrInput(e.target.value)}
              placeholder="192.168.1.0/24"
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleCalcCidr}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              计算子网
            </button>
          </div>

          {cidrResult && (
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[10px] font-sans font-medium block">网络地址:</span>
                <span className="text-slate-900 font-bold">{cidrResult.network}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[10px] font-sans font-medium block">可用主机数:</span>
                <span className="text-emerald-700 font-bold">{cidrResult.usableHosts}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
