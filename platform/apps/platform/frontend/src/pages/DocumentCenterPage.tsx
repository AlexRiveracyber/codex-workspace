import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, ChevronRight, Clock3, File, FileImage, FileSpreadsheet, FileText,
  Folder, FolderOpen, Grid2X2, HardDrive, List, Presentation, Search, Star, Upload,
} from 'lucide-react';

type DocumentEntry = {
  id: string;
  name: string;
  path: string;
  extension: string;
  size: number;
  modified: number;
  file?: globalThis.File;
  favorite?: boolean;
  demoText?: string;
};

const demoDocuments: DocumentEntry[] = [
  { id: 'demo-1', name: '项目工作台使用说明.docx', path: '示例资料/产品文档', extension: 'docx', size: 248000, modified: Date.now() - 86400000, favorite: true },
  { id: 'demo-2', name: '季度项目复盘.pptx', path: '示例资料/汇报材料', extension: 'pptx', size: 4820000, modified: Date.now() - 172800000 },
  { id: 'demo-3', name: '本地文档中心规划.md', path: '示例资料/产品文档', extension: 'md', size: 3680, modified: Date.now() - 3600000, favorite: true, demoText: '# 本地文档中心\n\n统一查看 Word、PowerPoint、Excel、PDF、图片与 Markdown 文件。\n\n- 文件保留在本机，不上传到外部服务\n- 支持目录扫描、搜索、收藏和最近查看\n- Office 文档可接入 LibreOffice 转换后预览' },
  { id: 'demo-4', name: '研发资料索引.pdf', path: '示例资料/技术资料', extension: 'pdf', size: 1320000, modified: Date.now() - 259200000 },
  { id: 'demo-5', name: '项目排期.xlsx', path: '示例资料/项目管理', extension: 'xlsx', size: 84000, modified: Date.now() - 432000000 },
  { id: 'demo-6', name: '系统架构图.png', path: '示例资料/技术资料', extension: 'png', size: 680000, modified: Date.now() - 7200000 },
];

