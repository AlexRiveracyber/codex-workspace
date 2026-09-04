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

  useEffect(() => {
    const controller = new AbortController();
    setHtml(''); setError('');
    const load = async () => {
      try {
        const { default: mammoth } = await import('mammoth');
        const arrayBuffer = sourceFile ? await sourceFile.arrayBuffer() : await fetch(url, { signal: controller.signal }).then(response => {
          if (!response.ok) throw new Error('文件读取失败');
          return response.arrayBuffer();
        });
        const result = await mammoth.convertToHtml({ arrayBuffer });
        if (!controller.signal.aborted) setHtml(sanitize(result.value));
      } catch (reason) {
        if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Word 文档解析失败');
      }
    };
    load();
    return () => controller.abort();
  }, [sourceFile, url]);

  if (error) return <div className="word-state">无法预览该 Word 文档：{error}</div>;
  if (!html) return <div className="word-state">正在解析 Word 文档…</div>;
  return <article className="word-preview" dangerouslySetInnerHTML={{ __html: html }}/>;
};
