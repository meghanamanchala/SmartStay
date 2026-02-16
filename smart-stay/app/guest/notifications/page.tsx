'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import GuestNavbar from '@/components/navbar/GuestNavbar';
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

export default function NotificationsPage() {
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        Loading...
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow text-center">
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
      <GuestNavbar />
      <main className="flex-1 p-8 ml-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-gray-500 mt-1">
              {filteredNotifications.length > 0
                ? `${filteredNotifications.length} notification${
                    filteredNotifications.length !== 1 ? 's' : ''
                  }`
                : 'No notifications'}
            </p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={handleArchiveAll}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700"
            >
              <Archive size={18} />
              Archive All
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6 border-b border-gray-200">
          {['all', 'booking', 'message', 'review'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                filter === tab
                  ? 'text-teal-600 border-teal-600'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No notifications</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'all'
                ? 'You are all caught up!'
                : `No ${filter} notifications yet`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>

                  {/* Content */}
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

                  {/* Delete Button */}
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
      </main>
    </div>
  );
}
