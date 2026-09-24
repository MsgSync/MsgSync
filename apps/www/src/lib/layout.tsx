'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authService } from './auth';
import { MessageCircle, BarChart3, Users, Settings, LogOut, Menu, Sparkles } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/campaigns', label: 'Campaigns', icon: MessageCircle },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/billing', label: 'Billing', icon: Settings },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await authService.verifyToken();
      setUser(userData);
    };
    
    if (authService.isAuthenticated()) {
      loadUser();
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
                    <span className="text-white font-bold">M</span>
                  </div>
                  <span className="font-heading font-semibold">MsgSync</span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <span className="sr-only">Close sidebar</span>
                  ✕
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === item.href
                        ? 'bg-brand/10 text-brand'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-brand'
                      }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile User Area */}
              <div className="p-4 border-t">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                      <span className="text-brand font-semibold">
                        {user.name?.charAt(0) || user.email?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.role}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand/90 transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col h-full bg-white border-r">
          {/* Logo */}
          <div className="p-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading font-semibold text-xl">MsgSync</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${pathname === item.href
                    ? 'bg-brand/10 text-brand'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-brand'
                  }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Area */}
          <div className="p-4 border-t">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand/10 flex items-center justify-center">
                  <span className="text-brand font-semibold">
                    {user.name?.charAt(0) || user.email?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user.role}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand/90 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <div className="sticky top-0 z-40 bg-white border-b px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="font-heading font-semibold">MsgSync</span>
            </Link>
            <div className="w-6"></div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}n