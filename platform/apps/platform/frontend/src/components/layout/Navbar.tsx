import React from 'react';
import { Box, Command, Menu, PanelLeftClose, PanelLeftOpen, Plus, Rocket } from 'lucide-react';

interface NavbarProps {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  dockerStatus: { available: boolean; version: string };
  onOpenCreateModal: () => void;
  onOpenDeployModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sidebarCollapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
  dockerStatus,
  onOpenCreateModal,
  onOpenDeployModal,
}) => (
  <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl md:px-6">
    <div className="flex min-w-0 items-center gap-3">
      <button type="button" onClick={onOpenMobileSidebar} aria-label="打开导航菜单" className="icon-button md:hidden">
        <Menu className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onToggleSidebar}
        title={sidebarCollapsed ? '展开侧边栏 (Alt+B)' : '收起侧边栏 (Alt+B)'}
        aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
        className="icon-button hidden md:inline-flex"
      >
        {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-600 shadow-sm">
          <Box className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-extrabold tracking-[-0.02em] text-slate-950">Platform</span>
            <span className="rounded-md border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-indigo-600">CONTROL OS</span>
          </div>
          <p className="hidden text-[10px] font-medium text-slate-400 sm:block">Local infrastructure workspace</p>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <div className="mr-1 hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 lg:flex">
        <span className={`h-2 w-2 rounded-full ${dockerStatus.available ? 'bg-emerald-500 status-pulse' : 'bg-rose-500'}`} />
        <div className="leading-none">
          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">Docker Engine</div>
          <div className={`mt-1 text-[10px] font-semibold ${dockerStatus.available ? 'text-emerald-700' : 'text-rose-600'}`}>
            {dockerStatus.available ? dockerStatus.version || 'Connected' : 'Offline'}
          </div>
        </div>
      </div>
      <button type="button" onClick={onOpenCreateModal} className="secondary-button">
        <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">新建应用</span>
      </button>
      <button type="button" onClick={onOpenDeployModal} className="primary-button">
        <Rocket className="h-3.5 w-3.5" /><span className="hidden sm:inline">快速部署</span>
      </button>
      <div className="hidden items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[10px] text-slate-400 xl:flex">
        <Command className="h-3 w-3" /> Alt+B
      </div>
    </div>
  </header>
);
