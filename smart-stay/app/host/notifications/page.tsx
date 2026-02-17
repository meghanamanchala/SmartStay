'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import HostNavbar from '@/components/navbar/HostNavbar';
import { Bell, Calendar, MessageSquare, Star, Trash2, Archive } from 'lucide-react';

interface NotificationItem {
  _id: string;
  type: 'booking' | 'message' | 'review';
  title: string;
  message: string;
  actionUrl?: string;
  timestamp: string;
  read: boolean;
}

export default function HostNotificationsPage() {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'booking' | 'message' | 'review'>('all');

  useEffect(() => {
    fetchAllNotifications();
  }, []);

  const fetchAllNotifications = async () => {
    try {
      const response = await fetch('/api/guest/notifications?since=0');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setNotifications(notifications.filter((n) => n._id !== id));
  };

  const handleArchiveAll = () => {
    setNotifications([]);
  };

  const filteredNotifications =
    filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'review':
        return <Star className="w-5 h-5 text-amber-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-50 border-blue-200';
      case 'message':
        return 'bg-purple-50 border-purple-200';
      case 'review':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const normalizeActionUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith('/host/bookings/')) return '/host/bookings';
    return url;
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-gray-600 font-medium">
          Loading notifications...
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-teal-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to log in to view notifications.</p>
          <a href="/auth/login" className="text-teal-500 font-semibold hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <HostNavbar />
      <main className="flex-1 p-10 ml-64">
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
            Notifications
          </h1>
          <p className="text-gray-600 font-medium">
            {filteredNotifications.length > 0
              ? `${filteredNotifications.length} notification${filteredNotifications.length !== 1 ? "s" : ""}`
              : "You are all caught up!"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="flex gap-2 px-6 pt-4 border-b border-gray-100">
            {['all', 'booking', 'message', 'review'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as any)}
                className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition ${
                  filter === tab
                    ? 'text-teal-700 bg-teal-50 border-b-2 border-teal-600'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
                <Bell size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-600 text-lg font-semibold">No notifications</p>
              <p className="text-gray-400 text-sm mt-1">
                {filter === 'all' ? 'You are all caught up!' : `No ${filter} notifications yet`}
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredNotifications.map((notification) => {
                const actionUrl = normalizeActionUrl(notification.actionUrl);
                return (
                  <div
                    key={notification._id}
                    className={`p-4 rounded-lg border-2 transition hover:shadow-md ${getTypeColor(
                      notification.type
                    )}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.timestamp).toLocaleString()}
                          </span>
                          {actionUrl && (
                            <a
                              href={actionUrl}
                              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                            >
                              View Details →
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteNotification(notification._id)}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
