'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import AdminNavbar from '@/components/navbar/AdminNavbar';
import {
  Bell,
  Calendar,
  UserPlus,
  Home,
  Trash2,
  Archive,
  LogIn,
  AlertCircle,
  CheckCircle,
  Info,
  Building2,
} from 'lucide-react';

interface AdminNotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: {
    userEmail?: string;
    userRole?: string;
    totalPrice?: number;
    price?: number;
    [key: string]: any;
  };
  read: boolean;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'login' | 'user' | 'booking' | 'property'>('all');

  const getNormalizedType = (notification: AdminNotificationItem): 'login' | 'user' | 'booking' | 'property' | 'property_deleted' | 'other' => {
    const type = (notification.type || '').toLowerCase();
    const title = (notification.title || '').toLowerCase();
    const actionUrl = (notification.actionUrl || '').toLowerCase();

    if (type === 'login') return 'login';
    if (type === 'user') return 'user';
    if (type === 'booking') return 'booking';
    if (type === 'property' || type === 'property_deleted') return type;

    if (actionUrl.includes('/admin/users') || title.includes('user registered')) return 'user';
    if (actionUrl.includes('/admin/bookings') || title.includes('booking')) return 'booking';
    if (actionUrl.includes('/admin/properties') || title.includes('property deleted')) return 'property_deleted';
    if (actionUrl.includes('/admin/properties') || title.includes('property')) return 'property';

    return 'other';
  };

  useEffect(() => {
    fetchAllNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchAllNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleArchiveAll = async () => {
    try {
      await fetch('/api/admin/notifications', {
        method: 'DELETE',
      });
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const filteredNotifications =
    filter === 'all'
      ? notifications
      : notifications.filter(
          (n) => {
            const normalized = getNormalizedType(n);
            return (
              normalized === filter ||
              (filter === 'property' && (normalized === 'property' || normalized === 'property_deleted'))
            );
          }
        );

  const getIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <LogIn className="w-5 h-5 text-green-600" />;
      case 'user':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'booking':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'property':
      case 'property_deleted':
        return <Building2 className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'bg-green-50 border-green-200';
      case 'user':
        return 'bg-blue-50 border-blue-200';
      case 'booking':
        return 'bg-purple-50 border-purple-200';
      case 'property':
        return 'bg-orange-50 border-orange-200';
      case 'property_deleted':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
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
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const loginCount = notifications.filter((n) => getNormalizedType(n) === 'login').length;
  const userCount = notifications.filter((n) => getNormalizedType(n) === 'user').length;
  const bookingCount = notifications.filter((n) => getNormalizedType(n) === 'booking').length;
  const propertyCount = notifications.filter((n) => {
    const normalized = getNormalizedType(n);
    return normalized === 'property' || normalized === 'property_deleted';
  }).length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      <AdminNavbar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
                    <Bell className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                </div>
                <p className="text-sm text-gray-600">
                  Stay updated with all platform activities and events
                </p>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={handleArchiveAll}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition font-medium shadow-lg hover:shadow-xl"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
                <p className="text-gray-600 text-sm font-medium">Total</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{notifications.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition">
                <p className="text-gray-600 text-sm font-medium">Unread</p>
                <p className="text-xl font-bold text-teal-600 mt-1">{unreadCount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition">
                <p className="text-blue-600 text-sm font-medium">Logins</p>
                <p className="text-xl font-bold text-blue-700 mt-1">{loginCount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm hover:shadow-md transition">
                <p className="text-green-600 text-sm font-medium">Bookings</p>
                <p className="text-xl font-bold text-green-700 mt-1">{bookingCount}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm hover:shadow-md transition">
                <p className="text-orange-600 text-sm font-medium">Properties</p>
                <p className="text-xl font-bold text-orange-700 mt-1">{propertyCount}</p>
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-700 mb-3">Filter by Type</p>
            <div className="flex gap-3 flex-wrap">
              {(['all', 'login', 'user', 'booking', 'property'] as const).map((f) => {
                const getCount = () => {
                  switch (f) {
                    case 'all': return notifications.length;
                    case 'login': return loginCount;
                    case 'user': return userCount;
                    case 'booking': return bookingCount;
                    case 'property': return propertyCount;
                    default: return 0;
                  }
                };
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 ${
                      filter === f
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-teal-400 hover:bg-teal-50'
                    }`}
                  >
                    <span>
                      {f === 'all' ? 'All' : f === 'login' ? 'Logins' : f === 'user' ? 'Users' : f === 'booking' ? 'Bookings' : 'Properties'}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      filter === f
                        ? 'bg-white/30'
                        : 'bg-gray-100'
                    }`}>
                      {getCount()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-4">
            {loading && (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-3">
                  <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                  <span className="text-gray-600 font-medium">Loading notifications...</span>
                </div>
              </div>
            )}

            {!loading && filteredNotifications.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="inline-block p-4 bg-gray-100 rounded-2xl mb-4">
                  <Bell className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-800 font-semibold text-lg">No notifications</p>
                <p className="text-gray-500 text-sm mt-1">You're all caught up!</p>
              </div>
            )}

            {filteredNotifications.map((notification) => {
              const normalizedType = getNormalizedType(notification);
              return (
              <div
                key={notification._id}
                className={`group bg-white rounded-xl border-l-4 overflow-hidden transition duration-300 hover:shadow-lg ${
                  getTypeColor(normalizedType)
                } ${!notification.read ? 'shadow-md' : 'shadow-sm'}`}
              >
                <div
                  onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                  className="p-6 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Icon and Content */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-1 p-2 bg-white/60 rounded-lg">
                        {getIcon(normalizedType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Title and Badge */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-bold text-base text-gray-900 leading-tight">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!notification.read && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded-full whitespace-nowrap">
                                <span className="w-2 h-2 bg-teal-600 rounded-full animate-pulse"></span>
                                New
                              </span>
                            )}
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Message */}
                        <p className="text-gray-700 mb-4 leading-relaxed">{notification.message}</p>

                        {/* Metadata */}
                        {notification.metadata && (
                          <div className="mt-4 bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-lg p-4 space-y-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {notification.metadata.userEmail && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Email:</span>
                                  <span className="text-sm text-gray-800 font-medium truncate">
                                    {notification.metadata.userEmail}
                                  </span>
                                </div>
                              )}
                              {notification.metadata.userRole && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Role:</span>
                                  <span className="text-sm text-gray-800 font-medium capitalize px-2 py-1 bg-white rounded border border-gray-200">
                                    {notification.metadata.userRole}
                                  </span>
                                </div>
                              )}
                              {notification.metadata.totalPrice !== undefined && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount:</span>
                                  <span className="text-sm font-bold text-green-600">
                                    ${notification.metadata.totalPrice}
                                  </span>
                                </div>
                              )}
                              {notification.metadata.price !== undefined && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Price/Night:</span>
                                  <span className="text-sm font-bold text-green-600">
                                    ${notification.metadata.price}
                                  </span>
                                </div>
                              )}
                              {notification.metadata.loginTime && (
                                <div className="flex items-center gap-2 md:col-span-2">
                                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Login:</span>
                                  <span className="text-sm text-gray-800 font-medium">
                                    {new Date(notification.metadata.loginTime).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification._id);
                      }}
                      className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
