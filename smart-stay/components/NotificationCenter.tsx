'use client';

import React, { useState } from 'react';
import { useNotification } from '@/context/NotificationContext';
import {
  Bell,
  X,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
} from 'lucide-react';

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'booking':
      return <Calendar className="w-5 h-5 text-blue-500" />;
    case 'message':
      return <MessageSquare className="w-5 h-5 text-purple-500" />;
    case 'review':
      return <CheckCircle className="w-5 h-5 text-amber-500" />;
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'booking':
      return 'bg-blue-50 border-blue-200';
    case 'message':
      return 'bg-purple-50 border-purple-200';
    case 'review':
      return 'bg-amber-50 border-amber-200';
    case 'success':
      return 'bg-green-50 border-green-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'info':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const normalizeActionUrl = (url?: string) => {
  if (!url) return undefined;
  if (url.startsWith('/host/bookings/')) return '/host/bookings';
  return url;
};

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, removeNotification } = useNotification();
  const [showPanel, setShowPanel] = useState(false);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition border border-gray-200"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="absolute top-16 right-0 w-96 max-h-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 flex items-center justify-between">
            <h3 className="font-bold text-lg">Notifications</h3>
            <button
              onClick={() => setShowPanel(false)}
              className="hover:bg-teal-700 p-1 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto max-h-80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const actionUrl = normalizeActionUrl(notification.actionUrl);
                return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id)}
                  className={`border-b border-gray-100 p-4 cursor-pointer transition hover:bg-gray-50 ${getNotificationColor(
                    notification.type
                  )} ${!notification.read ? 'bg-opacity-50' : 'bg-opacity-20'}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-teal-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </span>
                        {actionUrl && (
                          <a
                            href={actionUrl}
                            className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPanel(false);
                            }}
                          >
                            View
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 p-3 bg-gray-50 text-center">
              <a href="/guest/notifications" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                View All Notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Inline Toast Notifications
export const NotificationToast = () => {
  const { notifications, removeNotification } = useNotification();

  const toastNotifications = notifications.filter(
    (n) => n.type === 'success' || n.type === 'error' || n.type === 'info'
  );

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-40 pointer-events-none">
      {toastNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`pointer-events-auto p-4 rounded-lg shadow-lg border flex items-center gap-3 max-w-sm ${getNotificationColor(
            notification.type
          )} animate-slideUp`}
        >
          {getNotificationIcon(notification.type)}
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-gray-900">{notification.title}</h4>
            <p className="text-xs text-gray-600">{notification.message}</p>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
