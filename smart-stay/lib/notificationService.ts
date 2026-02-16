import { MongoClient } from 'mongodb';
import clientPromise from '@/lib/mongodb';

interface NotificationData {
  type: 'booking' | 'message' | 'review' | 'success' | 'error' | 'info';
  recipientEmail: string;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export async function createNotification(data: NotificationData) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const notification = {
      type: data.type,
      recipientEmail: data.recipientEmail,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      metadata: data.metadata || {},
      read: false,
      createdAt: new Date(),
    };

    const result = await db.collection('notifications').insertOne(notification);
    return result;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

export async function getNotifications(
  email: string,
  since: Date = new Date(Date.now() - 24 * 60 * 60 * 1000)
) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const notifications = await db
      .collection('notifications')
      .find({
        recipientEmail: email,
        createdAt: { $gt: since },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return notifications;
  } catch (error) {
    console.error('Failed to get notifications:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const client = await clientPromise;
    const db = client.db();

    const result = await db
      .collection('notifications')
      .updateOne(
        { _id: new (await import('mongodb')).ObjectId(notificationId) },
        { $set: { read: true } }
      );

    return result;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
}

export type NotificationType = 'booking' | 'message' | 'review' | 'success' | 'error' | 'info';
