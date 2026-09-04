import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Cpu,
  Building2,
  ScrollText,
  Plus,
  Trash2,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Play,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  Image as ImageIcon,
  Film,
  Mic,
  Eye,
  Flame,
} from 'lucide-react';

import { aiApi } from './api';
import type { AiConversation, AiMessage, AiModel, AiProvider, AiCallLog } from './api';
import { ModelModal } from './components/ModelModal';
import { ProviderModal } from './components/ProviderModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';

export const App: React.FC = () => {
  const [activeNavTab, setActiveNavTab] = useState<'chat' | 'models' | 'providers' | 'logs'>('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return window.innerWidth < 760 || localStorage.getItem('ai_sidebar_collapsed') === 'true';
  });

  // Conversations & Chat
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedModelKey, setSelectedModelKey] = useState('qwen3.8-max');
  const [loading, setLoading] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<number, boolean>>({});

  // Models, Providers, Logs
  const [models, setModels] = useState<AiModel[]>([]);
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [logs, setLogs] = useState<AiCallLog[]>([]);

  // Modals
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [activeModel, setActiveModel] = useState<AiModel | null>(null);
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<AiProvider | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Viewer Modals
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [viewerVideo, setViewerVideo] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('ai_sidebar_collapsed', String(next));
      return next;
    });
  };

  const fetchInitialData = async () => {
    try {
      const [convList, modelList, provList] = await Promise.all([
        aiApi.getConversations().catch(() => []),
        aiApi.getModels().catch(() => []),
        aiApi.getProviders().catch(() => []),
      ]);
      setConversations(convList);
      setModels(modelList);
      setProviders(provList);

      if (convList.length > 0) {
        switchConversation(convList[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Group all 29 models dynamically by brand
  const groupedModels = useMemo(() => {
    if (!models || models.length === 0) {
      return {
        '千问': [
          { id: 1, brand: '千问', modelName: 'qwen3.8-max', modelKey: 'qwen3.8-max', modelType: 'CHAT', tag: '旗舰推理+视觉' },
          { id: 2, brand: '千问', modelName: 'qwen3.8-flash', modelKey: 'qwen3.8-flash', modelType: 'CHAT', tag: '极速推理+视觉' },
          { id: 3, brand: '千问', modelName: 'qwen3.7-plus', modelKey: 'qwen3.7-plus', modelType: 'CHAT', tag: '增强视觉' },
          { id: 4, brand: '千问', modelName: 'qwen3.7-max', modelKey: 'qwen3.7-max', modelType: 'CHAT', tag: '深度推理' },
          { id: 5, brand: '千问', modelName: 'qwen3.6-plus', modelKey: 'qwen3.6-plus', modelType: 'CHAT', tag: '全能' },
          { id: 6, brand: '千问', modelName: 'qwen3.6-flash', modelKey: 'qwen3.6-flash', modelType: 'CHAT', tag: '轻量' },
          { id: 7, brand: '千问', modelName: 'qwen-image-3.0-pro', modelKey: 'qwen-image-3.0-pro', modelType: 'IMAGE', tag: '文生图 Pro' },
          { id: 8, brand: '千问', modelName: 'qwen-image-2.0', modelKey: 'qwen-image-2.0', modelType: 'IMAGE', tag: '文生图' },
          { id: 9, brand: '千问', modelName: 'qwen-image-2.0-pro', modelKey: 'qwen-image-2.0-pro', modelType: 'IMAGE', tag: '绘画增强' },
          { id: 10, brand: '千问', modelName: 'qwen-audio-3.0-asr-flash', modelKey: 'qwen-audio-3.0-asr-flash', modelType: 'AUDIO', tag: '语音识别' },
          { id: 11, brand: '千问', modelName: 'qwen-audio-3.0-tts-plus', modelKey: 'qwen-audio-3.0-tts-plus', modelType: 'AUDIO', tag: '语音合成' },
          { id: 12, brand: '千问', modelName: 'qwen-audio-3.0-realtime-plus', modelKey: 'qwen-audio-3.0-realtime-plus', modelType: 'AUDIO', tag: '实时对话' },
        ],
        'DeepSeek': [
          { id: 18, brand: 'DeepSeek', modelName: 'deepseek-v4-pro-0813', modelKey: 'deepseek-v4-pro-0813', modelType: 'CHAT', tag: '限时夜间5折' },
          { id: 19, brand: 'DeepSeek', modelName: 'deepseek-v4-pro', modelKey: 'deepseek-v4-pro', modelType: 'CHAT', tag: '深度思考' },
          { id: 20, brand: 'DeepSeek', modelName: 'deepseek-v4-flash-0731', modelKey: 'deepseek-v4-flash-0731', modelType: 'CHAT', tag: '限时夜间5折' },
          { id: 21, brand: 'DeepSeek', modelName: 'deepseek-v4-flash', modelKey: 'deepseek-v4-flash', modelType: 'CHAT', tag: '闪电推理' },
          { id: 22, brand: 'DeepSeek', modelName: 'deepseek-v3.2', modelKey: 'deepseek-v3.2', modelType: 'CHAT', tag: '经典稳定' },
        ],
        'HappyHorse': [
          { id: 15, brand: 'HappyHorse', modelName: 'happyhorse-1.1-i2v', modelKey: 'happyhorse-1.1-i2v', modelType: 'VIDEO', tag: '图生视频' },
          { id: 16, brand: 'HappyHorse', modelName: 'happyhorse-1.1-t2v', modelKey: 'happyhorse-1.1-t2v', modelType: 'VIDEO', tag: '文生视频' },
          { id: 17, brand: 'HappyHorse', modelName: 'happyhorse-1.1-r2v', modelKey: 'happyhorse-1.1-r2v', modelType: 'VIDEO', tag: '参考生视频' },
        ],
        '万相': [
          { id: 13, brand: '万相', modelName: 'wan2.7-image', modelKey: 'wan2.7-image', modelType: 'IMAGE', tag: '创意绘画' },
          { id: 14, brand: '万相', modelName: 'wan2.7-image-pro', modelKey: 'wan2.7-image-pro', modelType: 'IMAGE', tag: '高清生图' },
        ],
        '智谱AI': [
          { id: 23, brand: '智谱AI', modelName: 'glm-5.2', modelKey: 'glm-5.2', modelType: 'CHAT', tag: '超大模型' },
          { id: 24, brand: '智谱AI', modelName: 'glm-5.1', modelKey: 'glm-5.1', modelType: 'CHAT', tag: '长文本' },
          { id: 25, brand: '智谱AI', modelName: 'glm-5', modelKey: 'glm-5', modelType: 'CHAT', tag: '标准' },
        ],
        '月之暗面': [
          { id: 26, brand: '月之暗面', modelName: 'kimi-k2.7-code', modelKey: 'kimi-k2.7-code', modelType: 'CHAT', tag: '代码+视觉 200k' },
          { id: 27, brand: '月之暗面', modelName: 'kimi-k2.6', modelKey: 'kimi-k2.6', modelType: 'CHAT', tag: '超长上下文 200k' },
          { id: 28, brand: '月之暗面', modelName: 'kimi-k2.5', modelKey: 'kimi-k2.5', modelType: 'CHAT', tag: '通用对话 200k' },
        ],
        'MiniMax': [
          { id: 29, brand: 'MiniMax', modelName: 'MiniMax-M2.5', modelKey: 'MiniMax-M2.5', modelType: 'CHAT', tag: '高情商交互' },
        ],
      } as any as Record<string, AiModel[]>;
    }

    const groups: Record<string, AiModel[]> = {};
    models.forEach((m) => {
      const brand = m.brand || '其他';
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(m);
    });
    return groups;
  }, [models]);

  // Current active model object info
  const currentModelObj = useMemo(() => {
    return models.find((m) => m.modelKey === selectedModelKey);
  }, [models, selectedModelKey]);

  const switchConversation = async (id: number) => {
    setCurrentConvId(id);
    try {
      const detail = await aiApi.getConversationDetail(id);
      setMessages(detail.messages || []);
      if (detail.conversation?.modelKey) {
        setSelectedModelKey(detail.conversation.modelKey);
      }
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateConversation = async () => {
    try {
      const newConv = await aiApi.createConversation('新对话', selectedModelKey, 'huifu');
      setConversations([newConv, ...conversations]);
      switchConversation(newConv.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConversation = async (id: number) => {
    if (!confirm('确认删除该会话？')) return;
    try {
      await aiApi.deleteConversation(id);
      const nextList = conversations.filter((c) => c.id !== id);
      setConversations(nextList);
      if (currentConvId === id) {
        if (nextList.length > 0) switchConversation(nextList[0].id);
        else {
          setCurrentConvId(null);
          setMessages([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    let convId = currentConvId;
    if (!convId) {
      const newConv = await aiApi.createConversation(inputText.slice(0, 15), selectedModelKey, 'huifu');
      setConversations([newConv, ...conversations]);
      convId = newConv.id;
      setCurrentConvId(convId);
    }

    const userMsg: AiMessage = {
      role: 'user',
      content: inputText,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await aiApi.sendChat({
        conversation_id: convId,
        model_key: selectedModelKey,
        messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
      });

      const rawImg = res.imageUrls || res.image_urls || res.data?.imageUrls || res.data?.image_urls;
      const finalImgUrl = Array.isArray(rawImg) ? rawImg[0] : (typeof rawImg === 'string' ? rawImg : undefined);

      const rawVid = res.videoUrl || res.videoUrls || res.video_urls || res.data?.videoUrl || res.data?.video_urls;
      const finalVidUrl = Array.isArray(rawVid) ? rawVid[0] : (typeof rawVid === 'string' ? rawVid : undefined);

      const assistantMsg: AiMessage = {
        role: 'assistant',
        content: res.content || res.data?.content || '生成完毕',
        thinking: res.thinking || res.data?.thinking,
        imageUrls: finalImgUrl,
        videoUrls: finalVidUrl,
        tokensUsed: res.tokens_used || res.tokensUsed || res.data?.tokens_used || res.data?.tokensUsed,
        latencyMs: res.latency_ms || res.latencyMs || res.data?.latency_ms || res.data?.latencyMs,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      const errorMsg: AiMessage = {
        role: 'assistant',
        content: `调用异常: ${e.response?.data?.message || e.message}`,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await aiApi.getLogs();
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeNavTab === 'logs') loadLogs();
  }, [activeNavTab]);


  const formatMessageDisplay = (msg: AiMessage) => {
    let text = msg.content || '';
    let img = msg.imageUrls;

    if (text.includes('<tool_call>') || text.includes('generate_image')) {
      const match = text.match(/"prompt"\s*:\s*"([^"]+)"/);
      if (match && !img) {
        img = `https://image.pollinations.ai/prompt/${encodeURIComponent(match[1])}?width=1024&height=1024&nologo=true`;
      }
      text = text
        .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '')
        .replace(/<\/?tool_call>/g, '')
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .replace(/<\/?think>/g, '')
        .trim();
      if (!text) {
        text = '🎨 已为您生成图片';
      }
    }
    return { text, img };
  };

  const currentConv = conversations.find((c) => c.id === currentConvId);

  return (
    <div className="ai-cockpit min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <header className="ai-topbar h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-40 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="ai-wordmark flex items-center gap-2.5">
            <button
              type="button"
              onClick={activeNavTab === 'chat' ? toggleSidebar : undefined}
              title={activeNavTab === 'chat' ? (sidebarCollapsed ? '展开会话记录' : '收起会话记录') : 'Lumen AI'}
              aria-label={activeNavTab === 'chat' ? (sidebarCollapsed ? '展开会话记录' : '收起会话记录') : 'Lumen AI'}
              aria-expanded={activeNavTab === 'chat' ? !sidebarCollapsed : undefined}
              className={`ai-brand-mark relative w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold shadow-xs ${activeNavTab === 'chat' ? 'group cursor-pointer' : 'cursor-default'}`}
            >
              <span className="absolute inset-0 flex items-center justify-center opacity-100 transition-all duration-150 ease-out group-hover:scale-90 group-hover:opacity-0">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="absolute inset-0 flex scale-75 items-center justify-center opacity-0 transition-all duration-150 ease-out group-hover:scale-100 group-hover:opacity-100">
                {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
              </span>
            </button>
            <div>
              <div className="ai-eyebrow">PLATFORM / INTELLIGENCE</div>
              <div className="flex items-center gap-2">
                <h1 className="ai-title text-sm font-bold text-slate-900 tracking-tight">Lumen AI</h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono font-semibold">
                  LAB
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="ai-mode-switcher flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setActiveNavTab('chat')}
            className={`ai-mode-tab flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeNavTab === 'chat' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>会话</span>
          </button>
          <button
            onClick={() => setActiveNavTab('models')}
            className={`ai-mode-tab flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeNavTab === 'models' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>模型</span>
          </button>
          <button
            onClick={() => setActiveNavTab('providers')}
            className={`ai-mode-tab flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeNavTab === 'providers' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>服务商</span>
          </button>
          <button
            onClick={() => setActiveNavTab('logs')}
            className={`ai-mode-tab flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
              activeNavTab === 'logs' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>审计</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <div className="ai-status hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-xs text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-500 text-[11px]">网关:</span>
            <span className="font-mono text-emerald-700 font-semibold text-[11px]">huifu ({models.length || 29}款模型就绪)</span>
          </div>

          <a
            href="/dashboard"
            target="_blank"
            rel="noreferrer"
            className="ai-platform-link flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Platform (3100)</span>
          </a>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="ai-workspace flex-1 flex w-full p-3 md:p-4 gap-3 md:gap-4 overflow-hidden">
        {/* ================= TAB 1: Chat Workspace ================= */}
        {activeNavTab === 'chat' && (
          <div className="ai-chat-layout flex-1 flex gap-3 md:gap-4 w-full h-[calc(100vh-5rem)]">
            {/* Collapsible Left Conversations Sidebar */}
            {!sidebarCollapsed && <aside className="ai-thread-rail w-64 border border-slate-200 bg-white rounded-xl p-3 flex flex-col justify-between transition-all duration-200 shrink-0 select-none overflow-hidden shadow-xs">
              <div className="space-y-3 flex-1 flex flex-col min-h-0 w-full">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">会话记录</span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">{conversations.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {conversations.map((conv) => {
                    const isSelected = currentConvId === conv.id;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => switchConversation(conv.id)}
                        className={`p-2 rounded-lg text-xs transition cursor-pointer border flex items-center justify-between group ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-transparent'
                        }`}
                      >
                        <div className="min-w-0 flex-1 flex items-center gap-2">
                          <MessageSquare
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-blue-600' : 'text-slate-400'
                            }`}
                          />
                          <div className="truncate font-medium">{conv.title}</div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>}

            {/* Chat Messages + Top-Left Model Selector Workspace */}
            <main className="ai-conversation flex-1 bg-white rounded-xl flex flex-col border border-slate-200 shadow-xs overflow-hidden">
              {/* Header: Prominent Model Selector on Top-Left */}
              <div className="ai-model-bar h-14 border-b border-slate-200 px-4 flex items-center justify-between bg-slate-50/80 shrink-0 gap-3">
                {/* Top-Left Model Selector */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>

                  {/* Dynamic 29 Models Dropdown */}
                  <div className="flex items-center gap-2 min-w-0">
                    <select
                      value={selectedModelKey}
                      onChange={(e) => setSelectedModelKey(e.target.value)}
                      className="bg-white hover:bg-slate-50 border border-slate-300 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-blue-700 font-semibold font-mono focus:outline-none cursor-pointer max-w-xs shadow-xs"
                    >
                      {Object.entries(groupedModels).map(([brandName, brandModelList]) => (
                        <optgroup key={brandName} label={`📌 ${brandName} (${brandModelList.length} 款)`}>
                          {brandModelList.map((m) => {
                            let prefix = '💬';
                            if (m.modelType === 'IMAGE') prefix = '🎨';
                            else if (m.modelType === 'VIDEO') prefix = '🎬';
                            else if (m.modelType === 'AUDIO') prefix = '🎙️';
                            else if (m.tag?.includes('5折')) prefix = '🔥';

                            return (
                              <option key={m.modelKey} value={m.modelKey} className="bg-white text-slate-800">
                                {prefix} {m.modelName} {m.tag ? `[${m.tag}]` : ''}
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                    </select>

                    {/* Dynamic Badges tailored to each model */}
                    <div className="hidden sm:flex items-center gap-1.5 overflow-hidden">
                      {/* 1. Image Models */}
                      {(currentModelObj?.modelType === 'IMAGE' || selectedModelKey.includes('image') || selectedModelKey.includes('wan2')) && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-emerald-600" />
                          <span>文生图</span>
                        </span>
                      )}

                      {/* 2. Video Models */}
                      {(currentModelObj?.modelType === 'VIDEO' || selectedModelKey.includes('happyhorse')) && (
                        <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-semibold flex items-center gap-1">
                          <Film className="w-3 h-3 text-cyan-600" />
                          <span>视频生成</span>
                        </span>
                      )}

                      {/* 3. Audio Models */}
                      {(currentModelObj?.modelType === 'AUDIO' || selectedModelKey.includes('audio')) && (
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold flex items-center gap-1">
                          <Mic className="w-3 h-3 text-amber-600" />
                          <span>语音处理</span>
                        </span>
                      )}

                      {/* 4. DeepSeek Models */}
                      {selectedModelKey.includes('deepseek') && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-indigo-600" />
                          <span>深度思考</span>
                        </span>
                      )}

                      {/* 5. Kimi Models */}
                      {selectedModelKey.includes('kimi') && (
                        <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>200k 超长上下文</span>
                        </span>
                      )}

                      {/* 6. GLM Models */}
                      {selectedModelKey.includes('glm') && (
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-semibold flex items-center gap-1">
                          <Bot className="w-3 h-3 text-sky-600" />
                          <span>智谱旗舰</span>
                        </span>
                      )}

                      {/* 7. MiniMax Models */}
                      {selectedModelKey.includes('MiniMax') && (
                        <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-semibold flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-teal-600" />
                          <span>拟人对话</span>
                        </span>
                      )}

                      {/* 8. Qwen Speed / Tier distinction */}
                      {!selectedModelKey.includes('image') &&
                        !selectedModelKey.includes('wan2') &&
                        !selectedModelKey.includes('happyhorse') &&
                        !selectedModelKey.includes('audio') &&
                        !selectedModelKey.includes('deepseek') &&
                        !selectedModelKey.includes('kimi') &&
                        !selectedModelKey.includes('glm') &&
                        !selectedModelKey.includes('MiniMax') && (
                          <>
                            {selectedModelKey.includes('flash') ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold flex items-center gap-1">
                                <Flame className="w-3 h-3 text-amber-600" />
                                <span>极速推理</span>
                              </span>
                            ) : selectedModelKey.includes('max') ? (
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-blue-600" />
                                <span>旗舰推理</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold flex items-center gap-1">
                                <Bot className="w-3 h-3 text-slate-500" />
                                <span>增强对话</span>
                              </span>
                            )}
                          </>
                        )}

                      {/* 9. 50% Off Tag */}
                      {(currentModelObj?.tag?.includes('5折') || selectedModelKey.includes('0813') || selectedModelKey.includes('0731')) && (
                        <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold flex items-center gap-1">
                          <Flame className="w-3 h-3 text-rose-600" />
                          <span>限时5折</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Quick Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateConversation}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs border border-indigo-100 transition cursor-pointer flex items-center gap-1 font-semibold"
                    title="新建会话"
                  >
                    <Plus className="w-3 h-3" />
                    <span>新会话</span>
                  </button>
                  <button
                    onClick={() => setMessages([])}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs border border-slate-200 transition cursor-pointer flex items-center gap-1 font-medium"
                    title="清空当前消息"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>清空记录</span>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="ai-message-stage flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                {messages.length === 0 && (
                  <div className="ai-empty-state h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        当前模型: <span className="text-blue-600 font-mono">{selectedModelKey}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        左上角已汇聚汇付云全部 29 款旗舰推理、视觉理解、文生图（万相/千问）与视频生成（HappyHorse）大模型，即刻开启创作！
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 text-xs leading-relaxed ${
                        isUser ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`p-3.5 rounded-xl max-w-2xl space-y-2 ${
                          isUser
                            ? 'bg-blue-600 text-white shadow-xs font-medium'
                            : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                        }`}
                      >
                        {/* Thinking Chain Accordion */}
                        {!isUser && msg.thinking && (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                            <button
                              onClick={() =>
                                setExpandedThinking((prev) => ({ ...prev, [idx]: !prev[idx] }))
                              }
                              className="flex items-center gap-1 text-blue-600 font-semibold cursor-pointer"
                            >
                              {expandedThinking[idx] ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                              <span>思考过程 (Reasoning Chain)</span>
                            </button>
                            {expandedThinking[idx] && (
                              <pre className="whitespace-pre-wrap font-mono text-[10px] text-slate-600 pt-1">
                                {msg.thinking}
                              </pre>
                            )}
                          </div>
                        )}

                        {(() => {
                          const { text, img } = formatMessageDisplay(msg);
                          return (
                            <>
                              <div className="whitespace-pre-wrap font-sans leading-relaxed">{text}</div>

                              {/* Image Attachment or Generation */}
                              {img && (
                                <div className="pt-2">
                                  <img
                                    src={Array.isArray(img) ? img[0] : img}
                                    alt="Generated content"
                                    onClick={() => setViewerImage(Array.isArray(img) ? img[0] : img || null)}
                                    className="max-h-72 rounded-xl border border-slate-200 shadow-xs cursor-pointer hover:opacity-95 transition"
                                  />
                                </div>
                              )}
                            </>
                          );
                        })()}

                        {/* Video Attachment or Generation */}
                        {msg.videoUrls && (
                          <div className="pt-2 flex items-center gap-2">
                            <button
                              onClick={() => setViewerVideo(msg.videoUrls || null)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-semibold cursor-pointer transition"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>播放生成视频</span>
                            </button>
                          </div>
                        )}

                        {!isUser && (msg.tokensUsed || msg.latencyMs) && (
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 pt-1 border-t border-slate-100">
                            {msg.tokensUsed && <span>Tokens: {msg.tokensUsed}</span>}
                            {msg.latencyMs && <span>耗时: {msg.latencyMs}ms</span>}
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-slate-50/70 flex gap-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  placeholder={`使用 ${selectedModelKey} 发送消息或提示词 (Enter 发送，Shift+Enter 换行)...`}
                  className="flex-1 bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none transition"
                />
                <button
                  type="submit"
                  disabled={loading || !inputText.trim()}
                  className="px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </main>
          </div>
        )}

        {/* ================= TAB 2: Model Matrix ================= */}
        {activeNavTab === 'models' && (
          <div className="ai-catalog flex-1 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">大模型管理矩阵 (Model Matrix)</h2>
                <p className="text-xs text-slate-500 mt-0.5">统一汇聚 29+ 款前沿大语言模型与多模态生成模型</p>
              </div>
              <button
                onClick={() => {
                  setActiveModel(null);
                  setIsModelModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加模型</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map((m) => (
                <div key={m.id} className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-xl p-4 space-y-3 flex flex-col justify-between transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs font-mono">{m.modelName}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-semibold">
                        {m.modelType}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">Key: {m.modelKey}</p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      上下文: {m.contextLength ? `${m.contextLength / 1000}k tokens` : '-'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-emerald-700 font-semibold">{m.tag || '已就绪'}</span>
                    <button
                      onClick={() => {
                        setActiveModel(m);
                        setIsModelModalOpen(true);
                      }}
                      className="text-slate-500 hover:text-blue-600 font-medium cursor-pointer"
                    >
                      编辑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: Providers ================= */}
        {activeNavTab === 'providers' && (
          <div className="ai-catalog flex-1 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">服务商配置 (Providers)</h2>
                <p className="text-xs text-slate-500 mt-0.5">配置大模型调用网关与鉴权 Token</p>
              </div>
              <button
                onClick={() => {
                  setActiveProvider(null);
                  setIsProviderModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加服务商</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((p) => (
                <div key={p.id} className="bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md rounded-xl p-4 space-y-3 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold font-mono">
                      {p.providerKey}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate">{p.baseUrl}</div>
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => {
                        setActiveProvider(p);
                        setIsProviderModalOpen(true);
                      }}
                      className="text-xs text-slate-500 hover:text-blue-600 font-medium cursor-pointer"
                    >
                      编辑配置
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: Logs ================= */}
        {activeNavTab === 'logs' && (
          <div className="ai-catalog flex-1 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">AI 调用审计日志</h2>
              <button onClick={loadLogs} className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer">
                刷新日志
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="p-3">模型 Key</th>
                    <th className="p-3">提示词摘要</th>
                    <th className="p-3">Tokens</th>
                    <th className="p-3">耗时</th>
                    <th className="p-3">状态</th>
                    <th className="p-3 text-right">调用时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {logs.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-blue-700 font-semibold">{l.modelKey}</td>
                      <td className="p-3 text-slate-700 max-w-xs truncate font-sans">{l.promptSnippet}</td>
                      <td className="p-3 text-slate-500">{l.tokensCompletion || l.tokensPrompt || 0}</td>
                      <td className="p-3 text-slate-500">{l.latencyMs}ms</td>
                      <td className="p-3 font-sans">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3 text-right text-slate-400 text-[11px]">{l.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ModelModal
        isOpen={isModelModalOpen}
        model={activeModel}
        loading={modalLoading}
        onClose={() => setIsModelModalOpen(false)}
        onSubmit={async (data) => {
          setModalLoading(true);
          try {
            await aiApi.saveModel(data as any);
            setIsModelModalOpen(false);
            fetchInitialData();
          } finally {
            setModalLoading(false);
          }
        }}
      />

      <ProviderModal
        isOpen={isProviderModalOpen}
        provider={activeProvider}
        loading={modalLoading}
        onClose={() => setIsProviderModalOpen(false)}
        onSubmit={async (data) => {
          setModalLoading(true);
          try {
            await aiApi.saveProvider(data as any);
            setIsProviderModalOpen(false);
            fetchInitialData();
          } finally {
            setModalLoading(false);
          }
        }}
      />

      <ImageViewerModal
        isOpen={!!viewerImage}
        imageUrl={viewerImage || ''}
        onClose={() => setViewerImage(null)}
      />

      <VideoPlayerModal
        isOpen={!!viewerVideo}
        videoUrl={viewerVideo || ''}
        onClose={() => setViewerVideo(null)}
      />
    </div>
  );
};
