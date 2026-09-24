import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../lib/api/client';
import { useQuery } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

interface RoleDefinition {
  role: string;
  label: string;
  description: string;
  permissions: string[];
}

const PERMISSION_GROUPS: Record<string, string> = {
  'sms:send': 'Send SMS', 'sms:read': 'View SMS', 'sms:write': 'Manage SMS',
  'bulk:read': 'View bulk campaigns', 'bulk:write': 'Manage campaigns', 'contacts:manage': 'Manage contacts',
  'rates:read': 'View rates', 'rates:manage': 'Manage rates', 'routing:read': 'View routing', 'routing:manage': 'Manage routing',
  'providers:read': 'View providers', 'providers:manage': 'Manage providers', 'organizations:read': 'View organizations',
  'organizations:manage': 'Manage organizations', 'organizations:balance': 'Manage balances', 'invoices:read': 'View invoices',
  'invoices:manage': 'Manage invoices', 'users:manage': 'Manage users', 'audit:read': 'View audit logs', 'analytics:read': 'View analytics'
};

export const RoleManagementScreen: React.FC<{ onShowToast?: (message: string, type?: 'success' | 'warning' | 'error' | 'info') => void }> = ({ onShowToast }) => {
  const { user } = useAuth();
  const { data: roles, loading, error } = useQuery<RoleDefinition[]>(() => apiClient.getManagedRoles().then(response => response.data || []), []);
  const [selectedRole, setSelectedRole] = useState<string>(user?.role || 'CUSTOMER');
  const [savedPermissions, setSavedPermissions] = useState<Record<string, string[]>>({});
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');
  const selected = useMemo(() => roles?.find(role => role.role === selectedRole) || roles?.[0], [roles, selectedRole]);
  const permissions = selected ? (savedPermissions[selected.role] || selected.permissions) : [];
  const getRolePermissions = (role: RoleDefinition) => savedPermissions[role.role] || role.permissions;
  const isDirty = selected ? draftPermissions.length !== permissions.length || draftPermissions.some(permission => !permissions.includes(permission)) : false;
  const visiblePermissions = Object.entries(PERMISSION_GROUPS).filter(([permission, label]) => `${permission} ${label}`.toLowerCase().includes(permissionSearch.toLowerCase()));

  useEffect(() => {
    if (selected) setDraftPermissions(savedPermissions[selected.role] || selected.permissions);
  }, [selected, savedPermissions]);

  const togglePermission = (permission: string) => {
    if (!selected) return;
    setDraftPermissions(current => current.includes(permission)
      ? current.filter(item => item !== permission)
      : [...current, permission]);
  };

  const toggleAllPermissions = (enabled: boolean) => {
    setDraftPermissions(enabled ? Object.keys(PERMISSION_GROUPS) : []);
  };

  const savePermissions = () => {
    if (!selected || !isDirty) return;
    setSavedPermissions(current => ({ ...current, [selected.role]: draftPermissions }));
    onShowToast?.(`${selected.label} permissions saved.`, 'success');
  };

  if (loading) return <div className="py-10 text-center text-[#869397]">Loading role policy...</div>;
  if (error) return <div className="py-10 text-center text-[#ffb4ab]">Unable to load role policy.</div>;

  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d494c] pb-3"><div className="flex items-center gap-1.5 text-[12px] text-[#bcc9cd]"><span className="text-[#869397]">ACCESS CONTROL</span><span className="text-[#3d494c]">/</span><span className="font-semibold text-[#4cd7f6]">ROLE MANAGEMENT</span></div><span className="flex items-center gap-1.5 rounded border border-[#4edea3]/25 bg-[#4edea3]/5 px-2.5 py-1 text-[10px] font-semibold text-[#4edea3]"><span className="h-1.5 w-1.5 rounded-full bg-[#4edea3]" />Policy enforced by API</span></div>
      <div className="grid gap-4 xl:grid-cols-[300px_1fr]">
        <section className="rounded-lg border border-[#3d494c] bg-[#181c24] p-3"><div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-[#869397]">Platform roles</div><div className="space-y-1">{roles?.map(role => <button key={role.role} type="button" onClick={() => setSelectedRole(role.role)} className={`w-full rounded-lg p-3 text-left transition-colors ${selected?.role === role.role ? 'border border-[#06b6d4]/50 bg-[#06b6d4]/10' : 'border border-transparent hover:bg-[#262a33]'}`}><div className="flex items-center justify-between"><span className={`text-[13px] font-semibold ${selected?.role === role.role ? 'text-[#4cd7f6]' : 'text-[#dfe2ee]'}`}>{role.label}</span>{user?.role === role.role && <span className="rounded bg-[#4edea3]/15 px-1.5 py-0.5 text-[9px] text-[#4edea3]">YOU</span>}</div><p className="mt-1 text-[10px] leading-4 text-[#869397]">{role.description}</p><div className="mt-2 font-code-metric text-[9px] text-[#68767b]">{getRolePermissions(role).length} PERMISSIONS</div></button>)}</div></section>
        <section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-5 shadow-sm"><div className="flex items-start gap-3 border-b border-[#293240] pb-4"><span className="material-symbols-outlined text-[24px] text-[#4cd7f6]">admin_panel_settings</span><div><h2 className="text-[16px] font-semibold text-[#dfe2ee]">{selected?.label || 'Role'} permissions</h2><p className="mt-1 text-[11px] text-[#869397]">{selected?.description}</p></div></div><div className="mt-4 flex flex-wrap items-center gap-2"><input value={permissionSearch} onChange={event => setPermissionSearch(event.target.value)} placeholder="Filter permissions..." className="min-w-48 flex-1 rounded border border-[#3d494c] bg-[#0a0e16] px-3 py-1.5 text-[11px] text-[#dfe2ee] outline-none focus:border-[#4cd7f6]" /><button type="button" onClick={() => toggleAllPermissions(true)} className="rounded border border-[#4edea3]/30 px-2.5 py-1.5 text-[10px] text-[#4edea3]">Select all</button><button type="button" onClick={() => toggleAllPermissions(false)} className="rounded border border-[#3d494c] px-2.5 py-1.5 text-[10px] text-[#869397]">Clear all</button><span className="text-[10px] text-[#869397]">{draftPermissions.length}/{Object.keys(PERMISSION_GROUPS).length} selected</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{visiblePermissions.map(([permission, label]) => { const enabled = draftPermissions.includes(permission); return <label key={permission} className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-[11px] transition-colors ${enabled ? 'border-[#4edea3]/20 bg-[#4edea3]/5 text-[#dfe2ee]' : 'border-[#293240] bg-[#12161f] text-[#869397] hover:border-[#536066]'}`}><input type="checkbox" checked={enabled} onChange={() => togglePermission(permission)} className="h-3.5 w-3.5 accent-[#4edea3]" /><span>{label}</span></label>; })}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-start gap-2 rounded-lg border border-[#3d494c] bg-[#0a0e16] p-3 text-[10px] leading-5 text-[#869397]"><span className="material-symbols-outlined text-[16px] text-[#4cd7f6]">info</span>Select permissions for this role, then save the policy.</div><button type="button" onClick={savePermissions} disabled={!isDirty} className="rounded border border-[#06b6d4]/50 bg-[#06b6d4]/15 px-4 py-2 text-[11px] font-semibold text-[#4cd7f6] transition-colors hover:bg-[#06b6d4]/25 disabled:cursor-not-allowed disabled:opacity-40">{isDirty ? 'Save changes' : 'Saved'}</button></div></section>
      </div>
    </div>
  );
};
