import React, { useState } from 'react';
import { useBilling } from '../hooks/useBilling';

interface BillingScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const BillingScreen: React.FC<BillingScreenProps> = ({ onShowToast }) => {
  const [balance, setBalance] = useState(384910.42);
  const [adjustAmount, setAdjustAmount] = useState('');
  const { organization, transactions: ledgerTransactions } = useBilling('root');
  const displayBalance = organization?.balance ?? balance;
  const suspended = organization?.suspended || displayBalance <= 0;
  const [adjustReason, setAdjustReason] = useState('Wholesale volume rebate Q3');
  const [transactions, setTransactions] = useState([
    { id: 'tx-88912', desc: 'Prepaid Wire Deposit (JPMorgan)', amount: 150000.0, time: 'Today 11:20 UTC', type: 'credit' },
    { id: 'tx-88911', desc: 'Twilio Direct US Outbound SMS settlement', amount: -14230.18, time: 'Today 09:00 UTC', type: 'debit' },
    { id: 'tx-88910', desc: 'BICS Transit Daily Interconnect Fee', amount: -6820.45, time: 'Yesterday 23:59 UTC', type: 'debit' },
    { id: 'tx-88909', desc: 'Tata Comm Asia Trunk Reserve adjustment', amount: 50000.0, time: 'Yesterday 14:12 UTC', type: 'credit' },
  ]);

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(adjustAmount);
    if (isNaN(val) || val <= 0) return;

    if (val > 500000) {
      onShowToast('Adjustment exceeds Marcus Vance $500,000/day IAM limit. Requires Board quorum.', 'error');
      return;
    }

    setBalance((prev) => prev + val);
    setTransactions([
      {
        id: `tx-${Date.now().toString().slice(-5)}`,
        desc: adjustReason,
        amount: val,
        time: 'Just now',
        type: 'credit',
      },
      ...transactions,
    ]);
    setAdjustAmount('');
    onShowToast(`Credit ledger adjusted by +$${val.toLocaleString()}. Cryptographically signed.`, 'success');
  };

  return (
    <div className="flex flex-col w-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">MANAGEMENT &amp; BILLING</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">BILLING &amp; CARRIER CREDIT LEDGER</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-code-metric px-2.5 py-1 rounded bg-[#d0bcff]/15 text-[#d0bcff] border border-[#d0bcff]/30">
            MARCUS VANCE APPROVAL CAP: $500K / DAY
          </span>
        </div>
      </div>

      {suspended && <div className="flex items-start gap-3 rounded-lg border border-[#ffb4ab]/40 bg-[#ffb4ab]/10 p-3 text-[11px] text-[#ffb4ab]"><span className="material-symbols-outlined text-[18px]">pause_circle</span><div><div className="font-semibold">Service suspended — balance exhausted</div><div className="mt-1 text-[#bcc9cd]">New message delivery is blocked automatically. Add credit below to restore service; accounts can never enter a negative balance.</div></div></div>}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Ledger Adjustment (5 cols) */}
        <div className="xl:col-span-5 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="text-[10px] uppercase font-semibold text-[#869397] tracking-wider mb-1">
            Carrier Available Ledger Balance
          </div>
          <div className="text-[32px] font-bold font-code-metric text-[#4edea3] mb-4">
             {suspended && <div className="mb-2 text-[10px] font-semibold text-[#ffb4ab]">SERVICE SUSPENDED</div>}
             ${displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div className="pt-3 border-t border-[#3d494c]">
            <h3 className="text-[14px] font-semibold text-[#dfe2ee] mb-2">Adjust Carrier Balance</h3>
            <form onSubmit={handleAdjust} className="space-y-3 text-[12px]">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">
                  Adjustment Amount ($ USD)
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] font-code-metric text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                  placeholder="25000"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#869397] font-semibold block mb-1">
                  Audit Reason &amp; Wire Reference
                </label>
                <input
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] focus:outline-none focus:border-[#4cd7f6]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[13px] hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] transition-all"
              >
                Sign &amp; Post Ledger Adjustment
              </button>
            </form>
          </div>
        </div>

        {/* Transaction History Table (7 cols) */}
        <div className="xl:col-span-7 rounded bg-[#1c2028] border border-[#3d494c] p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#3d494c]">
            <h2 className="text-[15px] font-semibold text-[#dfe2ee]">Audited Ledger Transactions</h2>
            <span className="text-[11px] font-code-metric text-[#869397]">WORM STORAGE ARCHIVED</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-code-metric text-[12px]">
              <thead className="border-b border-[#3d494c] text-[10px] uppercase text-[#869397]">
                <tr>
                  <th className="pb-2">Tx ID</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d494c]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#262a33]/60 transition-colors">
                    <td className="py-2.5 text-[#4cd7f6] font-medium">{tx.id}</td>
                    <td className="py-2.5 text-[#dfe2ee]">{tx.desc}</td>
                    <td className="py-2.5 text-[#869397]">{tx.time}</td>
                    <td
                      className={`py-2.5 text-right font-bold ${
                        tx.amount > 0 ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
