import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AppModal } from './components/apps/AppModal';
import { DeployModal } from './components/apps/DeployModal';
import { LogModal } from './components/apps/LogModal';
import { StatsModal } from './components/apps/StatsModal';
import { ImportContainerModal } from './components/apps/ImportContainerModal';

import { DashboardPage } from './pages/DashboardPage';
import { AppsPage } from './pages/AppsPage';
import { ContainersPage } from './pages/ContainersPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SubAppEmbedPage } from './pages/SubAppEmbedPage';

import { dockerApi, appsApi, templatesApi } from './api';
import type { ManagedApp, AppTemplate, DockerContainer } from './types';

export const App: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('platform_sidebar_collapsed') === 'true';
  });

  const [dockerStatus, setDockerStatus] = useState({ available: false, version: '' });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [dataRevision, setDataRevision] = useState(0);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [appCount, setAppCount] = useState(0);
  const [templates, setTemplates] = useState<AppTemplate[]>([]);

  // Modals state
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [activeApp, setActiveApp] = useState<ManagedApp | null>(null);
  const [activeContainer, setActiveContainer] = useState<DockerContainer | null>(null);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('platform_sidebar_collapsed', String(next));
      return next;
    });
  }, []);

  const fetchGlobalStatus = async () => {
    try {
      const [status, apps, tpls] = await Promise.all([
        dockerApi.getStatus().catch(() => ({ available: false, version: 'Offline' })),
        appsApi.getAll().catch(() => []),
        templatesApi.getAll().catch(() => []),
      ]);
      setDockerStatus(status);
      setAppCount(apps.length);
      setTemplates(tpls);
    } catch (e) {
      console.error('Status fetch error', e);
    }
  };

  const showNotice = useCallback((type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 3600);
  }, []);

  const syncWorkspace = useCallback(async () => {
    await fetchGlobalStatus();
    setDataRevision((value) => value + 1);
  }, []);

  useEffect(() => {
    fetchGlobalStatus();
  }, []);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [toggleSidebar]);

  const handleOpenCreateModal = () => {
    setActiveApp(null);
    setIsEditMode(false);
    setIsAppModalOpen(true);
  };

  const handleOpenDeployModal = () => {
    setIsDeployModalOpen(true);
  };

  const handleEditApp = (app: ManagedApp) => {
    setActiveApp(app);
    setIsEditMode(true);
    setIsAppModalOpen(true);
  };

  const handleViewLogs = (app: ManagedApp) => {
    setActiveApp(app);
    setIsLogModalOpen(true);
  };

  const handleViewStats = (app: ManagedApp) => {
    setActiveApp(app);
    setIsStatsModalOpen(true);
  };

  const handleImportContainer = (container: DockerContainer) => {
    setActiveContainer(container);
    setIsImportModalOpen(true);
  };

  const handleDeployTemplate = (_template: AppTemplate) => {
    setIsDeployModalOpen(true);
  };

  const handleDeleteApp = async (app: ManagedApp) => {
    const rmContainer = confirm(
      `是否同时在 Docker 中销毁容器实例【${app.containerName || app.name}】？\n点击【确定】销毁容器，点击【取消】仅从平台中移除管理`
    );
    try {
      await appsApi.delete(app.id, rmContainer);
      await syncWorkspace();
      showNotice('success', `已移除应用「${app.name}」`);
    } catch (e: any) {
      showNotice('error', '删除应用失败：' + e.message);
    }
  };

  const handleAppFormSubmit = async (formData: Partial<ManagedApp>) => {
    setModalLoading(true);
    try {
      if (isEditMode && activeApp) {
        await appsApi.update(activeApp.id, formData);
      } else {
        await appsApi.create(formData);
      }
      setIsAppModalOpen(false);
      await syncWorkspace();
      showNotice('success', isEditMode ? '应用配置已更新' : '应用已加入工作区');
    } catch (e: any) {
      showNotice('error', '保存失败：' + e.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeploySubmit = async (deployData: any) => {
    setModalLoading(true);
    try {
      await templatesApi.deploy(deployData);
      setIsDeployModalOpen(false);
      await syncWorkspace();
      showNotice('success', '部署任务已提交，正在准备容器');
    } catch (e: any) {
      showNotice('error', '部署失败：' + e.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleImportSubmit = async (importData: any) => {
    setModalLoading(true);
    try {
      await dockerApi.importContainer(importData);
      setIsImportModalOpen(false);
      await syncWorkspace();
      showNotice('success', '容器已纳入平台管理');
    } catch (e: any) {
      showNotice('error', '导入失败：' + e.message);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-[var(--workspace)] text-slate-800 selection:bg-indigo-500 selection:text-white">
        {/* Top Navbar */}
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          dockerStatus={dockerStatus}
          onOpenCreateModal={handleOpenCreateModal}
          onOpenDeployModal={handleOpenDeployModal}
        />

        {/* Main Body Container: Sidebar + Content Area */}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar
            appCount={appCount}
            collapsed={sidebarCollapsed}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />

          {/* Main Content Workspace (Fluid width for laptops) */}
          <main className="workspace-bg min-w-0 flex-1 overflow-y-auto p-4 md:p-7">
            <div className="mx-auto w-full max-w-[1500px]">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="/dashboard"
                  element={
                    <DashboardPage
                      revision={dataRevision}
                      onViewLogs={handleViewLogs}
                      onViewStats={handleViewStats}
                      onEdit={handleEditApp}
                      onDelete={handleDeleteApp}
                    />
                  }
                />
                <Route
                  path="/apps"
                  element={
                    <AppsPage
                      revision={dataRevision}
                      onOpenCreateModal={handleOpenCreateModal}
                      onOpenDeployModal={handleOpenDeployModal}
                      onViewLogs={handleViewLogs}
                      onViewStats={handleViewStats}
                      onEdit={handleEditApp}
                      onDelete={handleDeleteApp}
                    />
                  }
                />
                <Route
                  path="/containers"
                  element={<ContainersPage revision={dataRevision} onImport={handleImportContainer} />}
                />
                <Route
                  path="/templates"
                  element={<TemplatesPage onDeployTemplate={handleDeployTemplate} />}
                />
                <Route
                  path="/subapps/task"
                  element={<SubAppEmbedPage appType="task" />}
                />
                <Route
                  path="/subapps/ai"
                  element={<SubAppEmbedPage appType="ai" />}
                />
                <Route
                  path="/subapps/tool"
                  element={<SubAppEmbedPage appType="tool" />}
                />
                <Route path="/subapps/document" element={<SubAppEmbedPage appType="document" />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </main>
        </div>

        {/* Global Modals */}
        <AppModal
          isOpen={isAppModalOpen}
          isEdit={isEditMode}
          app={activeApp}
          loading={modalLoading}
          onClose={() => setIsAppModalOpen(false)}
          onSubmit={handleAppFormSubmit}
        />

        <DeployModal
          isOpen={isDeployModalOpen}
          templates={templates}
          loading={modalLoading}
          onClose={() => setIsDeployModalOpen(false)}
          onDeploy={handleDeploySubmit}
        />

        <LogModal
          isOpen={isLogModalOpen}
          app={activeApp}
          onClose={() => setIsLogModalOpen(false)}
        />

        <StatsModal
          isOpen={isStatsModalOpen}
          app={activeApp}
          onClose={() => setIsStatsModalOpen(false)}
        />

        <ImportContainerModal
          isOpen={isImportModalOpen}
          container={activeContainer}
          loading={modalLoading}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportSubmit}
        />

        {notice && (
          <div
            role="status"
            className={`fixed bottom-5 right-5 z-[80] flex max-w-sm items-start gap-3 rounded-2xl border bg-white p-4 shadow-2xl shadow-slate-950/15 ${notice.type === 'success' ? 'border-emerald-200' : 'border-rose-200'}`}
          >
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${notice.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {notice.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-slate-900">{notice.type === 'success' ? '操作完成' : '操作未完成'}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{notice.message}</p>
            </div>
            <button type="button" onClick={() => setNotice(null)} aria-label="关闭通知" className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </BrowserRouter>
  );
};
