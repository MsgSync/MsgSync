import React, { useState, useEffect } from 'react';
import { ScreenId } from '../types';

interface HeaderProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onOpenSearch: () => void;
  onToggleTerminal: () => void;
  onToggleNotifications: () => void;
  unreadCount: number;
  userName?: string | null;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  onOpenSearch,
  onToggleTerminal,
  onToggleNotifications,
  unreadCount,
  userName,
  onLogout,
}) => {
  const [mps, setMps] = useState(1287);
  const [tenant, setTenant] = useState('GlobalTel Direct (Tier-1)');
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [region, setRegion] = useState<'PROD-US-EAST-1' | 'PROD-EU-WEST-1' | 'PROD-AP-SE-1'>('PROD-US-EAST-1');
  const [syncing, setSyncing] = useState(false);

  // Live slight MPS fluctuation for realism
  useEffect(() => {
    const interval = setInterval(() => {
      setMps((prev) => {
        const delta = Math.floor(Math.random() * 19) - 9;
        const next = prev + delta;
        return next < 1240 ? 1255 : next > 1340 ? 1320 : next;
      });
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  const handleSyncRegion = () => {
    setSyncing(true);
    setTimeout(() => {
      setRegion((prev) =>
        prev === 'PROD-US-EAST-1' ? 'PROD-EU-WEST-1' : prev === 'PROD-EU-WEST-1' ? 'PROD-AP-SE-1' : 'PROD-US-EAST-1'
      );
      setSyncing(false);
    }, 450);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#181c24]/90 backdrop-blur-2xl border-b border-[#3d494c] flex items-center justify-between px-4 sm:px-5 shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
      {/* Left: Brand & Tenant selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 text-left focus:outline-none group"
        >
          <img
            alt="MsgSync Brand Logo"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            src="https://lh3.googleusercontent.com/aida/AEtjO1XbuBmz4SY3z5PzFKn38JwlD40rv8Z81YeWw8JzKMqsS0kfO0ceXYq2mn-vQeYk8ksJisfD5Z_as_RdvSe3lh5ObpvpBm-RvalsMKwqQt06R2fIOpe25FpeVjRI-oWa0cqZGfQC6Oqhg0KlaBHGjCn-rnWxlx_yrvc3a-hPISXhK-cO_dADQ2A4tQV9gNeMaoXdJYinWTqV3kxY1M3AEzrcLQ-0jl1zSkiYfVu-U8Hx"
          />
          <span className="text-[20px] font-semibold text-[#4cd7f6] tracking-tight">MsgSync</span>
          <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#262a33] text-[#4cd7f6] border border-[#3d494c]">
            NOC CONSOLE
          </span>
        </button>

        <div className="h-5 w-px bg-[#3d494c]"></div>

        {/* Tenant selector dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowTenantMenu(!showTenantMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1c2028] text-[#dfe2ee] hover:bg-[#262a33] transition-colors text-[13px] border border-[#3d494c]"
          >
            <span className="material-symbols-outlined text-[#4cd7f6] text-[16px]">domain</span>
            <span className="text-[14px] font-semibold text-[#dfe2ee]">{tenant}</span>
            <span className="material-symbols-outlined text-[#bcc9cd] text-[16px]">expand_more</span>
          </button>

          {showTenantMenu && (
            <div className="absolute top-full left-0 mt-1 w-64 rounded bg-[#1c2028] border border-[#3d494c] shadow-2xl z-50 py-1 font-body-sm text-[12px]">
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#869397] border-b border-[#3d494c]/60">
                Switch Telecom Tenant
              </div>
              {[
                { name: 'GlobalTel Direct (Tier-1)', status: 'Active Carrier License' },
                { name: 'PacificWave Transit Global', status: 'Wholesale Trunking' },
                { name: 'Apex Telecom Europe S.A.', status: 'Direct MVNO Interconnect' },
              ].map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    setTenant(t.name);
                    setShowTenantMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-[#262a33] flex flex-col ${
                    tenant === t.name ? 'bg-[#06b6d4]/15 text-[#4cd7f6]' : 'text-[#dfe2ee]'
                  }`}
                >
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-[10px] text-[#869397]">{t.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cluster Region Tag */}
        <button
          onClick={handleSyncRegion}
          title="Click to cycle active carrier region"
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#0a0e16] border border-[#3d494c] hover:border-[#4cd7f6]/50 transition-colors"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4edea3]"></span>
          </span>
          <span className="font-code-metric text-[12px] text-[#4edea3] font-semibold">{region}</span>
          <span className={`material-symbols-outlined text-[#bcc9cd] text-[14px] ${syncing ? 'animate-spin text-[#4cd7f6]' : ''}`}>
            sync
          </span>
        </button>
      </div>

      {/* Middle: Quick Search & Telemetry KPIs */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl mx-4">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-[#869397]">search</span>
          <input
            onClick={onOpenSearch}
            readOnly
            className="w-full h-8 pl-8 pr-12 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] placeholder:text-[#869397] text-[12px] cursor-pointer hover:border-[#4cd7f6]/50 focus:outline-none focus:border-[#4cd7f6]"
            placeholder="⌘K Quick search messages, point codes, MSISDN, providers..."
            type="text"
          />
          <kbd className="absolute right-2 top-1.5 px-1.5 py-0.5 rounded bg-[#1c2028] text-[#869397] text-[10px] font-code-metric border border-[#3d494c]">
            ⌘K
          </kbd>
        </div>

        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded bg-[#0a0e16] border border-[#3d494c] text-[#bcc9cd] font-code-metric text-[12px] whitespace-nowrap">
          <span className="text-[#869397]">System MPS:</span>
          <span className="text-[#4cd7f6] font-semibold tabular-nums">{mps.toLocaleString()}</span>
          <span className="text-[#3d494c]">|</span>
          <span className="text-[#869397]">DLR Rate:</span>
          <span className="text-[#4edea3] font-semibold">99.98%</span>
          <span className="text-[#3d494c]">|</span>
          <span className="text-[#869397]">BullMQ:</span>
          <span className="text-[#dfe2ee] font-semibold">0 lag</span>
        </div>
      </div>

      {/* Right: NOC Stream status, Notifications, Terminal & User Profile */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0a0e16] border border-[#3d494c] text-[#4edea3] font-code-metric text-[12px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3]"></span>
          <span className="hidden sm:inline">NOC STREAM: CONNECTED</span>
          <span className="sm:hidden">ONLINE</span>
        </div>

        <button
          onClick={onToggleNotifications}
          aria-label="Notifications"
          className="relative p-1.5 rounded bg-[#1c2028] text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33] transition-colors border border-[#3d494c]"
        >
          <span className="material-symbols-outlined text-[18px]">notifications</span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4cd7f6] text-[#003640] text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={onToggleTerminal}
          aria-label="Carrier CLI Terminal"
          title="Open Carrier Telecom CLI"
          className="p-1.5 rounded bg-[#1c2028] text-[#bcc9cd] hover:text-[#dfe2ee] hover:bg-[#262a33] transition-colors border border-[#3d494c]"
        >
          <span className="material-symbols-outlined text-[18px]">terminal</span>
        </button>

        {/* User profile toggle */}
        <button
          onClick={() => onNavigate('iam-security')}
          className="flex items-center gap-2 pl-1.5 py-0.5 rounded hover:bg-[#262a33] transition-colors focus:outline-none group text-left"
        >
          <img
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover border border-[#3d494c] group-hover:border-[#4cd7f6] transition-colors"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrH8s-pLSUEYJ4VYVjCsv0AmkomG7LtLjhDN8bo9amympnQUXeGcvndkl4nllATsIvDywaUVb3H7cYvk0xRkr1JSIhUFCu5PAzPOiXHi0BZyayjSw7oHrSGdk_X20J7FXPHUYXB7oFbaZKaaCIhuqxPHQK0Kk70UqYX7tszTWhzTPohqwPxxR_F7Akewm37dvSGBqorJRfL057dYGSknuIqHfPEYdeMm_iherSf4Y"
          />
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-[13px] text-[#dfe2ee] font-semibold leading-tight group-hover:text-[#4cd7f6] transition-colors">
              {userName || 'Marcus Vance'}
            </span>
            <span className="text-[10px] text-[#bcc9cd]">{userName ? 'Operator' : 'VP Infrastructure'}</span>
          </div>
          {onLogout && (
            <button
              onClick={(e) => { e.stopPropagation(); onLogout(); }}
              className="ml-1 px-1.5 py-0.5 rounded bg-[#262a33] text-[#ffb4ab] border border-[#ffb4ab]/30 text-[9px] font-semibold hover:bg-[#ffb4ab]/15 transition-colors"
              title="Logout"
            >
              LOGOUT
            </button>
          )}
        </button>
      </div>
    </header>
  );
};
