import React, { useState, useEffect } from 'react';
import { Bell, Check, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import api from '../services/api';

interface Notification {
  id: string;
  type: string;
  channel: string;
  message: string;
  read_at: string | null;
  created_at: string;
  user_name?: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('all');

  // BUG FIX: filter change should not re-fetch from server — filtering is client-side.
  // Only load once on mount; filter state just slices the existing array.
  useEffect(() => { loadNotifications(); }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.data || []);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // BUG FIX: update local state instead of full refetch — avoids flicker
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      const now = new Date().toISOString();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? now })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'error':   return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-400" />;
      default:        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-emerald-500/20 bg-emerald-500/5';
      case 'error':   return 'border-red-500/20 bg-red-500/5';
      case 'warning': return 'border-amber-500/20 bg-amber-500/5';
      default:        return 'border-cyan-500/20 bg-cyan-500/5';
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read_at;
    if (filter === 'read')   return !!n.read_at;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  // BUG FIX: replaced all gray-* classes with slate-* to match the app's design system
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadNotifications}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Check className="w-4 h-4" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: 'all',    label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read',   label: `Read (${notifications.length - unreadCount})` },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-700 border-t-cyan-500" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-14 h-14 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 text-base font-medium">No notifications found</p>
            <p className="text-slate-600 text-sm mt-1">
              {filter === 'unread' ? 'All caught up!' : 'Notifications will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`p-5 transition-colors hover:bg-slate-800/30 ${
                  !notification.read_at ? 'border-l-4 border-cyan-500' : 'border-l-4 border-transparent'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`p-2.5 rounded-xl border flex-shrink-0 ${getColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${!notification.read_at ? 'text-white' : 'text-slate-300'}`}>
                          {notification.message}
                        </p>
                        {notification.user_name && (
                          <p className="text-xs text-slate-500 mt-0.5">From: {notification.user_name}</p>
                        )}
                      </div>
                      {!notification.read_at && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="flex-shrink-0 p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4 text-cyan-400" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Bell className="w-3 h-3" />{notification.channel}
                      </span>
                      <span>{new Date(notification.created_at).toLocaleString('en-IN')}</span>
                      {notification.read_at && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Read
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
