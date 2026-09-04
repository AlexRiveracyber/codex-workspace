import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Clock3, File, FileImage, FileSpreadsheet, FileText, Folder, HardDrive, Presentation, RefreshCw, Search, Star } from 'lucide-react';

type DocumentItem = { id: string; name: string; path: string; extension: string; size: number; modified: string; favorite?: boolean; sourceFile?: File };
type Library = { name: string; root: string; documents: DocumentItem[] };
const demos: DocumentItem[] = [
  { id:'README.md', name:'README.md', path:'Document Center Library', extension:'md', size:420, modified:new Date().toISOString(), favorite:true },
  { id:'产品方案.docx', name:'产品方案.docx', path:'示例/产品资料', extension:'docx', size:248000, modified:new Date(Date.now()-86400000).toISOString() },
  { id:'季度复盘.pptx', name:'季度复盘.pptx', path:'示例/汇报材料', extension:'pptx', size:4820000, modified:new Date(Date.now()-172800000).toISOString() },
  { id:'研发资料索引.pdf', name:'研发资料索引.pdf', path:'示例/技术资料', extension:'pdf', size:1320000, modified:new Date(Date.now()-259200000).toISOString() },
  { id:'项目排期.xlsx', name:'项目排期.xlsx', path:'示例/项目管理', extension:'xlsx', size:84000, modified:new Date(Date.now()-432000000).toISOString() },
];
const office = new Set(['doc','docx','ppt','pptx','xls','xlsx']);
const images = new Set(['png','jpg','jpeg','gif','webp','svg']);
const text = new Set(['txt','md','json','xml','yaml','yml','csv','log']);
const fmt = (n:number) => n < 1048576 ? `${Math.max(1,Math.round(n/1024))} KB` : `${(n/1048576).toFixed(1)} MB`;
const icon = (ext:string) => ['ppt','pptx'].includes(ext)?Presentation:['xls','xlsx','csv'].includes(ext)?FileSpreadsheet:images.has(ext)?FileImage:['doc','docx','txt','md'].includes(ext)?FileText:File;
const tone = (ext:string) => ['doc','docx'].includes(ext)?'blue':['ppt','pptx'].includes(ext)?'orange':['xls','xlsx','csv'].includes(ext)?'green':ext==='pdf'?'red':images.has(ext)?'purple':'slate';

