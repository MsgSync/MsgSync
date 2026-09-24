import React, { useCallback, useState } from 'react';
import { apiClient } from '../lib/api/client';
import { useQuery } from '../hooks/useApi';
import { Provider } from '../lib/api/types';
import { useAuth } from '../context/AuthContext';

interface SmsGatewaysScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

interface GatewayForm {
  name: string;
  type: string;
  host: string;
  port: string;
  username: string;
  password: string;
  systemId: string;
  priority: string;
  weight: string;
  costPerSms: string;
  supportedPrefixes: string;
  active: boolean;
}

const EMPTY_FORM: GatewayForm = {
  name: '', type: 'smpp', host: '', port: '2775', username: '', password: '', systemId: '',
  priority: '1', weight: '100', costPerSms: '0.005', supportedPrefixes: '', active: true
};

export const SmsGatewaysScreen: React.FC<SmsGatewaysScreenProps> = ({ onShowToast }) => {
  const { user } = useAuth();
  const { data: gateways, loading, refetch } = useQuery<Provider[]>(() => apiClient.getSmsGateways().then(response => response.data || []), []);
  const [form, setForm] = useState<GatewayForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<Provider | null>(null);
  const [saving, setSaving] = useState(false);
  const canManage = user?.role === 'ADMIN';

  const setField = <K extends keyof GatewayForm>(key: K, value: GatewayForm[K]) => setForm(previous => ({ ...previous, [key]: value }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); };
  const openEdit = (gateway: Provider) => {
    setEditing(gateway);
    setForm({
      name: gateway.name,
      type: gateway.type,
      host: String(gateway.config.host || ''),
      port: String(gateway.config.port || ''),
      username: String(gateway.config.username || ''),
      password: '',
      systemId: String(gateway.config.systemId || ''),
      priority: String(gateway.priority),
      weight: String(gateway.weight),
      costPerSms: String(gateway.costPerSms),
      supportedPrefixes: (gateway.supportedPrefixes || []).join(', '),
      active: gateway.active
    });
  };

  const saveGateway = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        config: { host: form.host, port: Number(form.port), username: form.username, ...(form.password ? { password: form.password } : {}), systemId: form.systemId },
        priority: Number(form.priority),
        weight: Number(form.weight),
        costPerSms: Number(form.costPerSms),
        supportedPrefixes: form.supportedPrefixes.split(',').map(value => value.trim()).filter(Boolean),
        active: form.active
      };
      if (editing) await apiClient.updateSmsGateway(editing.id, payload);
      else await apiClient.createSmsGateway(payload);
      onShowToast(`${form.name} gateway ${editing ? 'updated' : 'created'}.`, 'success');
      openCreate();
      await refetch();
    } catch (error: any) {
      onShowToast(error.message || 'Unable to save gateway.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleGateway = async (gateway: Provider) => {
    try { await apiClient.updateSmsGateway(gateway.id, { active: !gateway.active }); await refetch(); }
    catch (error: any) { onShowToast(error.message || 'Unable to update gateway.', 'error'); }
  };

  const healthCheck = async (gateway: Provider) => {
    try { await apiClient.checkSmsGateway(gateway.id); onShowToast(`${gateway.name} health check passed.`, 'success'); }
    catch (error: any) { onShowToast(error.message || 'Health check failed.', 'error'); }
  };

  const testGateway = async (gateway: Provider) => {
    const recipient = window.prompt('Test destination number', '+12025550194');
    if (!recipient) return;
    try { await apiClient.testSmsGateway(gateway.id, recipient); onShowToast(`Test SMS accepted by ${gateway.name}.`, 'success'); }
    catch (error: any) { onShowToast(error.message || 'Test SMS failed.', 'error'); }
  };

  const removeGateway = async (gateway: Provider) => {
    if (!window.confirm(`Delete gateway ${gateway.name}?`)) return;
    try { await apiClient.deleteSmsGateway(gateway.id); onShowToast(`${gateway.name} deleted.`, 'info'); await refetch(); }
    catch (error: any) { onShowToast(error.message || 'Unable to delete gateway.', 'error'); }
  };

  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d494c] pb-3">
        <div className="flex items-center gap-1.5 text-[12px] text-[#bcc9cd]"><span className="text-[#869397]">TELECOM &amp; ROUTING</span><span className="text-[#3d494c]">/</span><span className="font-semibold text-[#4cd7f6]">SMS GATEWAY MANAGEMENT</span></div>
        {canManage && <button type="button" onClick={openCreate} className="flex items-center gap-1.5 rounded bg-[#06b6d4] px-3 py-1.5 text-[11px] font-bold text-[#00424f] hover:bg-[#22c7e3]"><span className="material-symbols-outlined text-[16px]">add</span>Add gateway</button>}
      </div>

      {canManage && <form onSubmit={saveGateway} className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><h2 className="text-[14px] font-semibold text-[#dfe2ee]">{editing ? `Edit ${editing.name}` : 'Register SMS gateway'}</h2>{editing && <button type="button" onClick={openCreate} className="text-[11px] text-[#869397] hover:text-white">Cancel</button>}</div>
        <div className="grid gap-3 md:grid-cols-4">
          <Input label="Gateway name" value={form.name} onChange={value => setField('name', value)} required />
          <SelectInput label="Protocol" value={form.type} onChange={value => setField('type', value)} options={['smpp', 'twilio', 'nexmo', 'generic-http', 'ss7']} />
          <Input label="Host / endpoint" value={form.host} onChange={value => setField('host', value)} required />
          <Input label="Port" value={form.port} onChange={value => setField('port', value)} type="number" />
          <Input label="Username" value={form.username} onChange={value => setField('username', value)} />
          <Input label={editing ? 'New password (optional)' : 'Password / token'} value={form.password} onChange={value => setField('password', value)} type="password" />
          <Input label="System ID" value={form.systemId} onChange={value => setField('systemId', value)} />
          <Input label="Priority" value={form.priority} onChange={value => setField('priority', value)} type="number" />
          <Input label="Weight" value={form.weight} onChange={value => setField('weight', value)} type="number" />
          <Input label="Cost / SMS" value={form.costPerSms} onChange={value => setField('costPerSms', value)} type="number" step="0.0001" />
          <Input label="Prefixes (comma separated)" value={form.supportedPrefixes} onChange={value => setField('supportedPrefixes', value)} />
        </div>
        <div className="mt-4 flex items-center justify-between"><label className="flex items-center gap-2 text-[11px] text-[#bcc9cd]"><input type="checkbox" checked={form.active} onChange={event => setField('active', event.target.checked)} className="accent-[#06b6d4]" />Gateway enabled</label><button disabled={saving} type="submit" className="rounded bg-[#4edea3] px-4 py-1.5 text-[11px] font-bold text-[#063b2c] disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Save changes' : 'Create gateway'}</button></div>
      </form>}

      <div className="overflow-hidden rounded-lg border border-[#3d494c] bg-[#1c2028] shadow-sm">
        {loading ? <div className="p-8 text-center text-[#869397]">Loading SMS gateways...</div> : gateways?.length ? <div className="overflow-x-auto"><table className="w-full text-left font-code-metric text-[11px]"><thead className="border-b border-[#3d494c] bg-[#181c24] text-[10px] uppercase text-[#869397]"><tr><th className="p-3">Gateway</th><th className="p-3">Protocol</th><th className="p-3">Status</th><th className="p-3">Priority</th><th className="p-3">Cost/SMS</th><th className="p-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#3d494c]">{gateways.map(gateway => <tr key={gateway.id} className="hover:bg-[#262a33]"><td className="p-3"><div className="font-semibold text-[#dfe2ee]">{gateway.name}</div><div className="mt-0.5 text-[10px] text-[#68767b]">{gateway.config.host || 'endpoint configured'}</div></td><td className="p-3 uppercase text-[#bcc9cd]">{gateway.type}</td><td className="p-3"><span className={`rounded border px-2 py-0.5 text-[10px] ${gateway.active ? 'border-[#4edea3]/30 bg-[#4edea3]/10 text-[#4edea3]' : 'border-[#3d494c] bg-[#31353e] text-[#869397]'}`}>{gateway.active ? 'ACTIVE' : 'DISABLED'}</span></td><td className="p-3 text-[#dfe2ee]">{gateway.priority}</td><td className="p-3 text-[#4edea3]">${Number(gateway.costPerSms).toFixed(4)}</td><td className="p-3 text-right"><div className="flex justify-end gap-1.5">{canManage && <><button onClick={() => openEdit(gateway)} className="rounded px-2 py-1 text-[#4cd7f6] hover:bg-[#353942]">Edit</button><button onClick={() => toggleGateway(gateway)} className="rounded px-2 py-1 text-[#ffb4ab] hover:bg-[#353942]">{gateway.active ? 'Disable' : 'Enable'}</button><button onClick={() => removeGateway(gateway)} className="rounded px-2 py-1 text-[#ffb4ab] hover:bg-[#353942]">Delete</button></>}<button onClick={() => healthCheck(gateway)} className="rounded px-2 py-1 text-[#4edea3] hover:bg-[#353942]">Health</button><button onClick={() => testGateway(gateway)} className="rounded px-2 py-1 text-[#d0bcff] hover:bg-[#353942]">Test SMS</button></div></td></tr>)}</tbody></table></div> : <div className="p-8 text-center text-[#869397]">No SMS gateways configured.</div>}
      </div>
    </div>
  );
};

const Input: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; step?: string }> = ({ label, value, onChange, type = 'text', required, step }) => <label className="block"><span className="mb-1 block text-[10px] uppercase tracking-wider text-[#869397]">{label}</span><input type={type} step={step} value={value} required={required} onChange={event => onChange(event.target.value)} className="h-9 w-full rounded border border-[#3d494c] bg-[#0a0e16] px-2.5 text-[11px] text-[#dfe2ee] outline-none focus:border-[#06b6d4]" /></label>;
const SelectInput: React.FC<{ label: string; value: string; onChange: (value: string) => void; options: string[] }> = ({ label, value, onChange, options }) => <label className="block"><span className="mb-1 block text-[10px] uppercase tracking-wider text-[#869397]">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="h-9 w-full rounded border border-[#3d494c] bg-[#0a0e16] px-2.5 text-[11px] text-[#dfe2ee] outline-none focus:border-[#06b6d4]">{options.map(option => <option key={option}>{option}</option>)}</select></label>;
