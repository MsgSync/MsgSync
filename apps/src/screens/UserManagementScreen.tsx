import React, { useCallback, useState } from 'react';
import { apiClient } from '../lib/api/client';
import { useQuery } from '../hooks/useApi';
import { ManagedUser } from '../lib/api/types';
import { useAuth } from '../context/AuthContext';

interface UserManagementScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

const ROLE_LABELS: Record<ManagedUser['role'], string> = {
  ADMIN: 'Administrator',
  AGGREGATOR: 'Aggregator',
  RESELLER: 'Reseller',
  CUSTOMER: 'Customer'
};

export const UserManagementScreen: React.FC<UserManagementScreenProps> = ({ onShowToast }) => {
  const { user } = useAuth();
  const { data: users, loading, error, refetch } = useQuery<ManagedUser[]>(() => apiClient.getManagedUsers().then(response => response.data || []), []);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<ManagedUser['role']>('CUSTOMER');
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'ADMIN' || user?.role === 'AGGREGATOR' || user?.role === 'RESELLER';

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiClient.createManagedUser({ name, email, password, role });
      onShowToast(`${email} added to the organization.`, 'success');
      setName(''); setEmail(''); setPassword(''); setRole('CUSTOMER'); setShowCreate(false);
      await refetch();
    } catch (err: any) {
      onShowToast(err.message || 'Unable to create user.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (managedUser: ManagedUser, nextRole: ManagedUser['role']) => {
    if (managedUser.role === nextRole) return;
    try {
      await apiClient.updateManagedUserRole(managedUser.id, nextRole);
      onShowToast(`${managedUser.email} is now ${ROLE_LABELS[nextRole]}.`, 'success');
      await refetch();
    } catch (err: any) {
      onShowToast(err.message || 'Unable to update role.', 'error');
    }
  };

  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d494c] pb-3">
        <div className="flex items-center gap-1.5 text-[12px] text-[#bcc9cd]"><span className="text-[#869397]">MANAGEMENT</span><span className="text-[#3d494c]">/</span><span className="text-[#869397]">ACCESS CONTROL</span><span className="text-[#3d494c]">/</span><span className="font-semibold text-[#4cd7f6]">USER MANAGEMENT</span></div>
        {canManage && <button type="button" onClick={() => setShowCreate(value => !value)} className="flex items-center gap-1.5 rounded bg-[#06b6d4] px-3 py-1.5 text-[11px] font-bold text-[#00424f] hover:bg-[#22c7e3]"><span className="material-symbols-outlined text-[16px]">person_add</span>Add user</button>}
      </div>

      {showCreate && canManage && <form onSubmit={createUser} className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="text-[14px] font-semibold text-[#dfe2ee]">Create managed user</h2><button type="button" onClick={() => setShowCreate(false)} className="text-[#869397] hover:text-white"><span className="material-symbols-outlined text-[18px]">close</span></button></div><div className="grid gap-3 md:grid-cols-4"><Input label="Full name" value={name} onChange={setName} required /><Input label="Email" value={email} onChange={setEmail} type="email" required /><Input label="Temporary password" value={password} onChange={setPassword} type="password" required /><SelectInput label="Role" value={role} onChange={value => setRole(value as ManagedUser['role'])} options={user?.role === 'ADMIN' ? ['ADMIN', 'AGGREGATOR', 'RESELLER', 'CUSTOMER'] : user?.role === 'AGGREGATOR' ? ['RESELLER', 'CUSTOMER'] : ['CUSTOMER']} /></div><div className="mt-4 flex justify-end"><button disabled={saving} type="submit" className="rounded bg-[#4edea3] px-4 py-1.5 text-[11px] font-bold text-[#063b2c] disabled:opacity-50">{saving ? 'Creating...' : 'Create user'}</button></div></form>}

      <div className="rounded-lg border border-[#3d494c] bg-[#1c2028] shadow-sm"><div className="flex items-center justify-between border-b border-[#3d494c] px-4 py-3"><div><h2 className="text-[14px] font-semibold text-[#dfe2ee]">Organization users</h2><p className="mt-1 text-[11px] text-[#869397]">Roles determine API and dashboard permissions.</p></div><span className="font-code-metric text-[10px] text-[#4cd7f6]">{users?.length || 0} USERS</span></div>{loading ? <div className="p-8 text-center text-[#869397]">Loading users...</div> : error ? <div className="p-8 text-center text-[#ffb4ab]">{error}</div> : <div className="overflow-x-auto"><table className="w-full text-left font-code-metric text-[11px]"><thead className="border-b border-[#3d494c] bg-[#181c24] text-[10px] uppercase text-[#869397]"><tr><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">2FA</th><th className="p-3">Created</th></tr></thead><tbody className="divide-y divide-[#3d494c]">{users?.map(managedUser => <tr key={managedUser.id} className="hover:bg-[#262a33]"><td className="p-3"><div className="flex items-center gap-2.5"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#06b6d4]/15 text-[#4cd7f6]"><span className="material-symbols-outlined text-[16px]">person</span></div><div><div className="font-semibold text-[#dfe2ee]">{managedUser.name || 'Unnamed user'}</div><div className="mt-0.5 text-[10px] text-[#869397]">{managedUser.email}</div></div></div></td><td className="p-3">{canManage ? <select value={managedUser.role} onChange={event => changeRole(managedUser, event.target.value as ManagedUser['role'])} className="rounded border border-[#3d494c] bg-[#0a0e16] px-2 py-1 text-[10px] text-[#dfe2ee] outline-none focus:border-[#06b6d4]"><option value="ADMIN">Administrator</option><option value="AGGREGATOR">Aggregator</option><option value="RESELLER">Reseller</option><option value="CUSTOMER">Customer</option></select> : <RoleBadge role={managedUser.role} />}</td><td className="p-3">{managedUser.twoFactorEnabled ? <span className="text-[#4edea3]">Enabled</span> : <span className="text-[#fbbf24]">Not enabled</span>}</td><td className="p-3 text-[#869397]">{new Date(managedUser.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}</div>
    </div>
  );
};

const RoleBadge: React.FC<{ role: ManagedUser['role'] }> = ({ role }) => <span className="rounded border border-[#3d494c] bg-[#262a33] px-2 py-0.5 text-[10px] text-[#bcc9cd]">{ROLE_LABELS[role]}</span>;
const Input: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }> = ({ label, value, onChange, type = 'text', required }) => <label className="block"><span className="mb-1 block text-[10px] uppercase tracking-wider text-[#869397]">{label}</span><input type={type} value={value} required={required} onChange={event => onChange(event.target.value)} className="h-9 w-full rounded border border-[#3d494c] bg-[#0a0e16] px-2.5 text-[11px] text-[#dfe2ee] outline-none focus:border-[#06b6d4]" /></label>;
const SelectInput: React.FC<{ label: string; value: string; onChange: (value: string) => void; options: string[] }> = ({ label, value, onChange, options }) => <label className="block"><span className="mb-1 block text-[10px] uppercase tracking-wider text-[#869397]">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="h-9 w-full rounded border border-[#3d494c] bg-[#0a0e16] px-2.5 text-[11px] text-[#dfe2ee] outline-none focus:border-[#06b6d4]">{options.map(option => <option key={option} value={option}>{ROLE_LABELS[option as ManagedUser['role']]}</option>)}</select></label>;
