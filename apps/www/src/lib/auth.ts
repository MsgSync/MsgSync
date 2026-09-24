interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'reseller';
}

interface AuthResponse {
  user: User;
  token: string;
}

export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async setAuth(data: Record<string, any>): void {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result: AuthResponse = await response.json();
      localStorage.setItem('auth_token', result.token);
      this.token = result.token;
    } catch (error) {
      console.error('Auth error:', error);
      throw error;
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.token = null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  async verifyToken(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) return null;
      
      return await response.json();
    } catch (error) {
      console.error('Token verification error:', error);
      this.logout();
      return null;
    }
  }
}

export const authService = AuthService.getInstance();
export { AuthService };