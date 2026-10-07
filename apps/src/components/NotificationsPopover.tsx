import React from 'react';
import { NotificationItem } from '../types';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClear: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClear,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-14 right-16 z-50 w-96 rounded-lg bg-[#1c2028] border border-[#3d494c] shadow-2xl overflow-hidden font-body-sm animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#181c24] border-b border-[#3d494c]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#4cd7f6] text-[18px]">notifications</span>
          <span className="font-semibold text-[13px] text-[#dfe2ee]">Carrier Network Alerts</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#00424f] text-[#4cd7f6] font-code-metric">
            {notifications.filter((n) => !n.read).length} Unread
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <button
            onClick={onMarkAllRead}
            className="text-[#4cd7f6] hover:underline"
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            className="text-[#869397] hover:text-[#dfe2ee]"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-[#3d494c]/60">
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-[#869397] text-[12px]">
            No pending NOC alerts. All carrier systems nominal.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3 hover:bg-[#262a33] transition-colors ${
                !n.read ? 'bg-[#06b6d4]/5' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-[13px] text-[#dfe2ee] flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      n.type === 'critical'
                        ? 'bg-[#ffb4ab]'
                        : n.type === 'warning'
                        ? 'bg-[#d0bcff]'
                        : 'bg-[#4edea3]'
                    }`}
                  ></span>
                  {n.title}
                </span>
                <span className="text-[10px] text-[#869397] font-code-metric shrink-0">{n.time}</span>
              </div>
              <p className="text-[12px] text-[#bcc9cd] pl-3.5 leading-relaxed">{n.desc}</p>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-2 bg-[#0a0e16] border-t border-[#3d494c] flex items-center justify-between text-[11px] text-[#869397]">
        <span>SLA PagerDuty Synchronized</span>
        <button onClick={onClear} className="hover:text-[#ffb4ab]">
          Clear history
        </button>
      </div>
    </div>
  );
};
