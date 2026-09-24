import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../lib/api/client';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { login, register, isAuthenticated } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ssoProvider, setSsoProvider] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) onLoginSuccess();
  }, [isAuthenticated, onLoginSuccess]);

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [email, password, login, onLoginSuccess]);

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

  const handleSSO = useCallback((provider: string) => {
    setSsoProvider(provider);
    window.location.href = `#/auth/sso/${provider}`;
  }, []);

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f131c 0%, #1a1f2e 100%)'
    }}>
      <div style={{
        width: 420, padding: 40, borderRadius: 16,
        background: '#181c24', border: '1px solid #3d494c', boxShadow: '0 0 40px rgba(6,182,212,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#06b6d4' }}>shield</span>
          <h1 style={{ color: '#dfe2ee', fontSize: 24, fontWeight: 700, marginTop: 8 }}>MsgSync NOC</h1>
          <p style={{ color: '#869397', fontSize: 14, marginTop: 4 }}>Operator Console Login</p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#2a1b1e', border: '1px solid #ef4444/40', color: '#ffb4ab', fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!ssoProvider ? (
          <form onSubmit={isRegistering ? handleRegister : handleLogin}>
            {isRegistering && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#bcc9cd', fontSize: 12, marginBottom: 4 }}>Full Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  required placeholder="Marcus Vance"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: '#0a0e16', border: '1px solid #3d494c', color: '#dfe2ee', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            )}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#bcc9cd', fontSize: 12, marginBottom: 4 }}>Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required placeholder="admin@msgsync.com"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: '#0a0e16', border: '1px solid #3d494c', color: '#dfe2ee', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: '#bcc9cd', fontSize: 12, marginBottom: 4 }}>Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required placeholder="••••••••"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: '#0a0e16', border: '1px solid #3d494c', color: '#dfe2ee', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: 8, background: '#06b6d4',
              color: '#00424f', fontWeight: 700, fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Authenticating...' : isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#bcc9cd', fontSize: 14, marginBottom: 16 }}>Redirecting to {ssoProvider}...</p>
          </div>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          {!isRegistering ? (
            <p style={{ color: '#869397', fontSize: 13 }}>
              No account?{' '}
              <button onClick={() => setIsRegistering(true)} style={{ color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
                Create one
              </button>
            </p>
          ) : (
            <button onClick={() => setIsRegistering(false)} style={{ color: '#06b6d4', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 13 }}>
              Back to sign in
            </button>
          )}
        </div>

        <div style={{ marginTop: 24, borderTop: '1px solid #3d494c', paddingTop: 16 }}>
          <p style={{ color: '#869397', fontSize: 12, textAlign: 'center', marginBottom: 12 }}>Or continue with</p>
          <div style={{ display: 'flex', gap: 12 }}>
            {['google', 'github'].map((provider) => (
              <button key={provider} onClick={() => handleSSO(provider)} style={{
                flex: 1, padding: '10px', borderRadius: 8, background: '#262a33',
                border: '1px solid #3d494c', color: '#dfe2ee', cursor: 'pointer',
                fontSize: 13, textTransform: 'capitalize'
              }}>
                <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: 4 }}>account_circle</span>
                {provider}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
