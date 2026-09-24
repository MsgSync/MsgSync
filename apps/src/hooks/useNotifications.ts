import { useState, useCallback, useEffect } from 'react';
import { NotificationItem } from '../lib/api/types';
import { apiClient } from '../lib/api/client';

const STORAGE_KEY = 'msgsync_notifications';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from localStorage or API
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch {}
    }
    fetchNotifications();
  }, []);

  const persistNotifications = useCallback((items: NotificationItem[]) => {
    setNotifications(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, []);

  const fetchNotifications = async () => {
    try {
      const result = await apiClient.get<{ data: NotificationItem[] }>('/api/audit');
      // Map audit logs to notifications if needed
    } catch {}
    setLoading(false);
  };

  const markAsRead = useCallback((id: string) => {
    persistNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, [notifications, persistNotifications]);

  const markAllRead = useCallback(() => {
    persistNotifications(notifications.map((n) => ({ ...n, read: true })));
  }, [notifications, persistNotifications]);

  const clearAll = useCallback(() => {
    persistNotifications([]);
  }, [persistNotifications]);

  const addNotification = useCallback((notification: NotificationItem) => {
    persistNotifications([notification, ...notifications]);
  }, [notifications, persistNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllRead,
    clearAll,
    addNotification,
  };
}

export function useSession() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const token = apiClient.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const result = await apiClient.getCurrentUser();
      setCurrentUser(result.data);
    } catch {}
    setLoading(false);
  };

  const revokeSessions = useCallback(() => {
    setSessions((prev) =>
      prev.map((s) => (s.isCurrent ? s : { ...s, status: 'TERMINATED' }))
    );
  }, []);

  return {
    sessions,
    currentUser,
    loading,
    revokeSessions,
    setCurrentUser,
  };
}
