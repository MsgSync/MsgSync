import React from 'react';
import { ScreenId } from '../types';
import { SCREEN_METADATA, getScreenMetadata } from '../types';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  activeSmppCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentScreen, onNavigate, activeSmppCount }) => {
  const isNavActive = (id: ScreenId) => currentScreen === id;

  const getLinkClasses = (active: boolean) =>
    `flex items-center justify-between px-2.5 py-1.5 rounded transition-all text-[12px] ${
      active
        ? 'bg-[#06b6d4]/12 text-[#4cd7f6] font-semibold shadow-[inset_2px_0_0_#4cd7f6,0_0_8px_rgba(6,182,212,0.12)]'
        : 'text-[#bcc9cd] hover:bg-[#262a33] hover:text-[#dfe2ee]'
    }`;

  const sections = Array.from(new Set(SCREEN_METADATA.map((m) => m.section)));

  return (
    <aside className="fixed left-0 top-14 bottom-8 w-64 bg-[#181c24] border-r border-[#3d494c] z-40 flex flex-col justify-between overflow-y-auto select-none">
      <div className="p-3 space-y-4">
        {sections.map((section) => (
          <div key={section}>
            <div className="px-2 py-1">
              <span className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold">{section}</span>
            </div>
            <nav className="flex flex-col gap-0.5">
              {SCREEN_METADATA.filter((m) => m.section === section).map((metadata) => {
                const isActive = isNavActive(metadata.id);
                const isLive = metadata.id === 'live-monitor';
                return (
                  <button
                    key={metadata.id}
                    onClick={() => onNavigate(metadata.id)}
                    className={getLinkClasses(isActive)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">{metadata.icon}</span>
                      <span>{metadata.label}</span>
                    </div>
                    {isLive && (
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/40 font-code-metric">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                        LIVE
                      </span>
                    )}
                    {metadata.id === 'smpp-connections' && (
                      <span className={`font-code-metric text-[10px] px-1.5 py-0.5 rounded border ${
                        isActive ? 'bg-[#00424f] text-[#4edea3] border-[#00424f]' : 'bg-[#1c2028] text-[#4edea3] border-[#3d494c]'
                      }`}>
                        {activeSmppCount} active
                      </span>
                    )}
                    {metadata.id === 'iam-security' && (
                      <span className="text-[9px] px-1 py-0.5 rounded font-code-metric border bg-[#262a33] text-[#bcc9cd] border-[#3d494c]">HSM</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[#3d494c] bg-[#0a0e16]">
        <div className="flex items-center justify-between text-[10px] text-[#869397]">
          <span className="uppercase tracking-wider font-semibold">NOC ENGINE V4.8.2</span>
          <span className="text-[#4edea3] font-code-metric flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3]"></span>
            ALL NODES UP
          </span>
        </div>
      </div>
    </aside>
  );
};
