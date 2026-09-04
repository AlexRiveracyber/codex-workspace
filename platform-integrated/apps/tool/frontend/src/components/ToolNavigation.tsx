import React, { useEffect, useRef, useState } from 'react';
import { Binary, ShieldCheck, FileCode2, Clock, Globe, GitCompare, Palette, BookOpen, Bookmark, CalendarDays, ChevronDown, ChevronRight } from 'lucide-react';

export const toolCategories = [
  { id: 'codec', label: '编码与转换', desc: 'Base64 / URL / JWT / 进制 / Unicode', icon: Binary },
  { id: 'crypto', label: '加解密与安全', desc: 'MD5 / SHA / SM3、AES / SM4、RSA、随机 ID', icon: ShieldCheck },
  { id: 'format_code', label: '格式化与代码生成', desc: 'JSON / YAML、JSON 转 Java / TS、SQL 转实体', icon: FileCode2 },
  { id: 'time_cron', label: '时间与调度中心', desc: '时间戳转换、多时区、Cron 预测', icon: Clock },
  { id: 'calendar', label: '万年历', desc: '公历 / 农历、法定节假日与调休安排', icon: CalendarDays },
  { id: 'network', label: '网络与接口调试', desc: 'HTTP 请求客户端、端口探活、CIDR 计算', icon: Globe },
  { id: 'text_regex', label: '文本与正则差异', desc: '代码 Diff 对比、正则测试、命名转换', icon: GitCompare },
  { id: 'visual_color', label: '视觉与设计辅助', desc: '拾色器、HEX / RGB 转换、URL 转二维码与解析', icon: Palette },
  { id: 'cheat_sheet', label: '常用速查手册', desc: 'HTTP 状态码、Linux / Docker / Git 速查', icon: BookOpen },
  { id: 'snippets', label: '代码片段管理', desc: '个人常用代码库与模板', icon: Bookmark },
];

const groups = [
  { id: 'data', label: '编码与数据', categories: ['codec', 'crypto', 'format_code'] },
  { id: 'debug', label: '时间与网络', categories: ['time_cron', 'calendar', 'network'] },
  { id: 'design', label: '文本与设计', categories: ['text_regex', 'visual_color'] },
  { id: 'reference', label: '开发参考', categories: ['cheat_sheet', 'snippets'] },
];

export const ToolNavigation: React.FC<{ activeCategory: string; onSelect: (id: string) => void }> = ({ activeCategory, onSelect }) => {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const hoverOpened = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const cancelClose = () => clearTimeout(closeTimer.current);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenGroup(null);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      clearTimeout(closeTimer.current);
    };
  }, []);

  const selectCategory = (id: string) => {
    cancelClose();
    onSelect(id);
    setOpenGroup(null);
    if (openGroup) triggerRefs.current[openGroup]?.focus();
  };

  return (
    <nav
      ref={navRef}
      className="tool-navigation"
      aria-label="工具分类导航"
      onPointerEnter={cancelClose}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse' && !navRef.current?.contains(document.activeElement)) {
          closeTimer.current = setTimeout(() => setOpenGroup(null), 180);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpenGroup(null);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && openGroup) {
          event.preventDefault();
          triggerRefs.current[openGroup]?.focus();
          setOpenGroup(null);
        }
      }}
    >
      <div className="tool-navigation-tabs">
        {groups.map((group) => {
          const isOpen = openGroup === group.id;
          const isActive = group.categories.includes(activeCategory);
          return (
            <button
              key={group.id}
              ref={(element) => { triggerRefs.current[group.id] = element; }}
              id={`tool-trigger-${group.id}`}
              type="button"
              className={`tool-navigation-trigger${isOpen ? ' is-open' : ''}${isActive ? ' is-active' : ''}`}
              aria-expanded={isOpen}
              aria-controls={`tool-dropdown-${group.id}`}
              onClick={() => {
                cancelClose();
                setOpenGroup(isOpen && !hoverOpened.current ? null : group.id);
                hoverOpened.current = false;
              }}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') {
                  cancelClose();
                  hoverOpened.current = openGroup !== group.id;
                  setOpenGroup(group.id);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  hoverOpened.current = false;
                  setOpenGroup(group.id);
                  requestAnimationFrame(() => navRef.current?.querySelector<HTMLButtonElement>(`#tool-dropdown-${group.id} button`)?.focus());
                }
              }}
            >
              {group.label}<ChevronDown aria-hidden="true" size={14} />
            </button>
          );
        })}
      </div>
      {groups.map((group) => (
        <div
          key={group.id}
          id={`tool-dropdown-${group.id}`}
          className="tool-dropdown"
          hidden={openGroup !== group.id}
          aria-labelledby={`tool-trigger-${group.id}`}
        >
          <div className="tool-dropdown-grid">
            {toolCategories.filter((item) => group.categories.includes(item.id)).map((item) => (
              <button
                key={item.id}
                type="button"
                className={`tool-dropdown-item${activeCategory === item.id ? ' is-current' : ''}`}
                aria-current={activeCategory === item.id ? 'page' : undefined}
                onClick={() => selectCategory(item.id)}
              >
                <span className="tool-dropdown-label">{item.label}<ChevronRight aria-hidden="true" size={18} /></span>
                <span className="tool-dropdown-description">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
};
