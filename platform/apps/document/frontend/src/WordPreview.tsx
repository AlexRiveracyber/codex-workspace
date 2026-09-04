import React, { useEffect, useRef, useState } from 'react';

const sanitize = (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html');
  document.querySelectorAll('script,style,iframe,object,embed,form').forEach(node => node.remove());
  document.querySelectorAll('*').forEach(node => {
    Array.from(node.attributes).forEach(attribute => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || ((name === 'href' || name === 'src') && value.startsWith('javascript:'))) node.removeAttribute(attribute.name);
    });
  });
  return document.body.innerHTML;
};

export const WordPreview: React.FC<{ url: string; sourceFile?: File }> = ({ url, sourceFile }) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const host = hostRef.current;
    if (!host) return;
    host.replaceChildren(); setLoading(true); setError('');
    const load = async () => {
      let timeoutId = 0;
      try {
        const data: Blob = sourceFile ?? await fetch(url, { signal: controller.signal }).then(response => {
          if (!response.ok) throw new Error('文件读取失败');
          return response.blob();
        });
        const timeout = new Promise<never>((_, reject) => { timeoutId = window.setTimeout(() => reject(new Error('Word 文档解析超时')), 30000); });
        const { renderAsync } = await import('docx-preview');
        await Promise.race([renderAsync(data, host, undefined, {
          className: 'docx-page', breakPages: true, ignoreWidth: false, ignoreHeight: false,
          renderHeaders: true, renderFooters: true, renderFootnotes: true, renderEndnotes: true,
          renderAltChunks: true, useBase64URL: true,
        }), timeout]);
        if (!host.children.length) {
          const { default: mammoth } = await import('mammoth');
          const arrayBuffer = sourceFile ? await sourceFile.arrayBuffer() : await data.arrayBuffer();
          const result = await mammoth.convertToHtml({ arrayBuffer });
          host.innerHTML = sanitize(result.value);
        }
        if (!host.children.length && !host.textContent?.trim()) throw new Error('文档中没有可渲染的正文内容');
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Word 文档解析失败');
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => { controller.abort(); host.replaceChildren(); };
  }, [sourceFile, url]);

  return <div className="word-render-shell">
    {loading&&<div className="word-state">正在按 Word 版式渲染文档…</div>}
    {error&&<div className="word-state">无法预览该 Word 文档：{error}</div>}
    <div ref={hostRef} className={`docx-preview-host ${loading||error?'hidden':''}`}/>
  </div>;
};