export const App: React.FC = () => {
  const [library,setLibrary]=useState<Library>({name:'本地资料库',root:'/documents',documents:demos});
  const [selected,setSelected]=useState<DocumentItem>(demos[0]);
  const [query,setQuery]=useState(''); const [folder,setFolder]=useState('全部文档'); const [filter,setFilter]=useState('all');
  const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [previewText,setPreviewText]=useState(''); const [previewUrl,setPreviewUrl]=useState('');
  const directoryInput=useRef<HTMLInputElement>(null);
  const load=async()=>{setLoading(true);try{const res=await fetch('/api/documents');if(!res.ok)throw new Error();const data:Library=await res.json();setLibrary({...data,documents:data.documents.length?data.documents:demos});if(data.documents[0])setSelected(data.documents[0]);setError(data.documents.length?'':'挂载目录暂无文档，正在展示示例');}catch{setError('Document API 暂不可用，正在展示示例');}finally{setLoading(false);}};
  useEffect(()=>{load();},[]);
  useEffect(()=>{directoryInput.current?.setAttribute('webkitdirectory','');},[]);
  useEffect(()=>{setPreviewText('');setPreviewUrl('');let objectUrl='';if(selected.sourceFile){objectUrl=URL.createObjectURL(selected.sourceFile);setPreviewUrl(objectUrl);if(text.has(selected.extension))selected.sourceFile.text().then(setPreviewText).catch(()=>{});}else if(text.has(selected.extension))fetch(`/api/documents/content?path=${encodeURIComponent(selected.id)}`).then(r=>r.ok?r.text():'').then(setPreviewText).catch(()=>{});return()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);};},[selected]);
  const chooseDirectory=(files:FileList|null)=>{if(!files?.length)return;const picked=Array.from(files);const rootName=picked[0].webkitRelativePath.split('/')[0]||'本地目录';const documents=picked.map((sourceFile,index)=>{const relative=sourceFile.webkitRelativePath||sourceFile.name;const parts=relative.split('/');const name=parts.pop()||sourceFile.name;const extension=(name.split('.').pop()||'').toLowerCase();return{id:`local-${index}-${relative}`,name,path:parts.join('/')||rootName,extension,size:sourceFile.size,modified:new Date(sourceFile.lastModified).toISOString(),sourceFile};});setLibrary({name:rootName,root:`本地目录 / ${rootName}`,documents});setSelected(documents[0]);setFolder('全部文档');setFilter('all');setQuery('');setError('');};
  const folders=useMemo(()=>['全部文档',...Array.from(new Set(library.documents.map(d=>d.path))).sort()],[library.documents]);
  const shown=useMemo(()=>library.documents.filter(d=>(folder==='全部文档'||d.path===folder)&&(`${d.name} ${d.path}`.toLowerCase().includes(query.toLowerCase()))&&(filter==='all'||filter==='office'&&office.has(d.extension)||filter==='pdf'&&d.extension==='pdf'||filter==='image'&&images.has(d.extension)||filter==='text'&&text.has(d.extension))),[library,folder,query,filter]);
  const Icon=icon(selected.extension); const url=previewUrl||`/api/documents/content?path=${encodeURIComponent(selected.id)}`;
  return <div className="app">
    <header><div className="brand"><span><BookOpen/></span><div><h1>Document Center</h1><p>本地文档浏览与检索中心 · Port 3005</p></div></div><div className="status"><i/>{loading?'正在扫描':'目录已同步'}<button onClick={load} title="重新扫描"><RefreshCw/></button></div></header>
    <main>
      <aside><div className="library"><HardDrive/><div><b>{library.name}</b><small>{library.documents.length} 个文档</small></div></div><label>资料库</label><button className={folder==='全部文档'?'active':''} onClick={()=>setFolder('全部文档')}><HardDrive/>全部文档<em>{library.documents.length}</em></button><button><Star/>我的收藏<em>{library.documents.filter(d=>d.favorite).length}</em></button><label>文件夹</label>{folders.slice(1).map(f=><button key={f} className={folder===f?'active':''} onClick={()=>setFolder(f)}><Folder/>{f}</button>)}<div className="mount"><Folder/><b>本地目录</b><p>{library.root}</p><small>选择后仅在当前浏览器中只读扫描，不会上传文件</small><button className="choose-folder" onClick={()=>directoryInput.current?.click()}><Folder/>选择本地目录</button><input ref={directoryInput} className="directory-input" type="file" multiple onChange={e=>chooseDirectory(e.target.files)}/></div></aside>
      <section className="files"><div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索文件名或路径…"/></div><div className="filters">{[['all','全部'],['office','Office'],['pdf','PDF'],['image','图片'],['text','文本']].map(([id,name])=><button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id)}>{name}</button>)}</div>{error&&<div className="notice">{error}</div>}<div className="list">{shown.map(d=>{const I=icon(d.extension);return <button key={d.id} className={selected.id===d.id?'selected':''} onClick={()=>setSelected(d)}><span className={tone(d.extension)}><I/></span><div><b>{d.name}</b><small>{d.path} · {fmt(d.size)}</small></div>{d.favorite&&<Star className="fav"/>}</button>})}</div></section>
      <section className="preview"><div className="preview-head"><div><b>{selected.name}</b><small><Clock3/>{new Date(selected.modified).toLocaleString('zh-CN',{hour12:false})}</small></div><a href={url} download>下载原文件</a></div><div className="canvas">{selected.extension==='pdf'?<iframe src={url} title={selected.name}/>:images.has(selected.extension)?<img src={url} alt={selected.name}/>:previewText?<pre>{previewText}</pre>:<div className="unsupported"><span className={tone(selected.extension)}><Icon/></span><h2>{selected.name}</h2><p>{office.has(selected.extension)?'Office 文档已完成索引。下一阶段接入 LibreOffice 转换服务后，可在这里直接分页预览。':'选择左侧文档查看内容。'}</p><em>{selected.extension.toUpperCase()}</em></div>}</div></section>
    </main>
  </div>;
};
