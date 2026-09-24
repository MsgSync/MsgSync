import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { login, verify2FA, register, isAuthenticated } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) onLoginSuccess();
  }, [isAuthenticated, onLoginSuccess]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login(email, password);
      if (result.requires2FA && result.tempToken) {
        setTwoFactorToken(result.tempToken);
        return;
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [email, password, login, onLoginSuccess]);

  const handleVerify2FA = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verify2FA(twoFactorToken, twoFactorCode);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  }, [twoFactorToken, twoFactorCode, verify2FA, onLoginSuccess]);

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(email, password, name);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }, [email, password, name, register, onLoginSuccess]);

  const passwordChecks = [
    { label: '8+ characters', valid: password.length >= 8 },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Number', valid: /\d/.test(password) },
  ];

  const inputClass = 'h-11 w-full rounded-lg border border-[#3d494c] bg-[#0a0e16] px-3.5 text-[14px] text-[#dfe2ee] outline-none transition placeholder:text-[#617076] focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/10';
  const labelClass = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#93a1a6]';

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0e16] text-[#dfe2ee]">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(76,215,246,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(76,215,246,0.06)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full bg-[#06b6d4]/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-[#4edea3]/5 blur-[120px]" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center px-5 py-10 lg:grid-cols-[1.1fr_440px] lg:gap-16">
        <section className="hidden lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#06b6d4]/40 bg-[#06b6d4]/10 shadow-[0_0_24px_rgba(6,182,212,0.15)]">
              <span className="material-symbols-outlined text-[26px] text-[#4cd7f6]">sms</span>
            </div>
            <div>
              <div className="text-[22px] font-bold tracking-tight text-white">MsgSync</div>
              <div className="font-code-metric text-[10px] uppercase tracking-[0.2em] text-[#4cd7f6]">Network Operations Center</div>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#4edea3]/25 bg-[#4edea3]/5 px-3 py-1.5 font-code-metric text-[10px] uppercase tracking-[0.14em] text-[#4edea3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3] shadow-[0_0_8px_#4edea3]" />
              All systems operational
            </div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
              Secure access to your global messaging network.
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-7 text-[#93a1a6]">
              Monitor traffic, manage carriers, and resolve delivery events from one protected operator console.
            </p>
          </div>

          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              { icon: 'encrypted', label: 'AES-256', detail: 'Encryption' },
              { icon: 'verified_user', label: 'JWT + 2FA', detail: 'Identity' },
              { icon: 'policy', label: 'Audit Log', detail: 'Compliance' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-[#293240] bg-[#12161f]/80 p-4 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[20px] text-[#4cd7f6]">{item.icon}</span>
                <div className="mt-3 font-code-metric text-[12px] font-semibold text-[#dfe2ee]">{item.label}</div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-[#68767b]">{item.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#354148] bg-[#181c24]/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 lg:hidden">
                <span className="material-symbols-outlined text-[24px] text-[#4cd7f6]">sms</span>
                <span className="font-bold text-white">MsgSync NOC</span>
              </div>
              <h2 className="text-[24px] font-semibold tracking-tight text-white">
                {twoFactorToken ? 'Verify your identity' : isRegistering ? 'Create operator account' : 'Operator sign in'}
              </h2>
              <p className="mt-1.5 text-[13px] leading-5 text-[#869397]">
                {twoFactorToken
                  ? 'Enter the six-digit code from your authenticator app.'
                  : isRegistering
                    ? 'Bootstrap the first account for this MsgSync organization.'
                    : 'Use your assigned credentials to access the console.'}
              </p>
            </div>
            {!twoFactorToken && (
              <span className="rounded-md border border-[#3d494c] bg-[#0a0e16] px-2 py-1 font-code-metric text-[9px] uppercase tracking-[0.12em] text-[#4cd7f6]">
                Secure
              </span>
            )}
          </div>

          {error && (
            <div role="alert" className="mb-5 flex items-start gap-2.5 rounded-lg border border-[#ef4444]/35 bg-[#ef4444]/10 px-3.5 py-3 text-[12px] leading-5 text-[#ffb4ab]">
              <span className="material-symbols-outlined mt-0.5 text-[17px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={twoFactorToken ? handleVerify2FA : isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {twoFactorToken ? (
              <div>
                <label htmlFor="two-factor-code" className={labelClass}>Authentication code</label>
                <input
                  id="two-factor-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoFocus
                  maxLength={6}
                  placeholder="000000"
                  className={`${inputClass} text-center font-code-metric text-[24px] tracking-[0.45em]`}
                />
                <div className="mt-2 flex justify-between font-code-metric text-[10px] text-[#68767b]">
                  <span>Code refreshes automatically</span>
                  <span>{twoFactorCode.length}/6</span>
                </div>
              </div>
            ) : (
              <>
                {isRegistering && (
                  <div>
                    <label htmlFor="name" className={labelClass}>Full name</label>
                    <input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Marcus Vance" className={inputClass} />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className={labelClass}>Work email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3 top-2.5 text-[20px] text-[#68767b]">mail</span>
                    <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="operator@company.com" className={`${inputClass} pl-10`} />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className={labelClass}>Password</label>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-3 top-2.5 text-[20px] text-[#68767b]">lock</span>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={isRegistering ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={isRegistering ? 8 : undefined}
                      placeholder="Enter your password"
                      className={`${inputClass} pl-10 pr-11`}
                    />
                    <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1.5 flex h-8 w-8 items-center justify-center rounded-md text-[#68767b] transition hover:bg-[#262a33] hover:text-[#dfe2ee]">
                      <span className="material-symbols-outlined text-[19px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>

                {isRegistering && (
                  <div className="grid grid-cols-3 gap-2 rounded-lg border border-[#293240] bg-[#0a0e16] p-3">
                    {passwordChecks.map(check => (
                      <div key={check.label} className={`flex items-center gap-1.5 text-[10px] ${check.valid ? 'text-[#4edea3]' : 'text-[#68767b]'}`}>
                        <span className="material-symbols-outlined text-[14px]">{check.valid ? 'check_circle' : 'circle'}</span>
                        {check.label}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#06b6d4] text-[13px] font-bold text-[#003640] shadow-[0_0_18px_rgba(6,182,212,0.18)] transition hover:bg-[#22c7e3] hover:shadow-[0_0_24px_rgba(6,182,212,0.3)] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? (
                <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Authenticating...</>
              ) : twoFactorToken ? (
                <>Verify and continue <span className="material-symbols-outlined text-[18px]">arrow_forward</span></>
              ) : isRegistering ? (
                <>Create account <span className="material-symbols-outlined text-[18px]">person_add</span></>
              ) : (
                <>Sign in securely <span className="material-symbols-outlined text-[18px]">login</span></>
              )}
            </button>
          </form>

          {!twoFactorToken && (
            <div className="mt-6 border-t border-[#293240] pt-5 text-center">
              {!isRegistering ? (
                <p className="text-[12px] text-[#869397]">
                  First operator account?{' '}
                  <button type="button" onClick={() => { setIsRegistering(true); setError(''); }} className="font-semibold text-[#4cd7f6] transition hover:text-[#22c7e3]">
                    Create account
                  </button>
                </p>
              ) : (
                <button type="button" onClick={() => { setIsRegistering(false); setError(''); }} className="text-[12px] font-semibold text-[#4cd7f6] transition hover:text-[#22c7e3]">
                  Back to sign in
                </button>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 font-code-metric text-[9px] uppercase tracking-[0.12em] text-[#536066]">
            <span className="material-symbols-outlined text-[13px]">lock</span>
            TLS encrypted session
          </div>
        </section>
      </div>
    </main>
  );
};
