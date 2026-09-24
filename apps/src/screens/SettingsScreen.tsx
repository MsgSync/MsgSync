import React, { useRef, useState } from 'react';

interface SettingsScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

type SettingsTab = 'console' | 'notifications' | 'security' | 'data';

interface DashboardSettings {
  theme: 'dark' | 'midnight';
  density: 'comfortable' | 'compact';
  refreshRate: '1s' | '5s' | '15s' | '30s';
  liveStream: boolean;
  soundAlerts: boolean;
  desktopAlerts: boolean;
  anomalyAlerts: boolean;
  deliveryAlerts: boolean;
  securityBanner: boolean;
  sessionTimeout: '15m' | '30m' | '60m';
}

const DEFAULT_SETTINGS: DashboardSettings = {
  theme: 'dark',
  density: 'comfortable',
  refreshRate: '5s',
  liveStream: true,
  soundAlerts: true,
  desktopAlerts: false,
  anomalyAlerts: true,
  deliveryAlerts: false,
  securityBanner: true,
  sessionTimeout: '30m',
};

const STORAGE_KEY = 'msgsync_dashboard_settings';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('console');
  const [settings, setSettings] = useState<DashboardSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const update = <K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) => {
    setSettings(previous => ({ ...previous, [key]: value }));
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    onShowToast('Dashboard settings saved locally.', 'success');
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    onShowToast('Dashboard settings restored to defaults.', 'info');
  };

  const downloadBackup = async () => {
    setBackupBusy(true);
    try {
      const response = await fetch('/api/admin/backups/export');
      if (!response.ok) throw new Error('Administrator access is required.');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `msgsync-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      onShowToast('Configuration backup downloaded.', 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Backup download failed.', 'error');
    } finally {
      setBackupBusy(false);
    }
  };

  const restoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!window.confirm('Restore will replace current configuration data. Delivery history is preserved. Continue?')) return;
    setBackupBusy(true);
    try {
      const payload = JSON.parse(await file.text());
      const response = await fetch('/api/admin/backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, confirm: 'RESTORE' })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || 'Backup restore failed.');
      onShowToast('Configuration backup restored successfully.', 'success');
    } catch (error: any) {
      onShowToast(error.message || 'Backup restore failed.', 'error');
    } finally {
      setBackupBusy(false);
    }
  };

  const toggle = (key: keyof DashboardSettings, label: string, description: string, icon: string) => (
    <div className="flex items-center justify-between gap-5 rounded-lg border border-[#293240] bg-[#12161f] p-4">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#4cd7f6]">{icon}</span>
        <div>
          <div className="text-[13px] font-semibold text-[#dfe2ee]">{label}</div>
          <div className="mt-1 text-[11px] leading-5 text-[#869397]">{description}</div>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(settings[key])}
        onClick={() => update(key, !settings[key] as DashboardSettings[typeof key])}
        className={`relative h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${settings[key] ? 'bg-[#06b6d4]' : 'bg-[#3d494c]'}`}
      >
        <span className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow transition-transform ${settings[key] ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex w-full flex-col space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d494c] pb-3">
        <div className="flex items-center gap-1.5 text-[12px] text-[#bcc9cd]">
          <span className="text-[#869397]">SYSTEM</span><span className="text-[#3d494c]">/</span><span className="text-[#869397]">CONSOLE</span><span className="text-[#3d494c]">/</span><span className="font-semibold text-[#4cd7f6]">DASHBOARD SETTINGS</span>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={reset} className="rounded border border-[#3d494c] bg-[#1c2028] px-3 py-1.5 text-[11px] font-semibold text-[#bcc9cd] hover:bg-[#262a33] hover:text-white">Reset defaults</button>
          <button type="button" onClick={save} className="flex items-center gap-1.5 rounded bg-[#06b6d4] px-3 py-1.5 text-[11px] font-bold text-[#00424f] hover:bg-[#22c7e3]"><span className="material-symbols-outlined text-[16px]">save</span>Save changes</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[220px_1fr]">
        <nav className="flex gap-1 overflow-x-auto rounded-lg border border-[#3d494c] bg-[#181c24] p-2 xl:block xl:space-y-1">
          {[
            { id: 'console', label: 'Console', icon: 'tune' },
            { id: 'notifications', label: 'Notifications', icon: 'notifications' },
            { id: 'security', label: 'Security', icon: 'shield' },
            { id: 'data', label: 'Data & density', icon: 'database' },
          ].map(tab => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id as SettingsTab)} className={`flex shrink-0 items-center gap-2 rounded px-3 py-2 text-left text-[12px] transition-colors xl:w-full ${activeTab === tab.id ? 'bg-[#06b6d4] font-bold text-[#00424f]' : 'text-[#bcc9cd] hover:bg-[#262a33] hover:text-white'}`}>
              <span className="material-symbols-outlined text-[17px]">{tab.icon}</span>{tab.label}
            </button>
          ))}
        </nav>

        <section className="rounded-lg border border-[#3d494c] bg-[#1c2028] p-5 shadow-sm">
          {activeTab === 'console' && <div className="space-y-5"><SectionTitle icon="dashboard" title="Console experience" description="Control how the NOC dashboard behaves for this operator session." /><div className="grid gap-4 md:grid-cols-2"><SelectField label="Color theme" value={settings.theme} onChange={value => update('theme', value as DashboardSettings['theme'])} options={[['dark', 'Dark operations'], ['midnight', 'Midnight contrast']]} /><SelectField label="Refresh interval" value={settings.refreshRate} onChange={value => update('refreshRate', value as DashboardSettings['refreshRate'])} options={[['1s', '1 second'], ['5s', '5 seconds'], ['15s', '15 seconds'], ['30s', '30 seconds']]} /></div>{toggle('liveStream', 'Live traffic stream', 'Keep the live monitor and operational metrics streaming in the background.', 'monitoring')}</div>}

          {activeTab === 'notifications' && <div className="space-y-3"><SectionTitle icon="notifications" title="Notification routing" description="Choose which operational events can interrupt your workflow." />{toggle('soundAlerts', 'Sound alerts', 'Play a sound for critical delivery and security events.', 'volume_up')}{toggle('desktopAlerts', 'Desktop notifications', 'Show browser notifications when the console is in the background.', 'desktop_windows')}{toggle('anomalyAlerts', 'Traffic anomalies', 'Alert when traffic deviates significantly from the rolling baseline.', 'crisis_alert')}{toggle('deliveryAlerts', 'Delivery failures', 'Notify when a campaign crosses its failure threshold.', 'report_problem')}</div>}

          {activeTab === 'security' && <div className="space-y-4"><SectionTitle icon="shield" title="Operator security" description="Security controls are enforced by your account role and organization policy." /><div className="rounded-lg border border-[#4edea3]/25 bg-[#4edea3]/5 p-4"><div className="flex items-center gap-2 text-[13px] font-semibold text-[#4edea3]"><span className="material-symbols-outlined text-[18px]">verified_user</span>Identity protection active</div><p className="mt-2 text-[11px] leading-5 text-[#bcc9cd]">JWT access, refresh rotation, organization scoping, and audit logging are enforced by the API.</p></div>{toggle('securityBanner', 'Security status banner', 'Show the current security posture in the dashboard header.', 'security')}<SelectField label="Session timeout" value={settings.sessionTimeout} onChange={value => update('sessionTimeout', value as DashboardSettings['sessionTimeout'])} options={[['15m', '15 minutes'], ['30m', '30 minutes'], ['60m', '1 hour']]} /></div>}

          {activeTab === 'data' && <div className="space-y-5"><SectionTitle icon="database" title="Data & backup" description="Tune information density and manage administrator configuration backups." /><div className="rounded-lg border border-[#3d494c] bg-[#12161f] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[13px] font-semibold text-[#dfe2ee]">Configuration backup</div><div className="mt-1 text-[11px] leading-5 text-[#869397]">Exports organizations, users, providers, rates, routing, campaigns, and billing configuration. Message history is preserved.</div></div><div className="flex items-center gap-2"><input ref={restoreInputRef} type="file" accept="application/json,.json" className="hidden" onChange={restoreBackup} /><button type="button" disabled={backupBusy} onClick={() => restoreInputRef.current?.click()} className="flex items-center gap-1.5 rounded border border-[#ffb4ab]/40 px-3 py-1.5 text-[11px] font-semibold text-[#ffb4ab] hover:bg-[#ffb4ab]/10 disabled:opacity-50"><span className="material-symbols-outlined text-[16px]">upload</span>Restore</button><button type="button" disabled={backupBusy} onClick={downloadBackup} className="flex items-center gap-1.5 rounded bg-[#06b6d4] px-3 py-1.5 text-[11px] font-bold text-[#00424f] hover:bg-[#22c7e3] disabled:opacity-50"><span className="material-symbols-outlined text-[16px]">download</span>Download</button></div></div><div className="mt-3 flex items-center gap-2 text-[10px] text-[#68767b]"><span className="material-symbols-outlined text-[14px] text-[#4edea3]">verified_user</span>Admin-only · logical JSON · restore requires confirmation</div></div><SelectField label="Table density" value={settings.density} onChange={value => update('density', value as DashboardSettings['density'])} options={[['comfortable', 'Comfortable'], ['compact', 'Compact']]} /><div className="rounded-lg border border-[#293240] bg-[#0a0e16] p-4 text-[11px] text-[#869397]">Preview: <span className={settings.density === 'compact' ? 'text-[#4edea3]' : 'text-[#4cd7f6]'}>{settings.density === 'compact' ? 'COMPACT' : 'COMFORTABLE'}</span> table row spacing</div></div>}
        </section>
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ icon: string; title: string; description: string }> = ({ icon, title, description }) => <div className="flex items-start gap-3 border-b border-[#293240] pb-4"><span className="material-symbols-outlined text-[22px] text-[#4cd7f6]">{icon}</span><div><h2 className="text-[15px] font-semibold text-[#dfe2ee]">{title}</h2><p className="mt-1 text-[11px] leading-5 text-[#869397]">{description}</p></div></div>;

const SelectField: React.FC<{ label: string; value: string; onChange: (value: string) => void; options: string[][] }> = ({ label, value, onChange, options }) => <label className="block"><span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-[#869397]">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="h-10 w-full rounded border border-[#3d494c] bg-[#0a0e16] px-3 text-[12px] text-[#dfe2ee] outline-none focus:border-[#06b6d4]">{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
