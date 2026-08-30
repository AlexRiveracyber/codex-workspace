import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Boxes, CheckSquare2, ChevronLeft, ChevronRight, Container, LayoutDashboard,
  ScrollText, Settings, Sparkles, Store, Wrench, X,
} from 'lucide-react';

interface SidebarProps {
  appCount: number;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
}

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: string;
  accent?: string;
  port?: string;
};

const mainNav: NavItem[] = [
  { to: '/', label: '运行总览', icon: LayoutDashboard, exact: true },
  { to: '/apps', label: '应用服务', icon: Boxes },
  { to: '/containers', label: '容器资源', icon: Container },
  { to: '/templates', label: '模板市场', icon: Store },
];
const subAppNav: NavItem[] = [
  { to: '/subapps/task', label: 'Task Flow', icon: CheckSquare2, accent: 'bg-emerald-400', port: '3002' },
  { to: '/subapps/ai', label: 'Lumen AI', icon: Sparkles, accent: 'bg-violet-400', port: '3003' },
  { to: '/subapps/tool', label: 'DevTools', icon: Wrench, accent: 'bg-sky-400', port: '3004' },
];
const sysNav: NavItem[] = [
  { to: '/logs', label: '操作审计', icon: ScrollText },
  { to: '/settings', label: '系统设置', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ appCount, collapsed, mobileOpen, onToggle, onMobileClose }) => {
  const renderItems = (items: NavItem[]) => items.map((item) => {
    const Icon = item.icon;
    const badge = item.to === '/apps' && appCount > 0 ? String(appCount) : item.badge;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.exact}
        onClick={onMobileClose}
        title={collapsed ? `${item.label}${item.port ? ` · :${item.port}` : ''}` : undefined}
        className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative shrink-0">
            <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
            {item.accent && <span className={`absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full ring-2 ring-slate-950 ${item.accent}`} />}
          </span>
          {!collapsed && <span className="truncate">{item.label}</span>}
        </div>
        {!collapsed && badge && <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">{badge}</span>}
      </NavLink>
    );
  });

  return (
    <>
      {mobileOpen && <button type="button" aria-label="关闭导航菜单" className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm md:hidden" onClick={onMobileClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/5 bg-slate-950 text-slate-300 shadow-2xl transition-all duration-300 md:relative md:z-20 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'md:w-[76px]' : 'w-[248px] md:w-[248px]'}`}>
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-4 md:hidden">
          <span className="text-sm font-extrabold text-white">导航中心</span>
          <button type="button" onClick={onMobileClose} aria-label="关闭导航菜单" className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className={`flex-1 space-y-6 overflow-y-auto overflow-x-hidden py-5 ${collapsed ? 'px-2.5' : 'px-3'}`}>
          <nav>{!collapsed && <p className="sidebar-label">Workspace</p>}<div className="space-y-1">{renderItems(mainNav)}</div></nav>
          <nav>
            {!collapsed && <div className="mb-2 flex items-center justify-between px-3"><p className="sidebar-label !mb-0 !px-0">Studios</p><span className="text-[9px] font-bold text-emerald-400">3 ONLINE</span></div>}
            <div className="space-y-1">{renderItems(subAppNav)}</div>
          </nav>
          <nav>{!collapsed && <p className="sidebar-label">System</p>}<div className="space-y-1">{renderItems(sysNav)}</div></nav>
        </div>
        <div className={`border-t border-white/5 p-3 ${collapsed ? 'px-2.5' : ''}`}>
          {!collapsed && (
            <div className="mb-3 rounded-xl border border-white/5 bg-white/[0.035] p-3">
              <div className="flex items-center justify-between text-[10px]"><span className="font-semibold text-slate-300">本地工作区</span><span className="text-emerald-400">安全</span></div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-3/4 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400" /></div>
              <p className="mt-2 text-[9px] leading-relaxed text-slate-500">服务、容器与审计数据仅保存在本机环境</p>
            </div>
          )}
          <button type="button" onClick={onToggle} className={`hidden w-full items-center rounded-lg py-2 text-[11px] text-slate-500 transition hover:bg-white/5 hover:text-slate-200 md:flex ${collapsed ? 'justify-center' : 'justify-between px-3'}`}>
            {!collapsed && <span>收起导航</span>}
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
};
