import React, { useEffect, useState } from 'react';

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
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setHtml(''); setError(''); setLoading(true);
    const load = async () => {
      let timeoutId = 0;
      try {
        const { default: mammoth } = await import('mammoth');
        const arrayBuffer = sourceFile ? await sourceFile.arrayBuffer() : await fetch(url, { signal: controller.signal }).then(response => {
          if (!response.ok) throw new Error('文件读取失败');
          return response.arrayBuffer();
        });
        const timeout = new Promise<never>((_, reject) => { timeoutId = window.setTimeout(() => reject(new Error('Word 文档解析超时')), 20000); });
        const result = await Promise.race([mammoth.convertToHtml({ arrayBuffer }), timeout]);
        if (!controller.signal.aborted) setHtml(sanitize(result.value));
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Word 文档解析失败');
      } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [sourceFile, url]);

  if (loading) return <div className="word-state">正在解析 Word 文档…</div>;
  if (error) return <div className="word-state">无法预览该 Word 文档：{error}</div>;
  if (!html) return <div className="word-state">该文档未提取到可显示的正文，可能只包含文本框、绘图或其他 Word 专有对象。请使用“下载原文件”查看完整内容。</div>;
  return <article className="word-preview" dangerouslySetInnerHTML={{ __html: html }}/>;
};
