import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

export const CheatSheetTools: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'http' | 'docker' | 'git'>('http');

  const httpCodes = [
    { code: '200 OK', desc: '请求成功' },
    { code: '201 Created', desc: '已创建新资源' },
    { code: '204 No Content', desc: '请求成功但无响应内容' },
    { code: '400 Bad Request', desc: '客户端请求参数错误' },
    { code: '401 Unauthorized', desc: '未登录或 Token 无效' },
    { code: '403 Forbidden', desc: '权限不足禁止访问' },
    { code: '404 Not Found', desc: '目标资源不存在' },
    { code: '500 Internal Server Error', desc: '服务器内部异常' },
    { code: '502 Bad Gateway', desc: '网关上游无响应' },
    { code: '503 Service Unavailable', desc: '服务超载或停机维护' },
  ];

  const dockerCommands = [
    { cmd: 'docker compose up -d', desc: '后台构建并启动全部服务容器' },
    { cmd: 'docker compose logs -f <service>', desc: '实时跟随跟踪指定服务日志' },
    { cmd: 'docker ps -a', desc: '列出本地全部容器及其运行状态' },
    { cmd: 'docker exec -it <container> sh', desc: '以交互式终端进入容器' },
    { cmd: 'docker system prune -f', desc: '清理悬挂无效镜像与无主卷' },
  ];

  const gitCommands = [
    { cmd: 'git checkout -b <branch>', desc: '创建并切换至新分支' },
    { cmd: 'git commit -m "feat: xxx"', desc: '规范化提交当前暂存区代码' },
    { cmd: 'git pull --rebase origin main', desc: '变基拉取远程主干最新代码' },
    { cmd: 'git stash pop', desc: '弹出恢复暂存的工作区代码' },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit shadow-xs">
        <button
          onClick={() => setActiveSubTab('http')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'http' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          HTTP 状态码
        </button>
        <button
          onClick={() => setActiveSubTab('docker')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'docker' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          Docker 常用指令
        </button>
        <button
          onClick={() => setActiveSubTab('git')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'git' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          Git 研发指令
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-w-2xl shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
            <tr>
              <th className="p-3">名称 / 指令</th>
              <th className="p-3">说明</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {activeSubTab === 'http' &&
              httpCodes.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 text-blue-700 font-bold">{item.code}</td>
                  <td className="p-3 text-slate-700 font-sans">{item.desc}</td>
                </tr>
              ))}
            {activeSubTab === 'docker' &&
              dockerCommands.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 text-emerald-700 font-semibold">{item.cmd}</td>
                  <td className="p-3 text-slate-700 font-sans">{item.desc}</td>
                </tr>
              ))}
            {activeSubTab === 'git' &&
              gitCommands.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 text-amber-700 font-semibold">{item.cmd}</td>
                  <td className="p-3 text-slate-700 font-sans">{item.desc}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
