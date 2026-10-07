import React, { useState } from 'react';

interface MessageCenterScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const MessageCenterScreen: React.FC<MessageCenterScreenProps> = ({ onShowToast }) => {
  const [recipient, setRecipient] = useState('+12025550194');
  const [senderId, setSenderId] = useState('GlobalTel');
  const [messageBody, setMessageBody] = useState('Your MsgSync one-time verification passcode is 849201. Valid for 5 minutes.');
  const [isSending, setIsSending] = useState(false);
  const [testResults, setTestResults] = useState<Array<{ id: string; time: string; to: string; status: string; latency: number }>>([
    { id: 'msg-7f3b9a-4101', time: '14:31:02', to: '+12025550194', status: 'DELIVRD', latency: 12 },
    { id: 'msg-c029e4-8891', time: '14:28:19', to: '+447911123456', status: 'DELIVRD', latency: 18 },
    { id: 'msg-55f10a-2204', time: '14:15:44', to: '+491512345678', status: 'DELIVRD', latency: 22 },
  ]);

  const handleSendTestSms = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    onShowToast(`Submitting SMPP SUBMIT_SM packet for ${recipient}...`, 'info');

    setTimeout(() => {
      const newMsg = {
        id: `msg-${Math.random().toString(36).substring(2, 8)}-${Date.now().toString().slice(-4)}`,
        time: new Date().toISOString().substring(11, 19),
        to: recipient,
        status: 'DELIVRD',
        latency: Math.floor(Math.random() * 8) + 11,
      };
      setTestResults([newMsg, ...testResults]);
      setIsSending(false);
      onShowToast(`SMS dispatched and DELIVRD receipt received in ${newMsg.latency}ms.`, 'success');
    }, 700);
  };

  return (
    <div className="flex flex-col w-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">MESSAGING</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">MESSAGE CENTER &amp; CARRIER SUBMISSION TESTER</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* SMS Submission Form (5 cols) */}
        <div className="xl:col-span-5 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-[#3d494c]">
            <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">send</span>
            <h2 className="text-[15px] font-semibold text-[#dfe2ee]">Dispatch Test Carrier SMS</h2>
          </div>

          <form onSubmit={handleSendTestSms} className="space-y-3 text-[12px]">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">
                Destination MSISDN (E.164 Format)
              </label>
              <input
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                placeholder="+1..."
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">
                Sender ID / Shortcode
              </label>
              <input
                required
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                placeholder="GlobalTel"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">
                SMS Payload Body ({messageBody.length}/160 GSM 7-bit characters)
              </label>
              <textarea
                required
                rows={3}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                className="w-full p-2.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] text-[12px] focus:outline-none focus:border-[#4cd7f6]"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSending}
              className="w-full py-2 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[13px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className={`material-symbols-outlined text-[16px] ${isSending ? 'animate-spin' : ''}`}>
                send
              </span>
              <span>{isSending ? 'Transmitting to Carrier...' : 'Submit via Primary Trunk'}</span>
            </button>
          </form>
        </div>

        {/* Message Activity & DLR Feed (7 cols) */}
        <div className="xl:col-span-7 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4cd7f6] text-[20px]">mark_email_read</span>
                <h2 className="text-[15px] font-semibold text-[#dfe2ee]">Real-Time Delivery Receipts (DLR)</h2>
              </div>
              <span className="text-[10px] font-code-metric text-[#4edea3]">RECEIPTS OK</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-code-metric text-[12px]">
                <thead className="border-b border-[#3d494c] text-[10px] uppercase text-[#869397]">
                  <tr>
                    <th className="pb-2">Message UUID</th>
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2">Destination MSISDN</th>
                    <th className="pb-2">Latency</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3d494c]">
                  {testResults.map((m) => (
                    <tr key={m.id} className="hover:bg-[#262a33]/60 transition-colors">
                      <td className="py-2.5 text-[#4cd7f6] font-medium">{m.id}</td>
                      <td className="py-2.5 text-[#869397]">{m.time} UTC</td>
                      <td className="py-2.5 text-[#dfe2ee]">{m.to}</td>
                      <td className="py-2.5 text-[#4edea3]">{m.latency}ms</td>
                      <td className="py-2.5 text-right">
                        <span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/40 text-[10px]">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#3d494c] text-[11px] text-[#869397] font-code-metric flex items-center justify-between">
            <span>DLR Webhook Pipeline: 0 retry backpressure</span>
            <span className="text-[#4cd7f6]">P99 SLA: 45ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
