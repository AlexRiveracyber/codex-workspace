import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Boxes, CheckSquare2, Container, LayoutDashboard,
  BookOpen, ScrollText, Settings, Sparkles, Store, Wrench, X,
} from 'lucide-react';

interface SidebarProps {
  appCount: number;
  collapsed: boolean;
  mobileOpen: boolean;
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
  { to: '/dashboard', label: '运行总览', icon: LayoutDashboard, exact: true },
  { to: '/apps', label: '应用服务', icon: Boxes },
  { to: '/containers', label: '容器资源', icon: Container },
  { to: '/templates', label: '模板市场', icon: Store },
];
const subAppNav: NavItem[] = [
  { to: '/documents', label: '文档中心', icon: BookOpen, accent: 'bg-amber-300' },
  { to: '/subapps/task', label: 'Task Flow', icon: CheckSquare2, accent: 'bg-rose-300', port: '3002' },
  { to: '/subapps/ai', label: 'Lumen AI', icon: Sparkles, accent: 'bg-indigo-300', port: '3003' },
  { to: '/subapps/tool', label: 'DevTools', icon: Wrench, accent: 'bg-emerald-300', port: '3004' },
];
const sysNav: NavItem[] = [
  { to: '/logs', label: '操作审计', icon: ScrollText },
  { to: '/settings', label: '系统设置', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ appCount, collapsed, mobileOpen, onMobileClose }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    onMobileClose();
  }, [pathname]);

  const renderItems = (items: NavItem[]) => items.map((item) => {
    const Icon = item.icon;
    const badge = item.to === '/apps' && appCount > 0 ? String(appCount) : item.badge;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.exact}
        title={collapsed ? `${item.label}${item.port ? ` · :${item.port}` : ''}` : undefined}
        className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative shrink-0">
            <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
            {item.accent && <span className={`absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full ring-2 ring-slate-100 ${item.accent}`} />}
          </span>
          {!collapsed && <span className="truncate">{item.label}</span>}
        </div>
        {!collapsed && badge && <span className="rounded-md bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-500">{badge}</span>}
      </NavLink>
    );
  });

  return (
    <>
      {mobileOpen && <button type="button" aria-label="关闭导航菜单" className="fixed inset-0 z-40 bg-slate-500/25 backdrop-blur-sm md:hidden" onClick={onMobileClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-slate-100 text-slate-600 shadow-xl transition-all duration-300 md:relative md:z-20 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'md:w-[76px]' : 'w-[248px] md:w-[248px]'}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4 md:hidden">
          <span className="text-sm font-extrabold text-slate-700">导航中心</span>
          <button type="button" onClick={onMobileClose} aria-label="关闭导航菜单" className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>
        <div className={`flex-1 space-y-6 overflow-y-auto overflow-x-hidden py-5 ${collapsed ? 'px-2.5' : 'px-3'}`}>
          <nav>{!collapsed && <p className="sidebar-label">Workspace</p>}<div className="space-y-1">{renderItems(mainNav)}</div></nav>
          <nav>
            {!collapsed && <div className="mb-2 flex items-center justify-between px-3"><p className="sidebar-label !mb-0 !px-0">Studios</p><span className="text-[9px] font-bold text-slate-500">4 APPS</span></div>}
            <div className="space-y-1">{renderItems(subAppNav)}</div>
          </nav>
          <nav>{!collapsed && <p className="sidebar-label">System</p>}<div className="space-y-1">{renderItems(sysNav)}</div></nav>
        </div>
        <div className={`border-t border-slate-200 p-3 ${collapsed ? 'px-2.5' : ''}`}>
          {!collapsed && (
            <div className="mb-3 rounded-xl border border-slate-200 bg-white/60 p-3">
              <div className="flex items-center justify-between text-[10px]"><span className="font-semibold text-slate-600">本地工作区</span><span className="text-emerald-700">安全</span></div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-3/4 rounded-full bg-slate-400" /></div>
              <p className="mt-2 text-[9px] leading-relaxed text-slate-500">服务、容器与审计数据仅保存在本机环境</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
