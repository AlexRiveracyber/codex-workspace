import React, { useState } from 'react';
import { FileCode2, Copy, Check, Sparkles, Code2, Database } from 'lucide-react';

export const FormatCodeTools: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'json' | 'json2pojo' | 'sql2entity'>('json');
  const [inputCode, setInputCode] = useState('{\n  "id": 1001,\n  "userName": "Alex",\n  "isActive": true,\n  "roles": ["admin", "editor"],\n  "createdAt": "2026-08-29T10:00:00Z"\n}');
  const [outputCode, setOutputCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [className, setClassName] = useState('UserDto');

  const copyResult = () => {
    navigator.clipboard.writeText(outputCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatJson = () => {
    try {
      const obj = JSON.parse(inputCode);
      setOutputCode(JSON.stringify(obj, null, 2));
    } catch (e: any) {
      setOutputCode('JSON 格式错误: ' + e.message);
    }
  };

  const minifyJson = () => {
    try {
      const obj = JSON.parse(inputCode);
      setOutputCode(JSON.stringify(obj));
    } catch (e: any) {
      setOutputCode('JSON 压缩错误: ' + e.message);
    }
  };

  const jsonToTypeScript = () => {
    try {
      const obj = JSON.parse(inputCode);
      let res = `export interface ${className} {\n`;
      for (const [k, v] of Object.entries(obj)) {
        let typeStr = 'any';
        if (typeof v === 'string') typeStr = 'string';
        else if (typeof v === 'number') typeStr = 'number';
        else if (typeof v === 'boolean') typeStr = 'boolean';
        else if (Array.isArray(v)) typeStr = typeof v[0] === 'string' ? 'string[]' : typeof v[0] === 'number' ? 'number[]' : 'any[]';
        else if (typeof v === 'object' && v !== null) typeStr = 'Record<string, any>';
        res += `  ${k}?: ${typeStr};\n`;
      }
      res += '}\n';
      setOutputCode(res);
    } catch (e: any) {
      setOutputCode('解析错误: ' + e.message);
    }
  };

  const jsonToJava = () => {
    try {
      const obj = JSON.parse(inputCode);
      let res = `package com.example.dto;\n\nimport lombok.Data;\nimport java.util.List;\nimport java.time.LocalDateTime;\n\n@Data\npublic class ${className} {\n`;
      for (const [k, v] of Object.entries(obj)) {
        let typeStr = 'Object';
        if (typeof v === 'string') typeStr = 'String';
        else if (typeof v === 'number') typeStr = Number.isInteger(v) ? 'Long' : 'Double';
        else if (typeof v === 'boolean') typeStr = 'Boolean';
        else if (Array.isArray(v)) typeStr = 'List<String>';
        res += `    private ${typeStr} ${k};\n`;
      }
      res += '}\n';
      setOutputCode(res);
    } catch (e: any) {
      setOutputCode('解析错误: ' + e.message);
    }
  };

  const sqlToEntity = () => {
    try {
      const lines = inputCode.split('\n');
      let fields: { name: string; type: string; comment: string }[] = [];
      let tblName = className;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.toUpperCase().startsWith('CREATE TABLE')) {
          const match = trimmed.match(/CREATE\s+TABLE\s+[`"]?(\w+)[`"]?/i);
          if (match) tblName = match[1];
        } else if (trimmed.startsWith('`') || /^[a-zA-Z_]\w*\s+/.test(trimmed)) {
          const match = trimmed.match(/^[`"]?(\w+)[`"]?\s+(\w+)/);
          if (match) {
            const colName = match[1];
            const colType = match[2].toUpperCase();
            if (!['PRIMARY', 'KEY', 'CONSTRAINT', 'UNIQUE'].includes(colName.toUpperCase())) {
              let javaType = 'String';
              if (colType.includes('INT')) javaType = 'Long';
              else if (colType.includes('VARCHAR') || colType.includes('TEXT')) javaType = 'String';
              else if (colType.includes('DECIMAL') || colType.includes('NUMERIC')) javaType = 'BigDecimal';
              else if (colType.includes('DATETIME') || colType.includes('TIMESTAMP')) javaType = 'LocalDateTime';
              else if (colType.includes('TINYINT(1)') || colType.includes('BOOLEAN')) javaType = 'Boolean';
              fields.push({ name: colName, type: javaType, comment: '' });
            }
          }
        }
      }

      let res = `package com.example.entity;\n\nimport lombok.Data;\nimport java.time.LocalDateTime;\nimport java.math.BigDecimal;\n\n@Data\npublic class ${tblName}Entity {\n`;
      for (const f of fields) {
        const camel = f.name.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
        res += `    private ${f.type} ${camel};\n`;
      }
      res += '}\n';
      setOutputCode(res);
    } catch (e: any) {
      setOutputCode('SQL 解析错误: ' + e.message);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Sub tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit shadow-xs">
        <button
          onClick={() => setActiveSubTab('json')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'json' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          <span>JSON 格式化 / 压缩</span>
        </button>
        <button
          onClick={() => setActiveSubTab('json2pojo')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'json2pojo' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>JSON 转 Java / TypeScript</span>
        </button>
        <button
          onClick={() => setActiveSubTab('sql2entity')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'sql2entity' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>DDL SQL 转 Entity 实体</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              {activeSubTab === 'sql2entity' ? '输入 CREATE TABLE DDL SQL' : '输入 JSON 报文'}
            </span>
            {activeSubTab !== 'json' && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 text-[10px] font-medium">类名:</span>
                <input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-28 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}
          </div>
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            rows={14}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none transition"
          />

          <div className="flex items-center gap-2">
            {activeSubTab === 'json' && (
              <>
                <button
                  onClick={formatJson}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  美化格式化 (Prettify)
                </button>
                <button
                  onClick={minifyJson}
                  className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                >
                  单行压缩 (Minify)
                </button>
              </>
            )}

            {activeSubTab === 'json2pojo' && (
              <>
                <button
                  onClick={jsonToJava}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  生成 Java POJO 类
                </button>
                <button
                  onClick={jsonToTypeScript}
                  className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
                >
                  生成 TypeScript Interface
                </button>
              </>
            )}

            {activeSubTab === 'sql2entity' && (
              <button
                onClick={sqlToEntity}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                解析 DDL 生成 Java Entity
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">代码生成与转换输出</span>
            <button
              onClick={copyResult}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 cursor-pointer transition flex items-center gap-1 font-semibold"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? '已复制' : '复制全部代码'}</span>
            </button>
          </div>
          <textarea
            value={outputCode}
            readOnly
            rows={16}
            placeholder="生成的代码或格式化结果..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 focus:outline-none resize-none"
          />
        </div>
      </div>
    </div>
  );
};
