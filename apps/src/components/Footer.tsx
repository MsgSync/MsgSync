import React, { useState, useEffect } from 'react';

export const Footer: React.FC = () => {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      const ms = String(now.getUTCMilliseconds()).padStart(3, '0');
      setTimeString(`UTC ${hours}:${minutes}:${seconds}.${ms}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 h-8 bg-[#0a0e16] border-t border-[#3d494c] px-5 flex items-center justify-between text-[#bcc9cd] font-code-metric text-[12px] select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#4cd7f6] text-[14px]">cloud_done</span>
          <span className="text-[#869397]">Cluster:</span>
          <span className="text-[#dfe2ee]">AWS us-east-1a / eu-west-1b (Active-Active)</span>
        </div>
        <span className="text-[#3d494c]">|</span>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#4edea3] text-[14px]">lan</span>
          <span className="text-[#869397]">Protocols:</span>
          <span className="text-[#dfe2ee]">
            SMPP 3.4 <span className="text-[#4edea3]">(BIND OK)</span> • SIGTRAN M3UA{' '}
            <span className="text-[#4edea3]">(AS ACTIVE)</span> • REST v2.4
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#4edea3] text-[14px]">speed</span>
          <span className="text-[#869397]">Latency:</span>
          <span className="text-[#4edea3] font-semibold">14ms p99</span>
        </div>
        <span className="text-[#3d494c]">|</span>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[#869397] text-[14px]">schedule</span>
          <span className="text-[#4cd7f6] font-semibold tabular-nums">{timeString}</span>
        </div>
      </div>
    </footer>
  );
};