const officeExtensions = new Set(['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx']);
const imageExtensions = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);
const textExtensions = new Set(['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'csv', 'log']);
const formatSize = (size: number) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;

const iconFor = (extension: string) => {
  if (['doc', 'docx', 'txt', 'md'].includes(extension)) return FileText;
  if (['ppt', 'pptx'].includes(extension)) return Presentation;
  if (['xls', 'xlsx', 'csv'].includes(extension)) return FileSpreadsheet;
  if (imageExtensions.has(extension)) return FileImage;
  return File;
};

const colorFor = (extension: string) => {
  if (['doc', 'docx'].includes(extension)) return 'bg-blue-50 text-blue-600';
  if (['ppt', 'pptx'].includes(extension)) return 'bg-orange-50 text-orange-600';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'bg-emerald-50 text-emerald-600';
  if (extension === 'pdf') return 'bg-rose-50 text-rose-600';
  if (imageExtensions.has(extension)) return 'bg-violet-50 text-violet-600';
  return 'bg-slate-100 text-slate-600';
};

export const DocumentCenterPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentEntry[]>(demoDocuments);
  const [selected, setSelected] = useState<DocumentEntry>(demoDocuments[2]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [folderFilter, setFolderFilter] = useState('全部文档');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [libraryName, setLibraryName] = useState('示例资料');
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewText, setPreviewText] = useState(selected.demoText || '');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let url = '';
    setPreviewText(selected.demoText || '');
    if (selected.file) {
      if (imageExtensions.has(selected.extension) || selected.extension === 'pdf') {
        url = URL.createObjectURL(selected.file);
        setPreviewUrl(url);
      } else if (textExtensions.has(selected.extension)) {
        selected.file.text().then(setPreviewText);
        setPreviewUrl('');
      } else setPreviewUrl('');
    } else setPreviewUrl('');
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [selected]);

  const folders = useMemo(() => ['全部文档', ...Array.from(new Set(documents.map((item) => item.path))).sort()], [documents]);
  const filtered = useMemo(() => documents.filter((item) => {
    const matchesQuery = `${item.name} ${item.path}`.toLowerCase().includes(query.toLowerCase());
    const matchesFolder = folderFilter === '全部文档' || item.path === folderFilter;
    const matchesType = typeFilter === 'all'
      || (typeFilter === 'office' && officeExtensions.has(item.extension))
      || (typeFilter === 'pdf' && item.extension === 'pdf')
      || (typeFilter === 'image' && imageExtensions.has(item.extension))
      || (typeFilter === 'text' && textExtensions.has(item.extension))
      || (typeFilter === 'favorite' && item.favorite);
    return matchesQuery && matchesFolder && matchesType;
  }), [documents, folderFilter, query, typeFilter]);

  const chooseDirectory = async () => {
    const picker = (window as unknown as { showDirectoryPicker?: () => Promise<any> }).showDirectoryPicker;
    if (!picker) {
      alert('当前浏览器不支持目录授权，请使用最新版 Chrome 或 Edge。');
      return;
    }
    try {
      setScanning(true);
      const root = await picker();
      const found: DocumentEntry[] = [];
      const walk = async (handle: any, path: string) => {
        for await (const [name, child] of handle.entries()) {
          if (child.kind === 'directory') await walk(child, path ? `${path}/${name}` : name);
          else {
            const file = await child.getFile();
            const extension = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
            if ([...officeExtensions, ...imageExtensions, ...textExtensions, 'pdf'].includes(extension)) {
              found.push({ id: `${path}/${name}`, name, path: path || root.name, extension, size: file.size, modified: file.lastModified, file });
            }
          }
        }
      };
      await walk(root, root.name);
      setLibraryName(root.name);
      setFolderFilter('全部文档');
      setDocuments(found);
      if (found[0]) setSelected(found[0]);
    } catch (error: any) {
      if (error?.name !== 'AbortError') console.error(error);
    } finally {
      setScanning(false);
    }
  };

  const toggleFavorite = (entry: DocumentEntry) => {
    setDocuments((items) => items.map((item) => item.id === entry.id ? { ...item, favorite: !item.favorite } : item));
    setSelected((item) => item.id === entry.id ? { ...item, favorite: !item.favorite } : item);
  };

  const PreviewIcon = iconFor(selected.extension);
  const canDirectPreview = previewUrl || previewText;

  return (
    <div className="doc-center h-[calc(100vh-7.5rem)] min-h-[620px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex h-[74px] items-center justify-between border-b border-slate-200 px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><BookOpen className="h-5 w-5" /></div>
          <div><h1 className="text-base font-extrabold text-slate-900">本地文档中心</h1><p className="mt-0.5 text-[11px] text-slate-500">{libraryName} · {documents.length} 个受支持文件</p></div>
        </div>
        <button type="button" onClick={chooseDirectory} disabled={scanning} className="primary-button"><Upload className="h-4 w-4" />{scanning ? '正在扫描…' : '选择本地文件夹'}</button>
      </header>

      <div className="grid h-[calc(100%-74px)] grid-cols-[220px_minmax(360px,0.9fr)_minmax(420px,1.25fr)]">
        <aside className="overflow-y-auto border-r border-slate-200 bg-slate-50/70 p-3">
          <p className="mb-2 px-2 text-[9px] font-extrabold uppercase tracking-[.16em] text-slate-400">资料库</p>
          <button type="button" onClick={() => setFolderFilter('全部文档')} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold ${folderFilter === '全部文档' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-white/70'}`}><HardDrive className="h-4 w-4" />全部文档<span className="ml-auto text-[10px] text-slate-400">{documents.length}</span></button>
          <button type="button" onClick={() => { setFolderFilter('全部文档'); setQuery(''); setTypeFilter('favorite'); }} className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-white/70"><Star className="h-4 w-4" />我的收藏<span className="ml-auto text-[10px] text-slate-400">{documents.filter((item) => item.favorite).length}</span></button>
          <p className="mb-2 mt-5 px-2 text-[9px] font-extrabold uppercase tracking-[.16em] text-slate-400">文件夹</p>
          <div className="space-y-1">{folders.slice(1).map((folder) => <button type="button" key={folder} onClick={() => setFolderFilter(folder)} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] ${folderFilter === folder ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-600 hover:bg-white'}`}><Folder className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{folder.replace(`${libraryName}/`, '')}</span></button>)}</div>
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white/60 p-3 text-[10px] leading-relaxed text-slate-500"><FolderOpen className="mb-2 h-4 w-4 text-slate-400" />浏览器只在本地读取授权目录，文件不会上传到外部服务。</div>
        </aside>

        <section className="flex min-w-0 flex-col border-r border-slate-200">
          <div className="border-b border-slate-200 p-3">
            <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文件名或路径…" className="doc-input h-9 w-full rounded-xl pl-9 pr-3 text-xs" /></div>
            <div className="mt-2 flex items-center gap-1.5">
              {[['all','全部'],['office','Office'],['pdf','PDF'],['image','图片'],['text','文本']].map(([id,label]) => <button type="button" key={id} onClick={() => setTypeFilter(id)} className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${typeFilter === id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{label}</button>)}
              <div className="ml-auto flex rounded-lg border border-slate-200 p-0.5"><button type="button" onClick={() => setView('list')} className={`rounded-md p-1 ${view === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}><List className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setView('grid')} className={`rounded-md p-1 ${view === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}><Grid2X2 className="h-3.5 w-3.5" /></button></div>
            </div>
          </div>
          <div className={`flex-1 overflow-y-auto p-3 ${view === 'grid' ? 'grid auto-rows-min grid-cols-2 gap-2' : 'space-y-1'}`}>
            {filtered.map((entry) => { const Icon = iconFor(entry.extension); return <button type="button" key={entry.id} onClick={() => setSelected(entry)} className={`group w-full rounded-xl border p-3 text-left transition ${selected.id === entry.id ? 'border-indigo-200 bg-indigo-50/70' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'} ${view === 'list' ? 'flex items-center gap-3' : ''}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorFor(entry.extension)}`}><Icon className="h-4 w-4" /></span><span className={`min-w-0 flex-1 ${view === 'grid' ? 'mt-2 block' : ''}`}><span className="block truncate text-xs font-bold text-slate-800">{entry.name}</span><span className="mt-1 block truncate text-[10px] text-slate-400">{entry.path} · {formatSize(entry.size)}</span></span>{entry.favorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}</button>; })}
            {filtered.length === 0 && <div className="py-16 text-center text-xs text-slate-400">没有找到符合条件的文件</div>}
          </div>
        </section>

        <section className="flex min-w-0 flex-col bg-slate-50/40">
          <div className="flex h-[58px] items-center justify-between border-b border-slate-200 px-4">
            <div className="min-w-0"><p className="truncate text-xs font-extrabold text-slate-800">{selected.name}</p><p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400"><Clock3 className="h-3 w-3" />{new Date(selected.modified).toLocaleString('zh-CN', { hour12: false })}</p></div>
            <button type="button" onClick={() => toggleFavorite(selected)} className="icon-button h-8 w-8" aria-label="收藏"><Star className={`h-4 w-4 ${selected.favorite ? 'fill-amber-400 text-amber-400' : ''}`} /></button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            {previewUrl && selected.extension === 'pdf' && <iframe title={selected.name} src={previewUrl} className="h-full min-h-[520px] w-full rounded-xl border border-slate-200 bg-white" />}
            {previewUrl && imageExtensions.has(selected.extension) && <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white p-5"><img src={previewUrl} alt={selected.name} className="max-h-full max-w-full object-contain" /></div>}
            {previewText && <pre className="min-h-full whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-6 font-sans text-xs leading-7 text-slate-700 shadow-sm">{previewText}</pre>}
            {!canDirectPreview && <div className="flex h-full min-h-[440px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-center"><div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${colorFor(selected.extension)}`}><PreviewIcon className="h-8 w-8" /></div><h3 className="mt-4 text-sm font-extrabold text-slate-800">{selected.name}</h3><p className="mt-2 max-w-sm text-[11px] leading-6 text-slate-500">{officeExtensions.has(selected.extension) ? 'Office 文档已纳入索引。下一步接入本地 LibreOffice 转换服务后，可在这里直接预览页面内容。' : '此文件类型暂不支持浏览器直接预览。'}</p><div className="mt-5 flex items-center gap-2"><span className="rounded-lg bg-slate-100 px-3 py-2 text-[10px] font-bold text-slate-500">{selected.extension.toUpperCase()}</span><ChevronRight className="h-4 w-4 text-slate-300" /></div></div>}
          </div>
        </section>
      </div>
    </div>
  );
};
