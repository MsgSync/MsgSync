import React, { useMemo, useState } from 'react';

interface RoamingDataPackagesScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const destinations = ['Global', 'Europe', 'North America', 'Asia Pacific', 'Middle East & Africa'];
const packages = [
  { id: 'ROAM-GLOBAL-5', destination: 'Global', title: 'Global Traveler 5 GB', data: '5 GB', days: 30, price: 29, network: '190+ destinations', popular: true },
  { id: 'ROAM-EU-10', destination: 'Europe', title: 'Europe Connect 10 GB', data: '10 GB', days: 30, price: 19, network: '48 countries', popular: false },
  { id: 'ROAM-NA-3', destination: 'North America', title: 'North America Flex 3 GB', data: '3 GB', days: 15, price: 14, network: 'US, CA, MX', popular: false },
  { id: 'ROAM-AP-8', destination: 'Asia Pacific', title: 'Asia Pacific Plus 8 GB', data: '8 GB', days: 30, price: 24, network: '32 countries', popular: false },
  { id: 'ROAM-MEA-5', destination: 'Middle East & Africa', title: 'MEA Essentials 5 GB', data: '5 GB', days: 30, price: 22, network: '42 countries', popular: false },
];

export const RoamingDataPackagesScreen: React.FC<RoamingDataPackagesScreenProps> = ({ onShowToast }) => {
  const [destination, setDestination] = useState('Global');
  const [search, setSearch] = useState('');
  const [activePackages, setActivePackages] = useState<any[]>([]);
  const visiblePackages = useMemo(() => packages.filter(item => (destination === 'Global' || item.destination === destination) && item.title.toLowerCase().includes(search.toLowerCase())), [destination, search]);

  const activate = (item: typeof packages[number]) => {
    if (activePackages.some(active => active.id === item.id)) return;
    setActivePackages(current => [...current, { ...item, activatedAt: new Date(), remaining: item.data, status: 'ACTIVE' }]);
    onShowToast(`${item.title} purchased and activated.`, 'success');
  };

  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d494c] pb-3"><div className="flex items-center gap-1.5 text-[12px] text-[#bcc9cd]"><span className="text-[#869397]">MOBILE CONNECTIVITY</span><span className="text-[#3d494c]">/</span><span className="font-semibold text-[#4cd7f6]">ROAMING DATA PACKAGES</span></div><span className="flex items-center gap-1.5 rounded border border-[#4edea3]/30 bg-[#4edea3]/5 px-2.5 py-1 text-[10px] text-[#4edea3]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4edea3]" />INSTANT ACTIVATION</span></div>
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="text-[10px] uppercase text-[#869397]">Available destinations</div><div className="mt-1 font-code-metric text-[24px] text-[#4cd7f6]">190+</div><div className="text-[10px] text-[#869397]">countries and territories</div></div><div className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="text-[10px] uppercase text-[#869397]">Active packages</div><div className="mt-1 font-code-metric text-[24px] text-[#4edea3]">{activePackages.length}</div><div className="text-[10px] text-[#869397]">ready for your next trip</div></div><div className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4"><div className="text-[10px] uppercase text-[#869397]">Network access</div><div className="mt-1 font-code-metric text-[24px] text-[#d0bcff]">5G</div><div className="text-[10px] text-[#869397]">LTE fallback enabled</div></div></div>
      <div className="flex flex-wrap items-center gap-2 rounded border border-[#3d494c] bg-[#1c2028] p-3"><select value={destination} onChange={event => setDestination(event.target.value)} className="rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-1.5 text-[11px] text-[#dfe2ee]">{destinations.map(item => <option key={item}>{item}</option>)}</select><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search packages..." className="min-w-48 flex-1 rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-1.5 text-[11px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]" /><span className="text-[10px] text-[#869397]">Prices shown in USD · no overage fees</span></div>
      <section><div className="mb-3 flex items-center justify-between"><div><h2 className="text-[15px] font-semibold">Choose your travel data</h2><p className="text-[10px] text-[#869397]">Select a destination and package based on your expected usage.</p></div><span className="text-[10px] text-[#869397]">{visiblePackages.length} packages</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visiblePackages.map(item => { const active = activePackages.find(pkg => pkg.id === item.id); return <div key={item.id} className={`relative rounded-lg border p-4 ${item.popular ? 'border-[#06b6d4]/50 bg-[#06b6d4]/5' : 'border-[#3d494c] bg-[#1c2028]'}`}>{item.popular && <span className="absolute right-3 top-3 rounded bg-[#06b6d4] px-1.5 py-0.5 text-[9px] font-semibold text-[#00424f]">MOST POPULAR</span>}<div className="text-[10px] uppercase tracking-wider text-[#4cd7f6]">{item.destination}</div><div className="mt-2 text-[14px] font-semibold text-[#dfe2ee]">{item.title}</div><div className="mt-1 text-[10px] text-[#869397]">{item.network}</div><div className="mt-4 flex items-end justify-between"><div><div className="font-code-metric text-[24px] text-[#4edea3]">${item.price}</div><div className="text-[9px] text-[#68767b]">one-time · {item.days} days</div></div><div className="text-right"><div className="font-code-metric text-[18px] text-[#4cd7f6]">{item.data}</div><div className="text-[9px] text-[#68767b]">high-speed data</div></div></div><button type="button" onClick={() => activate(item)} disabled={!!active} className={`mt-4 w-full rounded py-2 text-[11px] font-semibold ${active ? 'bg-[#4edea3]/10 text-[#4edea3]' : 'bg-[#06b6d4] text-[#00424f]'}`}>{active ? `Active · ${active.remaining} remaining` : 'Purchase & activate'}</button></div>})}</div></section>
      {activePackages.length > 0 && <section className="rounded-lg border border-[#4edea3]/30 bg-[#1c2028] p-4"><div className="mb-3 flex items-center justify-between border-b border-[#293240] pb-3"><div><h2 className="text-[14px] font-semibold">Your roaming packages</h2><p className="text-[10px] text-[#869397]">Active plans and remaining travel data.</p></div><span className="text-[10px] text-[#4edea3]">SERVICE ACTIVE</span></div><div className="grid gap-2 md:grid-cols-2">{activePackages.map(item => <div key={item.id} className="flex items-center justify-between rounded border border-[#293240] bg-[#0a0e16] p-3"><div><div className="text-[12px] font-semibold text-[#dfe2ee]">{item.title}</div><div className="mt-1 text-[10px] text-[#869397]">Activated {new Date(item.activatedAt).toLocaleString()} · expires in {item.days} days</div></div><div className="font-code-metric text-[15px] text-[#4edea3]">{item.remaining}</div></div>)}</div></section>}
    </div>
  );
};
