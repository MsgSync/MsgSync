import React, { useState, useCallback } from 'react';
import { apiClient } from '../lib/api/client';
import { useMutation, useQuery } from '../hooks/useApi';
import { useNotifications } from '../hooks/useNotifications';

interface OtpServiceScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const OtpServiceScreen: React.FC<OtpServiceScreenProps> = ({ onShowToast }) => {
  const [recipient, setRecipient] = useState('');
  const [length, setLength] = useState(6);
  const [ttl, setTtl] = useState(300);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [recentOtpLogs, setRecentOtpLogs] = useState<Array<{ id: string; time: string; to: string; status: string }>>([]);

  const sendMutation = useMutation();
  const verifyMutation = useMutation();
  const { notifications } = useNotifications();

  const handleSendOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) return;

    try {
      await sendMutation.execute(() => apiClient.sendOtp({ recipient, length, ttl }));
      const newLog = {
        id: `otp-${Date.now()}`,
        time: new Date().toISOString().substring(11, 19),
        to: recipient,
        status: 'SENT',
      };
      setRecentOtpLogs((prev) => [newLog, ...prev.slice(0, 19)]);
      onShowToast(`OTP sent to ${recipient}`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to send OTP', 'error');
    }
  }, [recipient, length, ttl, sendMutation, onShowToast]);

  const handleVerifyOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !verifyCode) return;

    setVerifying(true);
    try {
      await verifyMutation.execute(() => apiClient.verifyOtp({ recipient, code: verifyCode }));
      onShowToast('OTP verified successfully', 'success');
      setVerifyCode('');
      setRecentOtpLogs((prev) => [
        { id: `verify-${Date.now()}`, time: new Date().toISOString().substring(11, 19), to: recipient, status: 'VERIFIED' },
        ...prev.slice(0, 19),
      ]);
    } catch (err: any) {
      onShowToast(err.message || 'Invalid OTP code', 'error');
    } finally {
      setVerifying(false);
    }
  }, [recipient, verifyCode, verifyMutation, onShowToast]);

  return (
    <div className="flex flex-col w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">MESSAGING</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">OTP SERVICE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-5 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#3d494c]">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">key</span>
            <h2 className="text-[15px] font-semibold text-[#dfe2ee]">Send OTP Verification</h2>
          </div>

          <form onSubmit={handleSendOtp} className="space-y-3 text-[12px]">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">Recipient MSISDN</label>
              <input
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                placeholder="+1..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">Code Length</label>
                <input
                  type="number"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">TTL (seconds)</label>
                <input
                  type="number"
                  value={ttl}
                  onChange={(e) => setTtl(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={sendMutation.loading}
              className="w-full py-2 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[13px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50"
            >
              {sendMutation.loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>

          <form onSubmit={handleVerifyOtp} className="space-y-3 text-[12px] mt-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">Verify Code</label>
              <input
                required
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                placeholder="Enter 6-digit code"
              />
            </div>
            <button
              type="submit"
              disabled={verifying || !recipient}
              className="w-full py-2 rounded bg-[#4edea3] text-[#002113] font-semibold text-[13px] hover:opacity-90 transition-all disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        </div>

        <div className="xl:col-span-7 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">history</span>
              <h2 className="text-[15px] font-semibold text-[#dfe2ee]">OTP Verification Log</h2>
            </div>
            <span className="text-[10px] font-code-metric text-[#4edea3]">{recentOtpLogs.length} records</span>
          </div>

          {recentOtpLogs.length === 0 ? (
            <div className="text-center py-8 text-[#869397] text-[13px]">No OTP requests yet. Send an OTP to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-code-metric text-[12px]">
                <thead className="border-b border-[#3d494c] text-[10px] uppercase text-[#869397]">
                  <tr>
                    <th className="pb-2">Log ID</th>
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Recipient</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3d494c]">
                  {recentOtpLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#262a33]/60 transition-colors">
                      <td className="py-2.5 text-[#4cd7f6]">{log.id}</td>
                      <td className="py-2.5 text-[#869397]">{log.time}</td>
                      <td className="py-2.5 text-[#dfe2ee]">{log.to}</td>
                      <td className="py-2.5 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${
                          log.status === 'VERIFIED' ? 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30' :
                          log.status === 'SENT' ? 'bg-[#4cd7f6]/15 text-[#4cd7f6] border-[#4cd7f6]/30' :
                          'bg-[#ffb4ab]/15 text-[#ffb4ab] border-[#ffb4ab]/30'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
