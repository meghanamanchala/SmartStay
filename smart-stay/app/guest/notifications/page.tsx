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
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const handleArchiveAll = () => {
    setNotifications([]);
  };

  const filteredNotifications =
    filter === 'all'
      ? notifications
      : notifications.filter((n) => n.type && n.type.toLowerCase() === filter.toLowerCase());

  const getIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'review':
        return <Star className="w-5 h-5 text-amber-600" />;
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
        <div className="rounded-2xl border border-gray-100 bg-white px-8 py-6 shadow-lg text-gray-600 font-medium">
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
          <a href="/auth/login" className="text-teal-600 font-semibold hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      <GuestNavbar />
      <main className="flex-1 p-6 md:p-10 ml-0 md:ml-64">
        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-teal-600 mb-1">Notifications</h1>
              <p className="text-gray-600 font-medium">
                {filteredNotifications.length > 0
                  ? `${filteredNotifications.length} notification${
                      filteredNotifications.length !== 1 ? 's' : ''
                    }`
                  : 'You are all caught up!'}
              </p>
            </div>

            {notifications.length > 0 && (
              <button
                onClick={handleArchiveAll}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition font-semibold text-gray-700 shadow-sm w-fit"
              >
                <Archive size={18} />
                Archive All
              </button>
            )}
          </div>
        </div>

        <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-lg px-4 pt-3">
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'booking', 'message', 'review'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab as 'all' | 'booking' | 'message' | 'review')}
                className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition whitespace-nowrap ${
                  filter === tab
                    ? 'text-teal-700 bg-teal-50 border-teal-600'
                    : 'text-gray-500 border-transparent hover:text-gray-800'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 rounded-2xl border border-gray-100 bg-white shadow text-gray-500">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 shadow-lg">
            <div className="w-14 h-14 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center">
              <Bell className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-gray-700 text-lg font-semibold">No notifications</p>
            <p className="text-gray-400 text-sm mt-1">
              {filter === 'all' ? 'You are all caught up!' : `No ${filter} notifications yet`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => {
              const actionUrl = normalizeActionUrl(notification.actionUrl);
              let dateLabel = 'Invalid Date';
              if (notification.timestamp) {
                const dateObj = new Date(notification.timestamp);
                if (!isNaN(dateObj.getTime())) {
                  dateLabel = dateObj.toLocaleString();
                } else if (typeof notification.timestamp === 'number') {
                  dateLabel = new Date(notification.timestamp).toLocaleString();
                }
              } else {
                dateLabel = new Date().toLocaleString();
              }
              return (
                <div
                  key={notification._id}
                  className={`rounded-2xl border p-4 md:p-5 transition hover:shadow-md ${
                    notification.read ? 'bg-white border-gray-200' : `${getTypeColor(notification.type)}`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1 w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center">
                      {getIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                      <p className="text-gray-600 text-sm mt-1 leading-relaxed">{notification.message}</p>

                      <div className="flex items-center justify-between mt-3 gap-3">
                        <span className="text-xs text-gray-500">
                          {dateLabel}
                        </span>
                        {actionUrl && (
                          <a
                            href={actionUrl}
                            className="text-sm text-teal-600 hover:text-teal-700 font-semibold"
                          >
                            View Details →
                          </a>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteNotification(notification._id)}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition rounded-lg hover:bg-red-50"
                      aria-label="Delete notification"
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
